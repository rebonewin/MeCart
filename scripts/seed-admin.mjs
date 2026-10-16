/**
 * Seeds (or upgrades) the store administrator account.
 *
 * Usage:  node scripts/seed-admin.mjs
 *
 * Requires in .env.local / .env:
 *   NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     - service role key (server-only, never commit)
 *   ADMIN_PASSWORD                - password for the admin account (from .env)
 * Optional:
 *   ADMIN_EMAIL (default admin@mecart.local), ADMIN_USERNAME (default A153TA)
 *
 * This script is idempotent: re-running it updates the existing admin.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const root = process.cwd();
loadEnvFile(resolve(root, ".env.local"));
loadEnvFile(resolve(root, ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_EMAIL || "admin@mecart.local").toLowerCase();
const username = process.env.ADMIN_USERNAME || "A153TA";
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local).",
  );
  process.exit(1);
}
if (!password) {
  console.error("Missing ADMIN_PASSWORD (expected in .env).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === targetEmail);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  console.log(`Seeding admin account "${email}" (username: ${username})...`);

  let userId = null;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: "Store Admin",
      name: "Store Admin",
    },
  });

  if (createError) {
    if (/already|exists|registered/i.test(createError.message)) {
      console.log("Auth user already exists - updating password instead.");
      const existing = await findUserByEmail(email);
      if (!existing) throw new Error(`User ${email} not found despite "already exists" error.`);
      userId = existing.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { username, full_name: "Store Admin", name: "Store Admin" },
      });
      if (updateError) throw updateError;
    } else {
      throw createError;
    }
  } else {
    userId = created.user?.id ?? null;
  }

  if (!userId) {
    const existing = await findUserByEmail(email);
    if (!existing) throw new Error("Could not resolve admin user id.");
    userId = existing.id;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      username,
      full_name: "Store Admin",
      role: "admin",
      is_active: true,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  const { error: adminError } = await supabase
    .from("admins")
    .upsert({ user_id: userId, level: "owner" }, { onConflict: "user_id" });
  if (adminError) {
    console.warn(`Warning: could not upsert admins row: ${adminError.message}`);
  }

  console.log("Done.");
  console.log(`  email:    ${email}`);
  console.log(`  username: ${username}`);
  console.log(`  user id:  ${userId}`);
  console.log("Log in at /login (use your username or email + ADMIN_PASSWORD).");
}

main().catch((err) => {
  console.error("Seed failed:", err?.message ?? err);
  process.exit(1);
});
