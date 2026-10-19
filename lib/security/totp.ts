import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * RFC 6238 TOTP implementation (SHA-1, 6 digits, 30 seconds), compatible with
 * Google Authenticator, Microsoft Authenticator, Authy, 1Password, Bitwarden
 * and any other RFC 6238 application.
 *
 * Secrets are handled on the server only. This module never logs a secret.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30;
const DEFAULT_WINDOW = 1;

export type TotpOptions = {
  digits?: number;
  period?: number;
};

export type GeneratedTotp = {
  code: string;
  step: number;
  remainingSeconds: number;
};

export type TotpVerification = {
  valid: boolean;
  step: number | null;
  delta: number | null;
  reason: "ok" | "invalid" | "replay" | "malformed";
};

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }

  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/[\s=-]/g, "").toUpperCase();
  if (!clean) throw new Error("Empty TOTP secret");

  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error("Invalid base32 secret");

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
      value &= (1 << bits) - 1;
    }
  }

  return Buffer.from(output);
}

/** 160-bit secret, encoded as base32 (the format authenticator apps expect). */
export function generateTotpSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

export function normalizeTotpCode(code: string): string {
  return code.replace(/\D/g, "");
}

function hotp(secret: string, counter: number, digits: number): string {
  const key = base32Decode(secret);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** digits).padStart(digits, "0");
}

export function generateTotp(
  secret: string,
  options: TotpOptions & { timestamp?: number } = {},
): GeneratedTotp {
  const digits = options.digits ?? DEFAULT_DIGITS;
  const period = options.period ?? DEFAULT_PERIOD;
  const timestamp = options.timestamp ?? Date.now();
  const step = Math.floor(timestamp / 1000 / period);

  return {
    code: hotp(secret, step, digits),
    step,
    remainingSeconds: period - (Math.floor(timestamp / 1000) % period),
  };
}

function constantTimeEqual(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

/**
 * Verifies a TOTP code with a +/- window for clock drift.
 *
 * `lastUsedStep` enforces replay prevention: a code whose time-step was already
 * consumed is rejected even while it is still inside the validity window.
 */
export function verifyTotp(
  secret: string,
  code: string,
  options: TotpOptions & { timestamp?: number; window?: number; lastUsedStep?: number | null } = {},
): TotpVerification {
  const digits = options.digits ?? DEFAULT_DIGITS;
  const period = options.period ?? DEFAULT_PERIOD;
  const window = Math.max(0, options.window ?? DEFAULT_WINDOW);
  const timestamp = options.timestamp ?? Date.now();
  const normalized = normalizeTotpCode(code);

  if (normalized.length !== digits) {
    return { valid: false, step: null, delta: null, reason: "malformed" };
  }

  const currentStep = Math.floor(timestamp / 1000 / period);
  let replayStep: number | null = null;

  for (let delta = 0; delta <= window; delta += 1) {
    const candidates = delta === 0 ? [0] : [-delta, delta];

    for (const offset of candidates) {
      const step = currentStep + offset;
      if (step < 0) continue;

      const expected = hotp(secret, step, digits);
      if (!constantTimeEqual(expected, normalized)) continue;

      if (typeof options.lastUsedStep === "number" && step <= options.lastUsedStep) {
        replayStep = step;
        continue;
      }

      return { valid: true, step, delta: offset, reason: "ok" };
    }
  }

  if (replayStep !== null) {
    return { valid: false, step: replayStep, delta: null, reason: "replay" };
  }

  return { valid: false, step: null, delta: null, reason: "invalid" };
}

export function buildOtpAuthUrl(input: {
  secret: string;
  issuer?: string;
  accountName: string;
  digits?: number;
  period?: number;
}): string {
  const issuer = input.issuer?.trim() || "MeCart";
  const digits = input.digits ?? DEFAULT_DIGITS;
  const period = input.period ?? DEFAULT_PERIOD;
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(input.accountName)}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(digits),
    period: String(period),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Groups a base32 secret in blocks of four for manual entry. */
export function formatManualKey(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}
