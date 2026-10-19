#!/usr/bin/env node
/**
 * One-time Twilio Verify setup for MeCart.
 *
 * Usage:
 *   1. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env.local
 *      (Twilio Console → Account Info). The auth token stays on this machine.
 *   2. Run: npm run twilio:setup
 *   3. Put the printed TWILIO_VERIFY_SERVICE_SID into .env.local
 *   4. In Twilio Console open the Verify Service → Templates and paste the
 *      MeCart template printed below ({{code}} is filled in by Twilio).
 *   5. Run: npm run verify:sms   (set SMS_TEST_PHONE in .env.local for one
 *      real SMS test)
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

const env = { ...readEnvFile(".env"), ...readEnvFile(".env.local"), ...process.env };

const ACCOUNT_SID = String(env.TWILIO_ACCOUNT_SID ?? "").trim();
const AUTH_TOKEN = String(env.TWILIO_AUTH_TOKEN ?? "").trim();
const EXISTING_SERVICE_SID = String(env.TWILIO_VERIFY_SERVICE_SID ?? "").trim();

const SMS_TEMPLATE = [
  "MeCart",
  "Your verification code is {{code}}",
  "Valid for 5 minutes.",
  "Never share this code.",
].join("\n");

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error("Missing Twilio credentials.\n");
  console.error("Add these two lines to .env.local first:");
  console.error("  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.error("  TWILIO_AUTH_TOKEN=<your auth token>");
  console.error("\nBoth come from https://console.twilio.com → Account Info.");
  process.exit(1);
}

if (!ACCOUNT_SID.startsWith("AC")) {
  console.error("TWILIO_ACCOUNT_SID should start with \"AC\" — check the value in .env.local.");
  process.exit(1);
}

const authHeader = `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`;
const BASE = "https://verify.twilio.com/v2";

async function call(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader,
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function describe(payload) {
  return [
    `sid=${payload?.sid}`,
    `friendly_name=${payload?.friendly_name}`,
    `code_length=${payload?.code_length}`,
    `ttl=${payload?.ttl}`,
    `status=${payload?.status ?? "ok"}`,
  ].join("  ");
}

let serviceSid = EXISTING_SERVICE_SID;

if (serviceSid) {
  console.log(`Checking existing Verify Service ${serviceSid} …`);
  const { response, payload } = await call(`/Services/${serviceSid}`);

  if (!response.ok) {
    console.error(`Could not read the Verify Service: ${payload?.message ?? response.status}`);
    console.error("Check TWILIO_VERIFY_SERVICE_SID in .env.local or unset it to create a new service.");
    process.exit(1);
  }

  console.log(`  ${describe(payload)}`);

  if (payload?.code_length !== 6 || payload?.ttl !== 300) {
    console.log("Updating the service to MeCart defaults (6-digit codes, 5-minute TTL) …");
    const { response: updateResponse, payload: updated } = await call(`/Services/${serviceSid}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        CodeLength: "6",
        Ttl: "300",
        DoNotShareWarningEnabled: "true",
      }),
    });
    if (!updateResponse.ok) {
      console.error(`Update failed: ${updated?.message ?? updateResponse.status}`);
      process.exit(1);
    }
    console.log(`  ${describe(updated)}`);
  }
} else {
  console.log("No TWILIO_VERIFY_SERVICE_SID set — creating a MeCart Verify Service …");
  const { response, payload } = await call("/Services", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      FriendlyName: "MeCart SMS OTP",
      CodeLength: "6",
      Ttl: "300",
      DoNotShareWarningEnabled: "true",
    }),
  });

  if (!response.ok || !payload?.sid) {
    console.error(`Create failed: ${payload?.message ?? response.status}`);
    process.exit(1);
  }

  serviceSid = payload.sid;
  console.log(`  ${describe(payload)}`);
}

console.log("\n------------------------------------------------------------------");
console.log("Add this line to .env.local (and to Vercel for production):\n");
console.log(`TWILIO_VERIFY_SERVICE_SID=${serviceSid}`);
console.log("\n------------------------------------------------------------------");
console.log("SMS template — paste it in Twilio Console → Verify Service → Templates");
console.log("(or via the Verify Templates API). {{code}} is replaced by Twilio:\n");
console.log(SMS_TEMPLATE);
console.log("\n------------------------------------------------------------------");
console.log("Then finish with:");
console.log("  npm run verify:sms                 (configuration + ledger checks)");
console.log("  SMS_TEST_PHONE=+91xxxxxxxxxx npm run verify:sms   (one real SMS)");
