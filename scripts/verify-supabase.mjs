// Live end-to-end verification of the MeCart Supabase backend.
//
// Exercises CRUD across every module, RLS behaviour, auth sign-in,
// auth sign-up trigger, and storage buckets. Run with:
//
//   node scripts/verify-supabase.mjs
//
// Requires .env.local (NEXT_PUBLIC_SUPABASE_URL / keys / ADMIN_EMAIL)
// and .env (ADMIN_PASSWORD).

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// --- env --------------------------------------------------------------------

function readEnv(file) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const env = { ...readEnv(".env"), ...readEnv(".env.local") };
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = env.ADMIN_EMAIL || "admin@mecart.local";
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

if (!URL || !ANON || !SERVICE || !ADMIN_PASSWORD) {
  console.error("Missing env values (need URL, anon key, service key, ADMIN_PASSWORD).");
  process.exit(1);
}

const service = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

// --- tiny test harness ------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function ok(name, message = "") {
  passed += 1;
  console.log(`  PASS  ${name}${message ? ` — ${message}` : ""}`);
}

function bad(name, message) {
  failed += 1;
  failures.push(`${name}: ${message}`);
  console.log(`  FAIL  ${name} — ${message}`);
}

function expect(cond, name, detail) {
  if (cond) ok(name, detail);
  else bad(name, detail);
}

// --- main -------------------------------------------------------------------

const ts = Date.now();
const created = []; // { table, id } — cleaned up in reverse order
let tempUserId = null;

function track(table, id, pk = "id") {
  created.push({ table, id, pk });
  return id;
}

async function insertRow(table, payload, pk = "id") {
  const { data, error } = await service.from(table).insert(payload).select("*").single();
  if (error) throw new Error(`insert ${table}: ${error.message}`);
  track(table, data[pk], pk);
  return data;
}

async function updateRow(table, key, pk, patch, checkField) {
  const { data, error } = await service.from(table).update(patch).eq(pk, key).select("*").single();
  if (error) throw new Error(`update ${table}: ${error.message}`);
  if (checkField && String(data[checkField]) !== String(patch[checkField])) {
    throw new Error(`update ${table}: ${checkField} did not change`);
  }
  return data;
}

async function crud(table, name, payload, update, pk = "id") {
  try {
    const row = await insertRow(table, payload, pk);
    if (update) {
      await updateRow(table, row[pk], pk, update.patch, update.field);
    }
    const { data, error } = await service.from(table).select(pk).eq(pk, row[pk]).single();
    if (error || !data) throw new Error(error?.message || "row not found after insert");
    ok(`${name} (${table})`, update ? "insert → update → select" : "insert → select");
    return row;
  } catch (error) {
    bad(`${name} (${table})`, error.message);
    return null;
  }
}

async function main() {
  console.log(`\n== MeCart Supabase verification @ ${new Date().toISOString()} ==\n`);

  // --- admin auth -----------------------------------------------------------
  console.log("Auth");
  const authed = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: signIn, error: signInError } = await authed.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  expect(!signInError && !!signIn.user, "admin sign-in", signInError?.message);
  const adminId = signIn?.user?.id;

  if (adminId) {
    const { data: profile } = await authed.from("profiles").select("role, username").eq("id", adminId).single();
    expect(profile?.role === "admin", "admin profile role via RLS", `role=${profile?.role}`);
    const { data: isAdmin } = await authed.rpc("is_admin");
    expect(isAdmin === true, "rpc is_admin()", String(isAdmin));
    const { data: refreshed, error: refreshError } = await authed.auth.refreshSession();
    expect(!refreshError && !!refreshed?.session, "session refresh", refreshError?.message);
    await authed.auth.signOut();
  }

  // sign-up flow (auto-confirm) creating profile via trigger
  const tempEmail = `zztest+${ts}@example.com`;
  const signupClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: signUp, error: signUpError } = await signupClient.auth.signUp({
    email: tempEmail,
    password: `ZzTest-${ts}-pw!`,
    options: { data: { full_name: "ZZ Test" } },
  });
  expect(!signUpError && !!signUp?.user, "customer sign-up", signUpError?.message);
  tempUserId = signUp?.user?.id ?? null;
  if (tempUserId) {
    await new Promise((r) => setTimeout(r, 800)); // let triggers settle
    const { data: tempProfile } = await service.from("profiles").select("id, role").eq("id", tempUserId).maybeSingle();
    expect(tempProfile?.id === tempUserId, "sign-up profile trigger");
  }

  const { error: wrongPasswordError } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: `definitely-wrong-${ts}`,
  });
  expect(!!wrongPasswordError, "wrong password rejected", wrongPasswordError?.message);

  const { data: recoveryLink, error: recoveryLinkError } = await service.auth.admin.generateLink({
    type: "recovery",
    email: tempEmail,
    options: { redirectTo: "https://me-cart.vercel.app/reset-password" },
  });
  expect(
    !recoveryLinkError && !!recoveryLink?.properties?.action_link,
    "recovery link generation",
    recoveryLinkError?.message ?? "action link returned",
  );

  // anonymous guest session (cart & wishlist contexts depend on it)
  const guestClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: guest, error: guestError } = await guestClient.auth.signInAnonymously();
  expect(
    !guestError && !!guest?.user?.is_anonymous,
    "anonymous guest sign-in",
    guestError?.message ?? "is_anonymous=true",
  );
  if (guest?.user) {
    await new Promise((r) => setTimeout(r, 800));
    const { data: guestProfile } = await service
      .from("profiles")
      .select("id")
      .eq("id", guest.user.id)
      .maybeSingle();
    expect(guestProfile?.id === guest.user.id, "anonymous profile trigger");
    const { error: guestDeleteError } = await service.auth.admin.deleteUser(guest.user.id);
    if (guestDeleteError) console.log(`  note: anon user cleanup — ${guestDeleteError.message}`);
  }

  // --- reference data -------------------------------------------------------
  console.log("\nReference data");
  const category = await crud(
    "categories",
    "categories CRUD",
    { name: `ZZ Test Category ${ts}`, slug: `zz-test-category-${ts}` },
    { patch: { position: 99 }, field: "position" },
  );
  const brand = await crud("brands", "brands CRUD", { name: `ZZ Brand ${ts}`, slug: `zz-brand-${ts}` });
  let subCategory = null;
  if (category) {
    subCategory = await crud("sub_categories", "sub_categories CRUD", {
      category_id: category.id,
      name: `ZZ Sub ${ts}`,
      slug: `zz-sub-${ts}`,
    });
  }

  // --- catalog --------------------------------------------------------------
  console.log("\nCatalog");
  let product = null;
  if (category) {
    product = await crud(
      "products",
      "products CRUD",
      {
        name: `ZZ Product ${ts}`,
        slug: `zz-product-${ts}`,
        sku: `ZZ-SKU-${ts}`,
        description: "verification product",
        original_price: 100,
        discount_percent: 10,
        final_price: 90,
        category_id: category.id,
        brand_id: brand?.id ?? null,
        sub_category_id: subCategory?.id ?? null,
      },
      { patch: { final_price: 95 }, field: "final_price" },
    );
  }
  if (product) {
    await crud("product_images", "product_images CRUD", {
      product_id: product.id,
      url: `https://example.com/zz-${ts}.jpg`,
    });
    await crud("product_variants", "product_variants CRUD", {
      product_id: product.id,
      name: `ZZ Variant ${ts}`,
      sku: `ZZ-VAR-${ts}`,
    });
    const inventory = await service
      .from("inventory")
      .select("id, quantity")
      .eq("product_id", product.id)
      .maybeSingle();
    if (inventory.data) ok("inventory auto-provision", `qty=${inventory.data.quantity}`);
    else
      await crud("inventory", "inventory CRUD", { product_id: product.id, quantity: 7 }, { patch: { quantity: 9 }, field: "quantity" });
    await crud("inventory_logs", "inventory_logs CRUD", {
      product_id: product.id,
      change: 5,
      quantity_after: 12,
      reason: "zz-test",
    });
    await crud("reviews", "reviews CRUD", {
      product_id: product.id,
      rating: 5,
      author_name: "ZZ Tester",
      body: "verification review",
    });
  }

  // --- marketing / content --------------------------------------------------
  console.log("\nContent & marketing");
  const coupon = await crud("coupons", "coupons CRUD", { code: `ZZ${ts}`.slice(0, 12), discount_percent: 10 });
  await crud("cms_pages", "cms_pages CRUD", {
    slug: `zz-page-${ts}`,
    title: `ZZ Page ${ts}`,
    content: { blocks: [] },
  });
  await crud("seo", "seo CRUD", { entity_type: "global", meta_title: `ZZ ${ts}` });
  await crud("media_library", "media_library CRUD", {
    bucket: "cms",
    path: `zztest/${ts}.jpg`,
    url: `https://example.com/zz-${ts}.jpg`,
  });

  // --- settings -------------------------------------------------------------
  console.log("\nSettings");
  const setting = await crud(
    "settings",
    "settings CRUD",
    { key: `zz_test_setting_${ts}`, value: { on: true }, is_public: false },
    { patch: { value: { on: false } }, field: "value" },
    "key",
  );
  if (setting) void setting;
  await crud(
    "theme_settings",
    "theme_settings CRUD",
    { key: `zz_test_theme_${ts}`, value: { color: "#000" } },
    undefined,
    "key",
  );

  // --- shipping / tax -------------------------------------------------------
  console.log("\nShipping & tax");
  const zone = await crud("shipping_zones", "shipping_zones CRUD", { name: `ZZ Zone ${ts}` });
  if (zone) {
    await crud("shipping_methods", "shipping_methods CRUD", { zone_id: zone.id, name: `ZZ Method ${ts}`, rate: 49 }, { patch: { rate: 59 }, field: "rate" });
  }
  await crud("tax_rules", "tax_rules CRUD", { name: `ZZ Tax ${ts}`, rate: 5 });

  // --- customer flows -------------------------------------------------------
  console.log("\nCustomer flows");
  if (adminId) {
    await crud(
      "addresses",
      "addresses CRUD",
      {
        user_id: adminId,
        label: "ZZ",
        name: "ZZ Test",
        phone: "+911234567890",
        line1: "1 Test Street",
        city: "Testville",
        state: "TS",
        zip: "000001",
        country: "IN",
      },
      { patch: { label: "ZZ2" }, field: "label" },
    );
    await crud("notifications", "notifications CRUD", { user_id: adminId, title: `ZZ Notification ${ts}`, type: "SYSTEM" }, { patch: { title: `ZZ Notification updated ${ts}` }, field: "title" });

    let cart = null;
    if (product) {
      cart = await crud("carts", "carts CRUD", { user_id: adminId });
      if (cart) {
        await crud("cart_items", "cart_items CRUD", { cart_id: cart.id, product_id: product.id, quantity: 2, unit_price: 90 }, { patch: { quantity: 3 }, field: "quantity" });
      }
      await crud("wishlists", "wishlists CRUD", { user_id: adminId, product_id: product.id });
    }
  }

  // --- orders ---------------------------------------------------------------
  console.log("\nOrders");
  if (product) {
    const order = await crud(
      "orders",
      "orders CRUD",
      {
        order_number: `ZZ-${ts}`,
        invoice_number: `ZZ-INV-${ts}`,
        customer_name: "ZZ Buyer",
        customer_email: `zzbuyer+${ts}@example.com`,
        customer_phone: "+911234567890",
        shipping_address: "1 Test Street",
        city: "Testville",
        zip: "000001",
        subtotal: 180,
        shipping_cost: 49,
        tax: 9,
        discount: 0,
        grand_total: 238,
        status: "PENDING",
        payment_status: "PENDING",
      },
      { patch: { status: "CONFIRMED" }, field: "status" },
    );
    if (order) {
      await crud("order_items", "order_items CRUD", {
        order_id: order.id,
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 2,
        price: 90,
        total: 180,
      });
      await crud("payments", "payments CRUD", { order_id: order.id, method: "COD", amount: 238 }, { patch: { status: "PAID" }, field: "status" });
      await crud("transactions", "transactions CRUD", { order_id: order.id, type: "CHARGE", amount: 238, status: "SUCCESS" });
    }
  }

  // --- observability --------------------------------------------------------
  console.log("\nObservability");
  await crud("activity_logs", "activity_logs CRUD", { action: `zz.test.${ts}` });
  await crud("audit_logs", "audit_logs CRUD", { action: `zz.test.${ts}`, resource: "verification" });
  await crud("analytics_events", "analytics_events CRUD", { name: `zz_test_event_${ts}` });

  // --- RLS ------------------------------------------------------------------
  console.log("\nRLS (anon)");
  const { data: publicProducts, error: publicProductsError } = await anon.from("products").select("id").limit(1);
  expect(!publicProductsError && (publicProducts?.length ?? 0) > 0, "anon can read products");

  const { error: anonInsertError } = await anon
    .from("products")
    .insert({ name: "hack", slug: `hack-${ts}`, sku: `HACK-${ts}`, description: "x", original_price: 1, discount_percent: 0, final_price: 1, category_id: category?.id ?? "00000000-0000-0000-0000-000000000000" });
  expect(!!anonInsertError, "anon insert into products blocked", anonInsertError ? "denied" : "NOT blocked!");

  const { data: anonProfiles } = await anon.from("profiles").select("id").limit(5);
  expect((anonProfiles?.length ?? 0) === 0, "anon cannot read profiles");

  const { data: anonOrders } = await anon.from("orders").select("id").limit(5);
  expect((anonOrders?.length ?? 0) === 0, "anon cannot read orders");

  const { data: publicSettings, error: publicSettingsError } = await anon
    .from("settings")
    .select("key")
    .eq("is_public", true);
  expect(!publicSettingsError && (publicSettings?.length ?? 0) > 0, "anon can read public settings", `${publicSettings?.length ?? 0} rows`);

  if (tempUserId) {
    const { data: customerProfiles } = await signupClient.from("profiles").select("id");
    expect((customerProfiles?.length ?? 0) === 1, "customer reads only own profile", `${customerProfiles?.length ?? 0} rows`);
  }

  // --- RPC ------------------------------------------------------------------
  console.log("\nRPCs");
  const { error: invalidCouponError } = await anon.rpc("validate_coupon_code", {
    p_code: "NOPE-NOPE",
    p_subtotal: 100,
  });
  expect(!!invalidCouponError, "rpc rejects invalid coupon", invalidCouponError?.message);

  if (coupon) {
    const { data: couponCheck, error: couponCheckError } = await anon.rpc("validate_coupon_code", {
      p_code: coupon.code,
      p_subtotal: 100,
    });
    expect(!couponCheckError && !!couponCheck, "rpc accepts valid coupon", JSON.stringify(couponCheck).slice(0, 100));
  }

  // --- storage --------------------------------------------------------------
  console.log("\nStorage");
  const { data: buckets, error: bucketsError } = await service.storage.listBuckets();
  expect(!bucketsError && (buckets?.length ?? 0) >= 10, "list buckets", `${buckets?.length ?? 0} buckets`);

  const testPath = `zztest/verify-${ts}.png`;
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const { error: uploadError } = await service.storage
    .from("product-gallery")
    .upload(testPath, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!uploadError, "upload to product-gallery", uploadError?.message);

  if (!uploadError) {
    const { data: publicUrl } = service.storage.from("product-gallery").getPublicUrl(testPath);
    const res = await fetch(publicUrl.publicUrl);
    expect(res.status === 200, "public download", `HTTP ${res.status}`);
    const { error: removeError } = await service.storage.from("product-gallery").remove([testPath]);
    expect(!removeError, "remove object", removeError?.message);
  }

  const { error: anonUploadError } = await anon.storage
    .from("product-gallery")
    .upload(`zztest/anon-${ts}.png`, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!!anonUploadError, "anon upload blocked", anonUploadError ? "denied" : "NOT blocked!");
  if (!anonUploadError) await service.storage.from("product-gallery").remove([`zztest/anon-${ts}.png`]);

  const { error: customerAvatarError } = await signupClient.storage
    .from("avatars")
    .upload(`zztest/avatar-${ts}.png`, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!customerAvatarError, "customer upload to avatars allowed", customerAvatarError?.message);
  if (!customerAvatarError) await service.storage.from("avatars").remove([`zztest/avatar-${ts}.png`]);

  const { error: customerProductError } = await signupClient.storage
    .from("products")
    .upload(`zztest/staff-only-${ts}.png`, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!!customerProductError, "customer upload to products blocked", customerProductError ? "denied" : "NOT blocked!");
  if (!customerProductError) await service.storage.from("products").remove([`zztest/staff-only-${ts}.png`]);

  const { error: customerReviewError } = await signupClient.storage
    .from("review-images")
    .upload(`zztest/review-${ts}.png`, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!customerReviewError, "customer upload to review-images allowed", customerReviewError?.message);
  if (!customerReviewError) await service.storage.from("review-images").remove([`zztest/review-${ts}.png`]);

  const staffClient = createClient(URL, ANON, { auth: { persistSession: false } });
  await staffClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const { error: staffUploadError } = await staffClient.storage
    .from("products")
    .upload(`zztest/staff-${ts}.png`, new Blob([pngBytes], { type: "image/png" }), { upsert: true });
  expect(!staffUploadError, "staff upload to products allowed", staffUploadError?.message);
  if (!staffUploadError) {
    const { data: staffUrl } = staffClient.storage.from("products").getPublicUrl(`zztest/staff-${ts}.png`);
    const staffRes = await fetch(staffUrl.publicUrl);
    expect(staffRes.status === 200, "staff upload public download", `HTTP ${staffRes.status}`);
    await service.storage.from("products").remove([`zztest/staff-${ts}.png`]);
  }
  await staffClient.auth.signOut();

  // --- reads (seeded reference data) -----------------------------------------
  console.log("\nSeeded reads");
  for (const [table, column, min] of [
    ["roles", "id", 1],
    ["permissions", "id", 1],
    ["admins", "id", 1],
    ["products", "id", 5],
    ["categories", "id", 4],
    ["brands", "id", 4],
    ["cms_pages", "id", 4],
    ["settings", "key", 1],
    ["theme_settings", "key", 1],
  ]) {
    const { count, error } = await service.from(table).select(column, { count: "exact", head: true });
    expect(!error && (count ?? 0) >= min, `read ${table}`, `count=${count ?? "?"}`);
  }
}

async function cleanup() {
  console.log("\nCleanup");
  // Remove temp auth user first (cascades profile rows via FK).
  if (tempUserId) {
    const { error } = await service.auth.admin.deleteUser(tempUserId);
    if (error) console.log(`  note: deleteUser — ${error.message}`);
    else console.log("  temp auth user removed");
  }
  for (const { table, id, pk } of created.reverse()) {
    const { error } = await service.from(table).delete().eq(pk, id);
    if (error) console.log(`  note: could not delete ${table}/${id} — ${error.message}`);
  }
  for (const table of ["settings", "theme_settings"]) {
    const { error } = await service.from(table).delete().like("key", "zz_test_%");
    if (error) console.log(`  note: sweep ${table} — ${error.message}`);
  }
  console.log(`  removed ${created.length} test rows`);
}

try {
  await main();
} catch (error) {
  bad("unexpected", error.stack ?? error.message);
} finally {
  await cleanup();
  console.log(`\n== ${passed} passed, ${failed} failed ==`);
  if (failures.length) {
    console.log("Failures:");
    for (const line of failures) console.log(`  - ${line}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}
