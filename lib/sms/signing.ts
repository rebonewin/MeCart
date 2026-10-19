import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Request signing for the OTP endpoints.
 *
 * The client asks the server for a short-lived, HMAC-signed challenge bound to
 * (phone, purpose, device). Send / resend / verify calls must present the
 * challenge, which makes scripted tampering detectable and lets the ledger
 * store the nonce for replay detection.
 *
 * The signing key is read from OTP_REQUEST_SIGNING_SECRET when configured and
 * otherwise derived from the Supabase service-role key — it is never shipped
 * to the browser and never logged.
 */

const DEFAULT_TTL_SECONDS = 600;

export type OtpChallenge = {
  nonce: string;
  timestamp: number;
  signature: string;
};

export type OtpChallengeContext = {
  phone: string;
  purpose: string;
  deviceId?: string | null;
};

export type ChallengeResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

let cachedKey: string | null = null;

function signingKey(): string {
  if (cachedKey) return cachedKey;

  const explicit = (process.env.OTP_REQUEST_SIGNING_SECRET ?? "").trim();
  if (explicit.length >= 16) {
    cachedKey = explicit;
    return cachedKey;
  }

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (serviceKey) {
    cachedKey = createHmac("sha256", serviceKey).update("mecart-otp-signing-key-v1").digest("hex");
    return cachedKey;
  }

  throw new Error(
    "OTP signing key unavailable. Set OTP_REQUEST_SIGNING_SECRET (recommended) or SUPABASE_SERVICE_ROLE_KEY.",
  );
}

function challengePayload(context: OtpChallengeContext, timestamp: number, nonce: string): string {
  return [context.phone, context.purpose, context.deviceId ?? "-", String(timestamp), nonce].join("|");
}

function sign(context: OtpChallengeContext, timestamp: number, nonce: string): string {
  return createHmac("sha256", signingKey())
    .update(challengePayload(context, timestamp, nonce))
    .digest("hex");
}

export function createOtpChallenge(context: OtpChallengeContext): OtpChallenge {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return { nonce, timestamp, signature: sign(context, timestamp, nonce) };
}

export function verifyOtpChallenge(
  context: OtpChallengeContext,
  challenge: Partial<OtpChallenge> | null | undefined,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): ChallengeResult {
  if (!challenge?.signature || !challenge.nonce || !challenge.timestamp) {
    return { ok: false, error: "Missing verification challenge. Please refresh the page and retry." };
  }

  const ageMs = Math.abs(Date.now() - Number(challenge.timestamp));
  if (!Number.isFinite(ageMs) || ageMs > ttlSeconds * 1000) {
    return { ok: false, error: "Verification challenge expired. Please refresh the page and retry." };
  }

  let expected: string;
  try {
    expected = sign(context, Number(challenge.timestamp), String(challenge.nonce));
  } catch {
    return { ok: false, error: "Verification is temporarily unavailable. Please try again." };
  }

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(String(challenge.signature), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Invalid verification challenge. Please refresh the page and retry." };
    }
  } catch {
    return { ok: false, error: "Invalid verification challenge. Please refresh the page and retry." };
  }

  return { ok: true };
}
