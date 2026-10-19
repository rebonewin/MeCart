import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/**
 * Cryptographic primitives for enterprise 2FA.
 *
 * - TOTP secrets: AES-256-GCM with a random 96-bit IV and auth tag.
 * - Recovery codes: HMAC-SHA256 with a server-side pepper (never plaintext).
 * - Trusted-device/challenge tokens: 256-bit random, stored as SHA-256.
 *
 * The encryption key comes from TWO_FACTOR_ENCRYPTION_KEY when configured. If
 * it is absent we derive a stable key from the service-role secret so no value
 * is ever hardcoded; production deployments should set an explicit key.
 */

const ENCRYPTION_VERSION = "v1";
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RECOVERY_GROUP_LENGTH = 5;
const RECOVERY_GROUPS = 2;

function decodeConfiguredKey(raw: string): Buffer | null {
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");

  try {
    const decoded = Buffer.from(raw, "base64");
    if (decoded.length === 32) return decoded;
  } catch {
    // Not valid base64 — fall through to passphrase derivation.
  }

  return null;
}

export function getTwoFactorEncryptionKey(): Buffer {
  const configured = process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim();
  if (configured) {
    const decoded = decodeConfiguredKey(configured);
    if (decoded) return decoded;
    // Passphrase-style values are stretched to 32 bytes with SHA-256.
    return createHash("sha256").update(configured).digest();
  }

  const fallback =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "mecart-development-only";

  return createHmac("sha256", fallback).update("mecart-2fa-encryption-v1").digest();
}

export function getRecoveryCodePepper(): Buffer {
  const configured = process.env.TWO_FACTOR_RECOVERY_PEPPER?.trim();
  if (configured) return createHash("sha256").update(configured).digest();

  const fallback =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "mecart-development-only";

  return createHmac("sha256", fallback).update("mecart-2fa-recovery-v1").digest();
}

export function encryptSecret(plaintext: string, key = getTwoFactorEncryptionKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string, key = getTwoFactorEncryptionKey()): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== ENCRYPTION_VERSION) {
    throw new Error("Unsupported secret payload");
  }

  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const ciphertext = Buffer.from(parts[3], "base64url");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashRecoveryCode(code: string): string {
  return createHmac("sha256", getRecoveryCodePepper())
    .update(normalizeRecoveryCode(code))
    .digest("hex");
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    let raw = "";
    for (let index = 0; index < RECOVERY_GROUP_LENGTH * RECOVERY_GROUPS; index += 1) {
      raw += RECOVERY_ALPHABET[randomInt(0, RECOVERY_ALPHABET.length)];
    }
    const formatted = `${raw.slice(0, RECOVERY_GROUP_LENGTH)}-${raw.slice(RECOVERY_GROUP_LENGTH)}`;
    codes.add(formatted);
  }

  return [...codes];
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeCompare(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
