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

  // --- email OTP --------------------------------------------------------------
  console.log("\nEmail OTP");
  const settingsResponse = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: ANON } });
  const authSettings = settingsResponse.ok ? await settingsResponse.json() : null;
  const autoconfirm = authSettings?.mailer_autoconfirm === true;
  console.log(`  note: mailer_autoconfirm=${authSettings ? autoconfirm : "unknown"}`);

  // Unique test IP per run so repeated runs never trip the 15/hour IP throttle.
  const otpTestIp = `203.0.113.${(ts % 250) + 1}`;
  const otpArgs = (email, purpose = "email_verification") => ({
    p_email: email,
    p_purpose: purpose,
    p_expires_in_seconds: 600,
    p_max_resend: 5,
    p_client_ip: otpTestIp,
  });

  // PostgREST may encode a missing composite row as null, [] or {} — normalize.
  const pendingRow = (data) => {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    if (typeof data === "object" && !Object.keys(data).length) return null;
    return data?.id ? data : null;
  };

  // ledger writes stay server-side (service role only)
  const { error: anonOtpError } = await anon.rpc("create_email_otp_request", otpArgs(`zzotp-anon+${ts}@example.com`));
  expect(!!anonOtpError, "otp ledger blocked for anon", anonOtpError ? "denied" : "NOT blocked!");

  const otpEmail = `zzotp+${ts}@example.com`;

  // issue → 60s resend cooldown → pending visibility
  const { data: otpCreate, error: otpCreateError } = await service.rpc("create_email_otp_request", otpArgs(otpEmail));
  expect(!otpCreateError && !!otpCreate?.request_id, "otp request created", otpCreateError?.message ?? `resend_count=${otpCreate?.resend_count}`);
  const otpRequestId = otpCreate?.request_id ?? null;

  const { error: otpCooldownError } = await service.rpc("create_email_otp_request", otpArgs(otpEmail));
  expect(!!otpCooldownError, "otp resend cooldown (60s)", otpCooldownError?.message ?? "NOT enforced!");

  const { data: pendingOtp } = await service.rpc("pending_otp_request", { p_email: otpEmail, p_purpose: "email_verification" });
  expect(pendingRow(pendingOtp)?.id === otpRequestId, "pending otp request visible");

  // five wrong codes lock the request and force a freshly issued one
  let otpLock = null;
  let otpLockError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await service.rpc("verify_email_otp_request", {
      p_email: otpEmail,
      p_purpose: "email_verification",
      p_success: false,
      p_error: "Invalid token",
      p_max_attempts: 5,
    });
    otpLock = data;
    otpLockError = error;
  }
  expect(!otpLockError && otpLock?.attempts === 5 && otpLock?.locked === true, "otp locks after 5 failed attempts", otpLockError?.message ?? `attempts=${otpLock?.attempts} locked=${otpLock?.locked}`);

  const { data: lockedPending } = await service.rpc("pending_otp_request", { p_email: otpEmail, p_purpose: "email_verification" });
  expect(!pendingRow(lockedPending), "locked request not pending");

  const { error: lockedVerifyError } = await service.rpc("verify_email_otp_request", {
    p_email: otpEmail,
    p_purpose: "email_verification",
    p_success: true,
    p_max_attempts: 5,
  });
  expect(!!lockedVerifyError, "locked request rejects attempts", lockedVerifyError?.message ?? "NOT rejected!");

  // fresh code after the lock → success consumes it → replay is impossible
  const { data: otpReissue, error: otpReissueError } = await service.rpc("create_email_otp_request", otpArgs(otpEmail));
  expect(!otpReissueError && !!otpReissue?.request_id, "otp reissued after lockout", otpReissueError?.message ?? `resend_count=${otpReissue?.resend_count}`);

  if (otpReissue?.request_id) {
    const { data: otpVerified, error: otpVerifiedError } = await service.rpc("verify_email_otp_request", {
      p_email: otpEmail,
      p_purpose: "email_verification",
      p_success: true,
      p_max_attempts: 5,
    });
    expect(!otpVerifiedError && otpVerified?.verified === true, "otp success consumes request", otpVerifiedError?.message ?? `attempts=${otpVerified?.attempts}`);

    const { data: consumedPending } = await service.rpc("pending_otp_request", { p_email: otpEmail, p_purpose: "email_verification" });
    expect(!pendingRow(consumedPending), "verified request not pending");

    const { error: otpReplayError } = await service.rpc("verify_email_otp_request", {
      p_email: otpEmail,
      p_purpose: "email_verification",
      p_success: true,
      p_max_attempts: 5,
    });
    expect(!!otpReplayError, "verified otp cannot be replayed", otpReplayError?.message ?? "NOT blocked!");
  }

  // rolling mailbox throttle (max 3 issue events per 30 minutes)
  const { data: otpThird, error: otpThirdError } = await service.rpc("create_email_otp_request", otpArgs(otpEmail));
  expect(!otpThirdError && !!otpThird?.request_id, "third otp request accepted", otpThirdError?.message ?? `resend_count=${otpThird?.resend_count}`);
  const { error: otpThrottleError } = await service.rpc("create_email_otp_request", otpArgs(otpEmail));
  expect(!!otpThrottleError, "otp mailbox throttle (3/30min)", otpThrottleError?.message ?? "NOT enforced!");

  // expiry window on a second mailbox
  const otpEmailB = `zzotp-expiry+${ts}@example.com`;
  const { data: otpB1 } = await service.rpc("create_email_otp_request", otpArgs(otpEmailB));
  if (otpB1?.request_id) {
    await service
      .from("email_otp_requests")
      .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", otpB1.request_id);
    const { data: expiredPending } = await service.rpc("pending_otp_request", { p_email: otpEmailB, p_purpose: "email_verification" });
    expect(!pendingRow(expiredPending), "expired otp not pending");

    const { error: expiredVerifyError } = await service.rpc("verify_email_otp_request", {
      p_email: otpEmailB,
      p_purpose: "email_verification",
      p_success: true,
      p_max_attempts: 5,
    });
    expect(!!expiredVerifyError, "expired otp cannot be verified", expiredVerifyError?.message ?? "NOT accepted!");
  } else {
    bad("otp expiry setup", "second-mailbox request not created");
  }

  const { data: otpB2 } = await service.rpc("create_email_otp_request", otpArgs(otpEmailB));
  if (otpB2?.request_id) {
    const { error: consumedError } = await service.rpc("consumed_email_otp_request", { p_email: otpEmailB, p_purpose: "email_verification" });
    expect(!consumedError, "consumed rpc runs", consumedError?.message ?? "marked");
    const { data: consumedPendingB } = await service.rpc("pending_otp_request", { p_email: otpEmailB, p_purpose: "email_verification" });
    expect(!pendingRow(consumedPendingB), "consumed request not pending");
  } else {
    bad("otp consumed setup", "second-mailbox request not created");
  }

  // OTP-first lifecycle: pending_verification → email_verified → password set
  const otpFirstEmail = `zzotp-first+${ts}@example.com`;
  const { data: otpFirstUser, error: otpFirstError } = await service.auth.admin.createUser({
    email: otpFirstEmail,
    email_confirm: false,
    user_metadata: { full_name: "ZZ OTP First" },
  });
  expect(!otpFirstError && !!otpFirstUser?.user?.id, "otp-first user created", otpFirstError?.message);
  if (otpFirstUser?.user?.id) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const { data: pendingProfile } = await service
      .from("profiles")
      .select("account_status, email_verified_at")
      .eq("id", otpFirstUser.user.id)
      .maybeSingle();
    expect(pendingProfile?.account_status === "pending_verification" && !pendingProfile?.email_verified_at, "otp-first profile pending", `status=${pendingProfile?.account_status}`);

    await service.rpc("create_email_otp_request", otpArgs(otpFirstEmail, "registration"));
    const { data: lifecycleVerify, error: lifecycleVerifyError } = await service.rpc("verify_email_otp_request", {
      p_email: otpFirstEmail,
      p_purpose: "registration",
      p_success: true,
      p_max_attempts: 5,
    });
    expect(!lifecycleVerifyError && lifecycleVerify?.verified === true, "otp-first ledger verify", lifecycleVerifyError?.message ?? `attempts=${lifecycleVerify?.attempts}`);

    const { data: verifiedProfile } = await service
      .from("profiles")
      .select("account_status, email_verified_at")
      .eq("id", otpFirstUser.user.id)
      .maybeSingle();
    expect(verifiedProfile?.account_status === "email_verified" && !!verifiedProfile?.email_verified_at, "profile promoted to email_verified", `status=${verifiedProfile?.account_status}`);

    console.log("  note: account_status drives password routing — hosted GoTrue stores a bcrypt placeholder for passwordless users");

    const { error: setPasswordError } = await service.auth.admin.updateUserById(otpFirstUser.user.id, { password: `ZzOtp-${ts}-pw!` });
    expect(!setPasswordError, "password set after verification", setPasswordError?.message ?? "updated");

    await service.auth.admin.deleteUser(otpFirstUser.user.id);
  }

  // password account without a confirmed e-mail stays gated for the app layer
  const unverifiedEmail = `zzotp-unverified+${ts}@example.com`;
  const { data: unverifiedUser, error: unverifiedCreateError } = await service.auth.admin.createUser({
    email: unverifiedEmail,
    password: `ZzUnverified-${ts}-pw!`,
    email_confirm: false,
  });
  expect(!unverifiedCreateError && !!unverifiedUser?.user?.id, "unverified user created", unverifiedCreateError?.message);
  if (unverifiedUser?.user?.id) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const { data: unverifiedProfile } = await service
      .from("profiles")
      .select("account_status, email_verified_at")
      .eq("id", unverifiedUser.user.id)
      .maybeSingle();
    expect(unverifiedProfile?.account_status === "pending_verification" && !unverifiedProfile?.email_verified_at, "unverified profile flagged pending", `status=${unverifiedProfile?.account_status}`);

    const unverifiedClient = createClient(URL, ANON, { auth: { persistSession: false } });
    const { error: unverifiedSignInError } = await unverifiedClient.auth.signInWithPassword({
      email: unverifiedEmail,
      password: `ZzUnverified-${ts}-pw!`,
    });
    if (autoconfirm) {
      console.log("  note: confirmations disabled on the project — the app-level login gate is the enforcement point");
    } else {
      expect(!!unverifiedSignInError, "unverified login blocked by supabase", unverifiedSignInError?.message ?? "NOT blocked!");
    }
    await service.auth.admin.deleteUser(unverifiedUser.user.id);
  }

  // duplicate registration pre-check (drives the friendly register error)
  const { data: takenCheck } = await anon.rpc("check_signup_available", { p_username: `zzcheck${ts}`, p_email: tempEmail });
  expect(takenCheck?.email_taken === true, "duplicate email detected", JSON.stringify(takenCheck));
  const { data: freeCheck } = await anon.rpc("check_signup_available", { p_username: `zzcheck${ts}`, p_email: `zzotp-free+${ts}@example.com` });
  expect(freeCheck?.email_taken === false && freeCheck?.username_taken === false, "fresh email available", JSON.stringify(freeCheck));

  // real Supabase OTP handling (GoTrue magic-link + recovery codes)
  if (tempUserId) {
    const { data: magicLink, error: magicLinkError } = await service.auth.admin.generateLink({ type: "magiclink", email: tempEmail });
    const emailOtp = magicLink?.properties?.email_otp;
    expect(!magicLinkError && !!emailOtp, "supabase magiclink otp generated", magicLinkError?.message ?? "6-digit code issued");

    if (emailOtp) {
      const otpClient = createClient(URL, ANON, { auth: { persistSession: false } });
      const { error: wrongOtpError } = await otpClient.auth.verifyOtp({ email: tempEmail, token: "000000", type: "email" });
      expect(!!wrongOtpError, "supabase rejects wrong otp", wrongOtpError?.message ?? "NOT rejected!");

      const { data: verifiedSession, error: verifyError } = await otpClient.auth.verifyOtp({ email: tempEmail, token: emailOtp, type: "email" });
      expect(!verifyError && !!verifiedSession?.session, "supabase verifies real otp", verifyError?.message ?? `user=${verifiedSession?.user?.email}`);

      const replayClient = createClient(URL, ANON, { auth: { persistSession: false } });
      const { error: supabaseReplayError } = await replayClient.auth.verifyOtp({ email: tempEmail, token: emailOtp, type: "email" });
      expect(!!supabaseReplayError, "supabase otp single-use", supabaseReplayError?.message ?? "NOT blocked!");
    }

    const { data: recoveryOtpLink, error: recoveryOtpLinkError } = await service.auth.admin.generateLink({ type: "recovery", email: tempEmail });
    const recoveryOtp = recoveryOtpLink?.properties?.email_otp;
    expect(!recoveryOtpLinkError && !!recoveryOtp, "supabase recovery otp generated", recoveryOtpLinkError?.message ?? "6-digit code issued");
    if (recoveryOtp) {
      const resetClient = createClient(URL, ANON, { auth: { persistSession: false } });
      const { data: resetSession, error: resetError } = await resetClient.auth.verifyOtp({ email: tempEmail, token: recoveryOtp, type: "recovery" });
      expect(!resetError && !!resetSession?.session, "supabase recovery otp verifies", resetError?.message ?? "session established");
    }
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
  const { error: otpSweepError } = await service.from("email_otp_requests").delete().like("email", "zzotp%");
  if (otpSweepError) console.log(`  note: sweep email_otp_requests — ${otpSweepError.message}`);
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
