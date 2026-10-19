// Live verification of the Enterprise 2FA stack.
//
// Run with:  npm run verify:2fa
//
// 1. RFC 6238 TOTP test vectors against the real app implementation.
// 2. AES-256-GCM secret encryption round-trip (including wrong-key rejection).
// 3. Recovery-code generation/hashing and one-time-use semantics.
// 4. Live database checks: tables exist, RLS denies anon/authenticated access,
//    encrypted-at-rest secrets decrypt, trusted-device tokens hash, and
//    challenge/attempt bookkeeping works. All test data is removed afterwards.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import {
  base32Decode,
  base32Encode,
  buildOtpAuthUrl,
  formatManualKey,
  generateTotp,
  generateTotpSecret,
  verifyTotp,
} from "../lib/security/totp";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  hashToken,
  normalizeRecoveryCode,
} from "../lib/security/two-factor-crypto";

function readEnv(file: string): Record<string, string> {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
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

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string, detail = "") {
  passed += 1;
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function bad(name: string, detail: string) {
  failed += 1;
  failures.push(`${name}: ${detail}`);
  console.log(`  FAIL  ${name} — ${detail}`);
}

function expect(condition: boolean, name: string, detail = "") {
  if (condition) ok(name, detail);
  else bad(name, detail || "assertion failed");
}

async function main() {
  const env = { ...readEnv(".env"), ...readEnv(".env.local") };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = env.ADMIN_EMAIL || "admin@mecart.local";
  const adminPassword = env.ADMIN_PASSWORD;

  console.log("\nMeCart Enterprise 2FA verification\n");

  // -------------------------------------------------------------------------
  console.log("[1/6] RFC 6238 test vectors (real app implementation)");
  // -------------------------------------------------------------------------
  const rfcSecret = base32Encode(Buffer.from("12345678901234567890", "ascii"));
  expect(rfcSecret === "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "base32 secret encodes to RFC vector");
  expect(Buffer.from(base32Decode(rfcSecret)).toString("ascii") === "12345678901234567890", "base32 decode round-trip");

  const vectors: Array<[number, string]> = [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ];

  for (const [timestamp, expected] of vectors) {
    const generated = generateTotp(rfcSecret, { timestamp: timestamp * 1000, digits: 8 });
    expect(generated.code === expected, `TOTP vector t=${timestamp}`, `got ${generated.code}`);
  }

  const liveSecret = generateTotpSecret();
  const live = generateTotp(liveSecret);
  const liveVerification = verifyTotp(liveSecret, live.code);
  expect(liveVerification.valid, "6-digit code from a fresh secret verifies");
  expect(!verifyTotp(liveSecret, "000000").valid || live.code === "000000", "wrong code is rejected");
  expect(
    verifyTotp(liveSecret, live.code, { lastUsedStep: live.step }).reason === "replay",
    "replay of a used time-step is rejected",
  );
  expect(verifyTotp(liveSecret, "12").reason === "malformed", "malformed code is rejected");
  expect(liveVerification.step === live.step, "verified step matches generator step");

  const otpauth = buildOtpAuthUrl({ secret: liveSecret, accountName: "user@example.com", issuer: "MeCart" });
  expect(otpauth.startsWith("otpauth://totp/MeCart:user%40example.com?"), "otpauth URL is well formed");
  expect(otpauth.includes("digits=6") && otpauth.includes("period=30") && otpauth.includes("algorithm=SHA1"), "otpauth URL uses RFC defaults");
  expect(formatManualKey("ABCDEFGH").includes(" "), "manual key is grouped for display");

  // -------------------------------------------------------------------------
  console.log("\n[2/6] Secret encryption (AES-256-GCM)");
  // -------------------------------------------------------------------------
  const secret = generateTotpSecret();
  const payload = encryptSecret(secret);
  expect(payload.startsWith("v1."), "payload is versioned");
  expect(!payload.includes(secret), "payload does not contain the plaintext secret");
  expect(decryptSecret(payload) === secret, "decrypt returns the original secret");
  expect(
    (() => {
      try {
        decryptSecret(payload, Buffer.alloc(32, 7));
        return false;
      } catch {
        return true;
      }
    })(),
    "wrong key cannot decrypt (auth tag enforced)",
  );
  expect(encryptSecret(secret) !== payload, "each encryption uses a fresh IV");

  // -------------------------------------------------------------------------
  console.log("\n[3/6] Recovery codes and token hashing");
  // -------------------------------------------------------------------------
  const codes = generateRecoveryCodes(10);
  expect(codes.length === 10, "generates exactly 10 codes");
  expect(new Set(codes).size === 10, "codes are unique");
  expect(codes.every((code) => /^[A-Z2-9]{5}-[A-Z2-9]{5}$/.test(code)), "codes match XXXXX-XXXXX format");
  const normalized = normalizeRecoveryCode(codes[0]);
  expect(normalized.length === 10, "normalization strips the dash");
  expect(hashRecoveryCode(codes[0]) === hashRecoveryCode(normalized), "hashing is normalization-stable");
  expect(hashRecoveryCode(codes[0]) !== codes[0], "hash never equals plaintext");
  expect(hashToken("token-a") !== hashToken("token-b"), "token hashing is collision-free for distinct tokens");
  expect(hashToken("token-a").length === 64, "token hash is sha256 hex");

  if (!url || !anonKey || !serviceKey) {
    bad("Supabase env", "missing NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE keys");
    return report();
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });

  // -------------------------------------------------------------------------
  console.log("\n[4/6] Database schema and RLS");
  // -------------------------------------------------------------------------
  const tables = [
    "user_two_factor",
    "two_factor_recovery_codes",
    "trusted_devices",
    "two_factor_challenges",
    "failed_2fa_attempts",
  ] as const;

  for (const table of tables) {
    const { error } = await service.from(table).select("*").limit(1);
    expect(!error, `service role can read ${table}`, error?.message ?? "");
  }

  for (const table of tables) {
    const { data, error } = await anon.from(table).select("*").limit(1);
    expect(Boolean(error) || (data ?? []).length === 0, `anon cannot read ${table}`, error?.message ?? "no rows returned");
  }

  if (adminPassword) {
    const { error: signInError } = await anon.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
    if (!signInError) {
      for (const table of tables) {
        const { data, error } = await anon.from(table).select("*").limit(1);
        expect(Boolean(error) || (data ?? []).length === 0, `authenticated user cannot read ${table}`);
      }
      await anon.auth.signOut();
    } else {
      bad("authenticated RLS check", `admin sign-in failed: ${signInError.message}`);
    }
  } else {
    ok("authenticated RLS check skipped", "ADMIN_PASSWORD not set");
  }

  // -------------------------------------------------------------------------
  console.log("\n[5/6] End-to-end database behaviour with a temporary user");
  // -------------------------------------------------------------------------
  const tempEmail = `verify-2fa-${Date.now()}@example-mecart.test`;
  const { data: createdUser, error: createError } = await service.auth.admin.createUser({
    email: tempEmail,
    email_confirm: true,
  });

  if (createError || !createdUser?.user) {
    bad("temporary user", createError?.message ?? "no user returned");
    return report();
  }

  const userId = createdUser.user.id;

  try {
    const storedSecret = generateTotpSecret();
    const { error: factorError } = await service.from("user_two_factor").insert({
      user_id: userId,
      method: "totp",
      enabled: true,
      encrypted_secret: encryptSecret(storedSecret),
      secret_verified_at: new Date().toISOString(),
      enabled_at: new Date().toISOString(),
    });
    expect(!factorError, "2FA row with encrypted secret inserts", factorError?.message ?? "");

    const { data: stored } = await service
      .from("user_two_factor")
      .select("encrypted_secret, enabled, method")
      .eq("user_id", userId)
      .single();

    expect(stored?.enabled === true && stored?.method === "totp", "2FA row reads back enabled");
    const decrypted = decryptSecret(stored?.encrypted_secret ?? "");
    expect(decrypted === storedSecret, "stored secret decrypts to the original");
    const current = generateTotp(decrypted);
    expect(verifyTotp(decrypted, current.code).valid, "stored secret produces a verifiable code");

    const recovery = generateRecoveryCodes(10);
    const batchId = crypto.randomUUID();
    const { error: codesError } = await service.from("two_factor_recovery_codes").insert(
      recovery.map((code) => ({ user_id: userId, batch_id: batchId, code_hash: hashRecoveryCode(code) })),
    );
    expect(!codesError, "10 recovery code hashes insert", codesError?.message ?? "");

    const firstUse = await service
      .from("two_factor_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("code_hash", hashRecoveryCode(recovery[0]))
      .is("used_at", null)
      .select("id")
      .maybeSingle();
    expect(Boolean(firstUse.data?.id), "recovery code can be consumed once");

    const secondUse = await service
      .from("two_factor_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("code_hash", hashRecoveryCode(recovery[0]))
      .is("used_at", null)
      .select("id")
      .maybeSingle();
    expect(!secondUse.data, "recovery code cannot be used twice");

    const token = `verify-token-${Date.now()}`;
    const { error: deviceError } = await service.from("trusted_devices").insert({
      user_id: userId,
      token_hash: hashToken(token),
      browser: "Verification",
      os: "Script",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(!deviceError, "trusted device token hash inserts", deviceError?.message ?? "");

    const { data: deviceLookup } = await service
      .from("trusted_devices")
      .select("id")
      .eq("user_id", userId)
      .eq("token_hash", hashToken(token))
      .is("revoked_at", null)
      .maybeSingle();
    expect(Boolean(deviceLookup?.id), "trusted device resolves by hashed cookie token");

    const { error: challengeError } = await service.from("two_factor_challenges").insert({
      user_id: userId,
      token_hash: hashToken(`challenge-${Date.now()}`),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: { redirectTo: "/", excludedMethods: ["email"] },
    });
    expect(!challengeError, "login challenge inserts with metadata", challengeError?.message ?? "");

    const { error: attemptError } = await service.from("failed_2fa_attempts").insert({
      user_id: userId,
      method: "totp",
      reason: "verification_script",
    });
    expect(!attemptError, "failed attempt trail inserts", attemptError?.message ?? "");
  } finally {
    await service.auth.admin.deleteUser(userId);
  }

  const { data: leftovers } = await service
    .from("user_two_factor")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  expect(!leftovers, "deleting the auth user cascades 2FA rows (no leftovers)");

  // -------------------------------------------------------------------------
  console.log("\n[6/6] Configuration notes");
  // -------------------------------------------------------------------------
  if (env.TWO_FACTOR_ENCRYPTION_KEY) {
    ok("TWO_FACTOR_ENCRYPTION_KEY is set", "explicit AES-256-GCM key in use");
  } else {
    ok(
      "TWO_FACTOR_ENCRYPTION_KEY not set",
      "derived from SUPABASE_SERVICE_ROLE_KEY — set an explicit key in production",
    );
  }

  const twilioConfigured = Boolean(
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID,
  );
  if (twilioConfigured) {
    ok("SMS 2FA provider configured", "Twilio Verify credentials present");
  } else {
    ok(
      "SMS 2FA provider not configured",
      "set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID to offer SMS as a 2FA method",
    );
  }

  return report();
}

function report() {
  console.log(`\n${passed} passed / ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
  console.log("Enterprise 2FA verification passed.\n");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
