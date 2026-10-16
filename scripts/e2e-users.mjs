// E2E test-user helper: creates/removes throwaway accounts for browser flow tests.
// Usage: node scripts/e2e-users.mjs create | delete
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...readEnv(".env"), ...readEnv(".env.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Missing Supabase env vars");

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const statePath = resolve(process.env.TEMP ?? ".", "opencode", "e2e-state.json");
const cmd = process.argv[2];

async function create() {
  const ts = Date.now();
  const admin = { email: `zz-e2e-admin-${ts}@example.com`, password: `ZzE2eAdmin-${ts}!` };
  const customer = { email: `zz-e2e-cust-${ts}@example.com`, password: `ZzE2eCust-${ts}!` };

  const { data: adminUser, error: adminErr } = await service.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    user_metadata: { full_name: "E2E Admin", username: `e2eadmin${ts}` },
  });
  if (adminErr) throw adminErr;

  const { error: roleErr } = await service
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", adminUser.user.id);
  if (roleErr) throw roleErr;

  const { data: custUser, error: custErr } = await service.auth.admin.createUser({
    email: customer.email,
    password: customer.password,
    email_confirm: true,
    user_metadata: { full_name: "E2E Customer", username: `e2ecust${ts}` },
  });
  if (custErr) throw custErr;

  await new Promise((r) => setTimeout(r, 800)); // let signup triggers settle
  const { data: custProfile } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", custUser.user.id)
    .maybeSingle();

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        admin: { ...admin, id: adminUser.user.id },
        customer: { ...customer, id: custUser.user.id },
      },
      null,
      2,
    ),
  );

  console.log("E2E users created (throwaway, deleted after the run)");
  console.log(`admin    : ${admin.email} / ${admin.password}`);
  console.log(`customer : ${customer.email} / ${customer.password}`);
  console.log(`customer profile: ${custProfile?.id ? "ok" : "MISSING"}`);
  console.log(`state    : ${statePath}`);
}

async function remove() {
  if (!existsSync(statePath)) {
    console.log("No E2E state file — nothing to clean up.");
    return;
  }
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const purgeBucket = async (bucket, user) => {
    const prefixes = [`e2e-test/${user.id}`, `e2e/${user.id}`, user.id];
    for (const prefix of prefixes) {
      const { data: files } = await service.storage.from(bucket).list(prefix);
      if (files?.length) {
        await service.storage.from(bucket).remove(files.map((f) => `${prefix}/${f.name}`));
      }
    }
  };
  for (const key of ["admin", "customer"]) {
    const user = state[key];
    if (!user?.id) continue;
    for (const bucket of ["products", "product-gallery", "avatars", "review-images", "cms"]) {
      await purgeBucket(bucket, user);
    }
    await service.from("media_library").delete().eq("uploaded_by", user.id);
    const { error } = await service.auth.admin.deleteUser(user.id);
    console.log(`deleted ${key} ${user.email}: ${error ? error.message : "ok"}`);
  }

  // Remove anonymous guest users created during this test run (last 2 hours).
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  let page = 1;
  let anonDeleted = 0;
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.is_anonymous && new Date(u.created_at).getTime() >= cutoff) {
        await service.auth.admin.deleteUser(u.id);
        anonDeleted += 1;
      }
    }
    if (data.users.length < 100) break;
    page += 1;
  }
  console.log(`deleted ${anonDeleted} test anonymous guest user(s)`);
}

if (cmd === "create") await create();
else if (cmd === "delete") await remove();
else console.log("usage: node scripts/e2e-users.mjs create|delete");
