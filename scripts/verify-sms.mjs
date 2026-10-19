#!/usr/bin/env node
/**
 * MeCart SMS OTP verification harness.
 *
 * Verifies the SMS OTP stack at every layer that can be tested without
 * spending SMS credits:
 *
 *   1. Provider configuration — env presence plus a live Twilio Verify
 *      health check when credentials exist. Set SMS_TEST_PHONE to send one
 *      real SMS through the Verify API.
 *   2. Ledger hardening — anon denial, invalid input rejection, 60s cooldown,
 *      3-resend cap, brute-force blocking after 5 wrong attempts, replay
 *      protection, expiry sweep and RLS on the OTP ledger.
 *
 * The OTP code itself is generated and checked by the SMS provider — this
 * script never fabricates or stores one.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(file) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
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

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const env = { ...fileEnv, ...process.env };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

let passed = 0;
let failed = 0;
let warned = 0;

const pass = (label, detail = "") => {
  passed += 1;
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
};
const fail = (label, detail = "") => {
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
};
const warn = (label, detail = "") => {
  warned += 1;
  console.log(`  WARN  ${label}${detail ? ` — ${detail}` : ""}`);
};

console.log("MeCart SMS OTP verification\n===========================");

/* ---------------------------------------------------------------------------
 * 1. Provider configuration
 * ------------------------------------------------------------------------- */
console.log("\n1. SMS provider configuration");

const providerName = (env.SMS_PROVIDER || "twilio").toLowerCase();
const TWILIO_ENV = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"];
const missingTwilio = TWILIO_ENV.filter((name) => {
  const value = String(env[name] ?? "").trim();
  return !value || value.startsWith("your-");
});

console.log(`  Provider: ${providerName}`);

if (providerName !== "twilio") {
  warn(
    `SMS_PROVIDER=${providerName}`,
    "adapter scaffold only — live SMS requires SMS_PROVIDER=twilio",
  );
} else if (missingTwilio.length > 0) {
  warn("Twilio credentials missing", missingTwilio.join(", "));
  console.log(
    "        → add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID",
  );
  console.log("          to .env.local (see .env.example) — run `npm run twilio:setup` for help");
} else {
  pass("Twilio environment variables present");
  try {
    const auth = Buffer.from(
      `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
    ).toString("base64");
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );
    const payload = await response.json().catch(() => null);

    if (response.ok) {
      pass(
        "Twilio Verify service reachable",
        `friendly_name=${payload?.friendly_name ?? "?"} code_length=${payload?.code_length ?? "?"} ttl=${payload?.ttl ?? "?"}`,
      );
      if (payload?.code_length && payload.code_length !== 6) {
        warn("Verify service code length", `expected 6, got ${payload.code_length}`);
      }
      if (payload?.ttl && payload.ttl !== 300) {
        warn("Verify service TTL", `expected 300, got ${payload.ttl}`);
      }
    } else {
      fail("Twilio Verify health check", payload?.message ?? `HTTP ${response.status}`);
    }
  } catch (error) {
    fail("Twilio Verify health check", error.message);
  }
}

const testPhone = String(env.SMS_TEST_PHONE ?? "").trim();
if (testPhone && providerName === "twilio" && missingTwilio.length === 0) {
  if (!/^\+[1-9]\d{7,14}$/.test(testPhone)) {
    fail("SMS_TEST_PHONE format", "must be E.164, e.g. +919876543210");
  } else {
    try {
      const auth = Buffer.from(
        `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`,
      ).toString("base64");
      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: testPhone, Channel: "sms" }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.status) {
        pass(
          "Live OTP sent",
          `to ${testPhone.slice(0, 4)}•••${testPhone.slice(-3)} (status ${payload.status}) — enter the received code in the app to finish`,
        );
      } else {
        fail("Live OTP send", payload?.message ?? `HTTP ${response.status}`);
      }
    } catch (error) {
      fail("Live OTP send", error.message);
    }
  }
} else if (testPhone) {
  warn("SMS_TEST_PHONE set but Twilio is not configured", "live send skipped");
}

/* ---------------------------------------------------------------------------
 * 2. Phone OTP ledger (service role)
 * ------------------------------------------------------------------------- */
if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error(
    "\nFATAL: missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)",
  );
  process.exit(1);
}

console.log("\n2. Phone OTP ledger (service role)");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const runId = Date.now().toString(36);
const ip = `198.51.100.${(Date.now() % 200) + 1}`;
const device = `verify-device-${runId}`;
const randomDigits = () => String(Math.floor(1000000 + Math.random() * 8999999));
const phoneA = `+1555${randomDigits()}`;
const phoneB = `+1555${randomDigits()}`;
const phoneC = `+1555${randomDigits()}`;

const createRequest = (phone, extra = {}) =>
  admin.rpc("create_phone_otp_request", {
    p_phone_number: phone,
    p_purpose: "login",
    p_client_ip: ip,
    p_device_id: device,
    ...extra,
  });

// 2.1 anon must not be able to execute the request RPC
{
  const { error } = await anon.rpc("create_phone_otp_request", {
    p_phone_number: phoneA,
    p_purpose: "login",
  });
  if (error) pass("create_phone_otp_request denied for anon", error.message.slice(0, 70));
  else fail("create_phone_otp_request denied for anon", "anon call unexpectedly succeeded");
}

// 2.2 invalid input rejected
{
  const { error } = await admin.rpc("create_phone_otp_request", {
    p_phone_number: "12345",
    p_purpose: "login",
  });
  if (error && /E\.164|valid/i.test(error.message)) {
    pass("invalid phone rejected by ledger");
  } else {
    fail("invalid phone rejected by ledger", error?.message ?? "accepted invalid phone");
  }
}

// 2.3 initial request created with provider + nonce
{
  const { data, error } = await createRequest(phoneA, {
    p_provider: "twilio",
    p_signature_nonce: `nonce-${runId}`,
    p_country_code: "US",
  });
  if (!error && data?.request_id) {
    pass("OTP request created", `resend_count=${data.resend_count} provider=${data.provider}`);
  } else {
    fail("OTP request created", error?.message ?? "no request_id returned");
  }
}

// 2.4 immediate resend blocked by the 60s cooldown
{
  const { error } = await createRequest(phoneA);
  if (error && /wait/i.test(error.message)) {
    pass("60s cooldown enforced", error.message.slice(0, 60));
  } else {
    fail("60s cooldown enforced", error?.message ?? "second request unexpectedly succeeded");
  }
}

// Helper to backdate the active request so the cooldown no longer applies.
async function ageRequest(phone) {
  const aged = new Date(Date.now() - 61000).toISOString();
  const { error } = await admin
    .from("phone_otp_requests")
    .update({ requested_at: aged })
    .eq("phone_number", phone)
    .eq("is_verified", false)
    .is("consumed_at", null);
  return error ? error.message : null;
}

// 2.5 three resends allowed, fourth blocked
for (let resend = 1; resend <= 3; resend += 1) {
  const ageError = await ageRequest(phoneA);
  if (ageError) {
    fail(`resend ${resend}/3 allowed`, ageError);
    break;
  }
  const { data, error } = await createRequest(phoneA);
  if (error) fail(`resend ${resend}/3 allowed`, error.message.slice(0, 60));
  else if (data?.resend_count === resend) pass(`resend ${resend}/3 tracked`, `resend_count=${data.resend_count}`);
  else fail(`resend ${resend}/3 tracked`, `resend_count=${data?.resend_count}`);
}

{
  await ageRequest(phoneA);
  const { error } = await createRequest(phoneA);
  if (error && /resend/i.test(error.message)) {
    pass("resend cap enforced after 3 resends", error.message.slice(0, 60));
  } else {
    fail("resend cap enforced after 3 resends", error?.message ?? "4th resend unexpectedly succeeded");
  }
}

// 2.6 pending helper returns the active request
{
  const { data, error } = await admin.rpc("pending_phone_otp_request", {
    p_phone_number: phoneA,
    p_purpose: "login",
  });
  if (!error && data?.phone_number === phoneA) {
    pass("pending_phone_otp_request returns the active request");
  } else {
    fail("pending_phone_otp_request returns the active request", error?.message ?? "no row");
  }
}

// 2.7 five wrong attempts block the number
for (let attempt = 1; attempt <= 5; attempt += 1) {
  const { data, error } = await admin.rpc("verify_phone_otp_request", {
    p_phone_number: phoneA,
    p_purpose: "login",
    p_success: false,
    p_error: "incorrect code",
  });

  if (error) {
    fail(`wrong attempt ${attempt}/5 recorded`, error.message.slice(0, 60));
    break;
  }

  if (attempt < 5) {
    if (data?.status === "failed" && data?.remaining === 5 - attempt) {
      pass(`wrong attempt ${attempt}/5 tracked`, `remaining=${data.remaining}`);
    } else {
      fail(`wrong attempt ${attempt}/5 tracked`, JSON.stringify(data));
    }
  } else if (data?.status === "blocked" && data?.blocked_until) {
    pass("phone blocked after 5 wrong attempts", `until ${String(data.blocked_until).slice(0, 19)}`);
  } else {
    fail("phone blocked after 5 wrong attempts", JSON.stringify(data));
  }
}

// 2.8 blocked numbers cannot start a new request until the window passes
{
  const { error } = await createRequest(phoneA);
  if (error && /wrong|block/i.test(error.message)) {
    pass("blocked phone cannot request a new OTP", error.message.slice(0, 60));
  } else {
    fail("blocked phone cannot request a new OTP", error?.message ?? "request unexpectedly succeeded");
  }
}

// 2.9 replay of a consumed/blocked request is rejected
{
  const { error } = await admin.rpc("verify_phone_otp_request", {
    p_phone_number: phoneA,
    p_purpose: "login",
    p_success: true,
  });
  if (error && /no active/i.test(error.message)) {
    pass("consumed request cannot be verified again", error.message.slice(0, 60));
  } else {
    fail("consumed request cannot be verified again", error?.message ?? "replay unexpectedly succeeded");
  }
}

// 2.10 successful verify marks the request verified; second verify is rejected
{
  const created = await createRequest(phoneB);
  if (created.error) {
    fail("second OTP request created", created.error.message.slice(0, 60));
  } else {
    pass("second OTP request created");
  }

  const verified = await admin.rpc("verify_phone_otp_request", {
    p_phone_number: phoneB,
    p_purpose: "login",
    p_success: true,
  });
  if (!verified.error && verified.data?.status === "verified") {
    pass("successful verify marks request verified");
  } else {
    fail("successful verify marks request verified", verified.error?.message ?? JSON.stringify(verified.data));
  }

  const replay = await admin.rpc("verify_phone_otp_request", {
    p_phone_number: phoneB,
    p_purpose: "login",
    p_success: true,
  });
  if (replay.error) pass("verified request cannot be replayed", replay.error.message.slice(0, 60));
  else fail("verified request cannot be replayed", "replay unexpectedly succeeded");
}

// 2.11 expiry sweep consumes stale requests
{
  const created = await createRequest(phoneC);
  if (created.error) {
    fail("expiring request created", created.error.message.slice(0, 60));
  } else {
    await admin
      .from("phone_otp_requests")
      .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
      .eq("phone_number", phoneC)
      .is("consumed_at", null);

    const sweep = await admin.rpc("expire_stale_phone_otp_requests", { p_limit: 50 });
    if (!sweep.error && Number(sweep.data ?? 0) >= 1) {
      pass("expiry sweep consumed stale requests", `count=${sweep.data}`);
    } else {
      fail("expiry sweep consumed stale requests", sweep.error?.message ?? `count=${sweep.data}`);
    }

    const pending = await admin.rpc("pending_phone_otp_request", {
      p_phone_number: phoneC,
      p_purpose: "login",
    });
    if (!pending.error && pending.data === null) pass("expired request no longer pending");
    else fail("expired request no longer pending", JSON.stringify(pending.data));
  }
}

// 2.12 anon cannot read the ledger (RLS)
{
  const { data, error } = await anon.from("phone_otp_requests").select("id").limit(1);
  if (error || (data ?? []).length === 0) pass("anon cannot read the OTP ledger");
  else fail("anon cannot read the OTP ledger", `${data.length} rows visible`);
}

// Cleanup
{
  const { error } = await admin
    .from("phone_otp_requests")
    .delete()
    .in("phone_number", [phoneA, phoneB, phoneC]);
  if (error) warn("cleanup of test rows failed", error.message.slice(0, 60));
  else console.log("  INFO  test rows cleaned up");
}

/* ---------------------------------------------------------------------------
 * Summary
 * ------------------------------------------------------------------------- */
console.log(
  `\nSMS OTP verification: ${passed} passed, ${failed} failed, ${warned} warnings`,
);

if (missingTwilio.length > 0) {
  console.log(
    "\nLive SMS checks are skipped until TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and",
  );
  console.log(
    "TWILIO_VERIFY_SERVICE_SID are set in .env.local — see .env.example / npm run twilio:setup.",
  );
}

process.exit(failed > 0 ? 1 : 0);
