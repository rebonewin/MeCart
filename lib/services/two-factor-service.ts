import "server-only";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { logSecurityEvent } from "@/lib/security/audit";
import {
  buildOtpAuthUrl,
  formatManualKey,
  generateTotpSecret,
  generateTotp,
  verifyTotp,
} from "@/lib/security/totp";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateSecureToken,
  hashRecoveryCode,
  hashToken,
  normalizeRecoveryCode,
} from "@/lib/security/two-factor-crypto";
import { getSmsProvider, getSmsSetupStatus } from "@/lib/sms";
import { isShadowEmail } from "@/lib/auth/shadow-email";
import { establishSupabaseSession } from "@/lib/services/session-bridge";

/**
 * Enterprise two-factor authentication orchestration.
 *
 * Security model:
 * - Password/OAuth/email-OTP/phone-OTP only get a user to the challenge page.
 * - No Supabase session survives the first factor until the second factor is
 *   verified (the session is revoked server-side, not just hidden in the UI).
 * - TOTP/recovery/SMS success mints a fresh Supabase session through a
 *   single-use admin magic-link token; email OTP success uses Supabase's own
 *   verified session after checking the user id.
 * - Five failures lock second-factor verification for 15 minutes and are
 *   recorded in `failed_2fa_attempts` for the admin dashboard.
 */

export const TWO_FACTOR_COOKIE = "mecart_2fa_challenge";
export const TRUSTED_DEVICE_COOKIE = "mecart_trusted_device";

export const TWO_FACTOR_METHODS = ["totp", "email", "sms"] as const;
export type TwoFactorMethod = (typeof TWO_FACTOR_METHODS)[number];
export type TwoFactorFirstFactor = "password" | "email_otp" | "phone_otp" | "oauth";
export type TwoFactorVerificationMethod = TwoFactorMethod | "recovery";

export const MAX_CHALLENGE_ATTEMPTS = 5;
export const MAX_OTP_SENDS = 3;
export const OTP_SEND_COOLDOWN_SECONDS = 60;
export const CHALLENGE_TTL_SECONDS = 10 * 60;
export const EMAIL_OTP_TTL_SECONDS = 10 * 60;
export const TRUSTED_DEVICE_DAYS = 30;
export const LOCK_MINUTES = 15;

const CHALLENGE_TTL_MS = CHALLENGE_TTL_SECONDS * 1000;
const EMAIL_OTP_TTL_MS = EMAIL_OTP_TTL_SECONDS * 1000;
const TRUSTED_DEVICE_TTL_MS = TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;
const SEND_COOLDOWN_MS = OTP_SEND_COOLDOWN_SECONDS * 1000;
const MAX_SENDS_PER_HOUR = 10;

type AdminClient = ReturnType<typeof createAdminClient>;
type TwoFactorRow = {
  user_id: string;
  method: string;
  enabled: boolean;
  encrypted_secret: string | null;
  pending_method: string | null;
  pending_encrypted_secret: string | null;
  pending_attempts: number;
  pending_contact_sent_at: string | null;
  secret_verified_at: string | null;
  enabled_at: string | null;
  last_used_at: string | null;
  last_totp_step: number | string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
};
type ChallengeRow = {
  id: string;
  user_id: string;
  token_hash: string;
  method: string | null;
  attempts: number;
  email_send_count: number;
  sms_send_count: number;
  email_sent_at: string | null;
  sms_sent_at: string | null;
  metadata: Json;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

type ChallengeMetadata = {
  redirectTo?: string;
  guestId?: string | null;
  excludedMethods?: TwoFactorMethod[];
  firstFactor?: TwoFactorFirstFactor;
};

type AccountIdentity = {
  realEmail: string | null;
  emailConfirmed: boolean;
  phone: string | null;
};

type RequestContext = {
  ip: string | null;
  userAgent: string | null;
  browser: string;
  os: string;
  location: string;
};

export type TrustedDeviceView = {
  id: string;
  browser: string;
  os: string;
  ip: string | null;
  location: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  current: boolean;
};

export type TwoFactorStatusView = {
  enabled: boolean;
  method: TwoFactorMethod | null;
  enabledAt: string | null;
  lastUsedAt: string | null;
  lockedUntil: string | null;
  pendingMethod: TwoFactorMethod | null;
  recoveryRemaining: number;
  recoveryTotal: number;
  maskedEmail: string | null;
  maskedPhone: string | null;
  hasRealEmail: boolean;
  hasVerifiedPhone: boolean;
  smsConfigured: boolean;
  smsMissing: string[];
  trustedDevices: TrustedDeviceView[];
};

export type TwoFactorChallengeView = {
  maskedEmail: string | null;
  maskedPhone: string | null;
  methods: {
    totp: boolean;
    email: boolean;
    sms: boolean;
    recovery: boolean;
  };
  defaultMethod: TwoFactorVerificationMethod | null;
  primaryMethod: TwoFactorMethod | null;
  lockedUntil: string | null;
  attemptsRemaining: number;
  emailSendCount: number;
  smsSendCount: number;
  emailSentAt: string | null;
  smsSentAt: string | null;
  expiresAt: string;
  smsMissing: string[];
};

export type TwoFactorGateResult = { required: boolean; challengeToken?: string };

export type TwoFactorVerifyResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      error: string;
      remainingAttempts: number;
      locked: boolean;
      lockedUntil?: string | null;
      expired?: boolean;
    };

export type SendChallengeCodeResult =
  | { ok: true; message: string; remainingSends: number; cooldownSeconds: number }
  | { ok: false; error: string };

export type StartTotpSetupResult =
  | { ok: true; secret: string; otpauthUrl: string; manualKey: string }
  | { ok: false; error: string };

export type ConfirmSetupResult =
  | { ok: true; enabled: boolean; recoveryCodes?: string[]; message: string }
  | { ok: false; error: string };

export type TwoFactorActionResult = { ok: true; message: string } | { ok: false; error: string };

export type AdminTwoFactorRow = {
  userId: string;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  enabled: boolean;
  method: string | null;
  enabledAt: string | null;
  lastUsedAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  recoveryRemaining: number;
  recoveryUsed: number;
  status: "enabled" | "disabled" | "locked";
};

export type AdminTwoFactorStats = {
  totalUsers: number;
  enabledUsers: number;
  withoutTwoFactor: number;
  recoveryCodesUsed: number;
  failedAttempts24h: number;
  lockedUsers: number;
};

export type AdminTwoFactorData = {
  rows: AdminTwoFactorRow[];
  stats: AdminTwoFactorStats;
};

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function nowIso(): string {
  return new Date().toISOString();
}

function isFuture(value: string | null | undefined): boolean {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

function sanitizeRedirect(value: string | null | undefined): string {
  if (!value) return "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function maskEmail(email: string | null): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = email.split("@");
  if (!local || !domain) return null;
  return `${local.slice(0, 1)}${"*".repeat(Math.min(4, Math.max(2, local.length - 1)))}@${domain}`;
}

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return `+${digits.slice(0, 2)} ${"*".repeat(Math.max(4, digits.length - 6))} ${digits.slice(-4)}`;
}

function parseMetadata(value: Json): ChallengeMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, Json | undefined>;
  const excluded = Array.isArray(record.excludedMethods)
    ? record.excludedMethods.filter((item): item is TwoFactorMethod =>
        typeof item === "string" && TWO_FACTOR_METHODS.includes(item as TwoFactorMethod),
      )
    : [];

  return {
    redirectTo: typeof record.redirectTo === "string" ? record.redirectTo : undefined,
    guestId: typeof record.guestId === "string" ? record.guestId : null,
    excludedMethods: excluded,
    firstFactor:
      record.firstFactor === "password" ||
      record.firstFactor === "email_otp" ||
      record.firstFactor === "phone_otp" ||
      record.firstFactor === "oauth"
        ? record.firstFactor
        : undefined,
  };
}

function parseClient(ua: string | null): { browser: string; os: string } {
  const value = ua ?? "";
  let browser = "Unknown";
  if (value.includes("Edg/")) browser = "Edge";
  else if (value.includes("Chrome/")) browser = "Chrome";
  else if (value.includes("Firefox/")) browser = "Firefox";
  else if (value.includes("Safari/")) browser = "Safari";

  let os = "Unknown";
  if (value.includes("Windows")) os = "Windows";
  else if (value.includes("Mac OS X")) os = "macOS";
  else if (value.includes("Android")) os = "Android";
  else if (value.includes("iPhone") || value.includes("iPad")) os = "iOS";
  else if (value.includes("Linux")) os = "Linux";

  return { browser, os };
}

async function getRequestContext(): Promise<RequestContext> {
  try {
    const h = await headers();
    const userAgent = h.get("user-agent");
    const { browser, os } = parseClient(userAgent);
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    const cityHeader = h.get("x-vercel-ip-city");
    const country = h.get("x-vercel-ip-country");
    let city: string | null = null;
    try {
      city = cityHeader ? decodeURIComponent(cityHeader) : null;
    } catch {
      city = cityHeader;
    }
    const location = [city, country].filter(Boolean).join(", ") || null;

    return { ip, userAgent, browser, os, location: location ?? "Unknown" };
  } catch {
    return { ip: null, userAgent: null, browser: "Unknown", os: "Unknown", location: "Unknown" };
  }
}

async function getTwoFactorRow(admin: AdminClient, userId: string): Promise<TwoFactorRow | null> {
  const { data } = await admin.from("user_two_factor").select("*").eq("user_id", userId).maybeSingle();
  return (data as TwoFactorRow | null) ?? null;
}

async function resolveIdentity(admin: AdminClient, userId: string): Promise<AccountIdentity> {
  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select("phone_number, phone_verified")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const authEmail = authData?.user?.email?.trim() || null;
  const realEmail = authEmail && !isShadowEmail(authEmail) ? authEmail : null;
  const emailConfirmed = Boolean(authData?.user?.email_confirmed_at);
  const phone =
    profile?.phone_verified && profile.phone_number ? profile.phone_number.trim() : null;

  return { realEmail, emailConfirmed, phone };
}

async function countRecoveryCodes(
  admin: AdminClient,
  userId: string,
): Promise<{ remaining: number; total: number; used: number }> {
  const { data } = await admin
    .from("two_factor_recovery_codes")
    .select("id, used_at")
    .eq("user_id", userId);

  const total = data?.length ?? 0;
  const used = data?.filter((row) => Boolean(row.used_at)).length ?? 0;
  return { remaining: total - used, total, used };
}

async function sumRecentSends(
  admin: AdminClient,
  userId: string,
  column: "email_send_count" | "sms_send_count",
): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("two_factor_challenges")
    .select("email_send_count, sms_send_count")
    .eq("user_id", userId)
    .gte("created_at", since);

  return (data ?? []).reduce(
    (total, row) =>
      total + Number(column === "email_send_count" ? row.email_send_count : row.sms_send_count),
    0,
  );
}

async function getChallengeFromCookie(admin: AdminClient): Promise<ChallengeRow | null> {
  const store = await cookies();
  const token = store.get(TWO_FACTOR_COOKIE)?.value;
  if (!token) return null;

  const { data } = await admin
    .from("two_factor_challenges")
    .select("*")
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", nowIso())
    .maybeSingle();

  return (data as ChallengeRow | null) ?? null;
}

async function clearChallengeCookie(): Promise<void> {
  const store = await cookies();
  store.set(TWO_FACTOR_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function setChallengeCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(TWO_FACTOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

async function clearTrustedDeviceCookie(): Promise<void> {
  const store = await cookies();
  store.set(TRUSTED_DEVICE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function findTrustedDevice(
  admin: AdminClient,
  userId: string,
  options: { touch?: boolean } = {},
): Promise<{ id: string; token_hash: string } | null> {
  const store = await cookies();
  const token = store.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token) return null;

  const { data } = await admin
    .from("trusted_devices")
    .select("id, token_hash")
    .eq("user_id", userId)
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .gt("expires_at", nowIso())
    .maybeSingle();

  if (!data) return null;

  if (options.touch !== false) {
    await admin.from("trusted_devices").update({ last_used_at: nowIso() }).eq("id", data.id);
  }

  return data;
}

async function trustCurrentDevice(userId: string): Promise<void> {
  const admin = createAdminClient();
  const context = await getRequestContext();
  const token = generateSecureToken();

  await admin.from("trusted_devices").insert({
    user_id: userId,
    token_hash: hashToken(token),
    label: `${context.browser} on ${context.os}`,
    browser: context.browser,
    os: context.os,
    ip: context.ip,
    location: context.location === "Unknown" ? null : context.location,
    user_agent: context.userAgent?.slice(0, 500) ?? null,
    expires_at: new Date(Date.now() + TRUSTED_DEVICE_TTL_MS).toISOString(),
    last_used_at: nowIso(),
  });

  const store = await cookies();
  store.set(TRUSTED_DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TRUSTED_DEVICE_DAYS * 24 * 60 * 60,
  });
}

async function revokeCurrentSession(admin: AdminClient): Promise<void> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    try {
      await admin.auth.admin.signOut(session.access_token, "local");
    } catch {
      // Cookie removal below is still mandatory.
    }
  }

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Best effort — the access token was already revoked above.
  }
}

async function createLoginChallenge(input: {
  admin: AdminClient;
  userId: string;
  firstFactor: TwoFactorFirstFactor;
  redirectTo?: string | null;
  guestId?: string | null;
  excludedMethods?: TwoFactorMethod[];
}): Promise<string> {
  const token = generateSecureToken();
  const excludedMethods =
    input.excludedMethods ??
    (input.firstFactor === "email_otp" || input.firstFactor === "oauth"
      ? ["email"]
      : input.firstFactor === "phone_otp"
        ? ["sms"]
        : []);

  // Opportunistic cleanup — keeps the table tiny without a cron job.
  const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    await input.admin
      .from("two_factor_challenges")
      .delete()
      .eq("user_id", input.userId)
      .or(`used_at.not.is.null,expires_at.lt.${staleBefore}`);
  } catch {
    // Cleanup is never allowed to block a login.
  }

  const metadata: ChallengeMetadata = {
    redirectTo: sanitizeRedirect(input.redirectTo),
    guestId: input.guestId ?? null,
    excludedMethods,
    firstFactor: input.firstFactor,
  };

  const { error } = await input.admin.from("two_factor_challenges").insert({
    user_id: input.userId,
    token_hash: hashToken(token),
    metadata: metadata as Json,
    expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
  });

  if (error) throw new Error(error.message);
  await setChallengeCookie(token);
  return token;
}

/**
 * Called immediately after a first factor succeeds. Returns `required: true`
 * when the user must complete a second factor; callers must then withhold or
 * revoke the Supabase session.
 */
export async function beginTwoFactorGate(input: {
  userId: string;
  firstFactor: TwoFactorFirstFactor;
  redirectTo?: string | null;
  guestId?: string | null;
  signOutExistingSession?: boolean;
}): Promise<TwoFactorGateResult> {
  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, input.userId);

  if (!row?.enabled) return { required: false };

  const trusted = await findTrustedDevice(admin, input.userId);
  if (trusted) return { required: false };

  const challengeToken = await createLoginChallenge({
    admin,
    userId: input.userId,
    firstFactor: input.firstFactor,
    redirectTo: input.redirectTo,
    guestId: input.guestId,
  });

  if (input.signOutExistingSession) {
    await revokeCurrentSession(admin);
  }

  await logSecurityEvent({
    action: "TWO_FACTOR_CHALLENGE_CREATED",
    userId: input.userId,
    metadata: { first_factor: input.firstFactor },
  });

  return { required: true, challengeToken };
}

// ---------------------------------------------------------------------------
// challenge page
// ---------------------------------------------------------------------------

export async function getTwoFactorChallengeView(): Promise<TwoFactorChallengeView | null> {
  const admin = createAdminClient();
  const challenge = await getChallengeFromCookie(admin);
  if (!challenge) return null;

  const row = await getTwoFactorRow(admin, challenge.user_id);
  if (!row?.enabled) return null;

  const [identity, recovery, smsStatus] = await Promise.all([
    resolveIdentity(admin, challenge.user_id),
    countRecoveryCodes(admin, challenge.user_id),
    Promise.resolve(getSmsSetupStatus()),
  ]);
  const metadata = parseMetadata(challenge.metadata);
  const excluded = metadata.excludedMethods ?? [];

  const methods = {
    totp: Boolean(row.encrypted_secret && row.secret_verified_at) && !excluded.includes("totp"),
    email: Boolean(identity.realEmail && identity.emailConfirmed) && !excluded.includes("email"),
    sms: Boolean(identity.phone) && smsStatus.configured && !excluded.includes("sms"),
    recovery: recovery.remaining > 0,
  };

  const primary = (row.method as TwoFactorMethod) ?? null;
  const order: TwoFactorVerificationMethod[] = ["totp", "email", "sms", "recovery"];
  const defaultMethod =
    (primary && methods[primary] ? primary : null) ?? order.find((method) => methods[method]) ?? null;

  return {
    maskedEmail: maskEmail(identity.realEmail),
    maskedPhone: maskPhone(identity.phone),
    methods,
    defaultMethod,
    primaryMethod: primary,
    lockedUntil: isFuture(row.locked_until) ? row.locked_until : null,
    attemptsRemaining: Math.max(0, MAX_CHALLENGE_ATTEMPTS - challenge.attempts),
    emailSendCount: challenge.email_send_count,
    smsSendCount: challenge.sms_send_count,
    emailSentAt: challenge.email_sent_at,
    smsSentAt: challenge.sms_sent_at,
    expiresAt: challenge.expires_at,
    smsMissing: smsStatus.configured ? [] : smsStatus.missing,
  };
}

// ---------------------------------------------------------------------------
// sending challenge codes
// ---------------------------------------------------------------------------

export async function sendChallengeEmailCode(): Promise<SendChallengeCodeResult> {
  const admin = createAdminClient();
  const challenge = await getChallengeFromCookie(admin);
  if (!challenge) return { ok: false, error: "Your verification session expired. Please sign in again." };

  const row = await getTwoFactorRow(admin, challenge.user_id);
  if (!row?.enabled) return { ok: false, error: "Two-factor authentication is not enabled." };
  if (isFuture(row.locked_until)) {
    return { ok: false, error: `Too many failed attempts. Try again after ${new Date(row.locked_until!).toLocaleTimeString()}.` };
  }

  const metadata = parseMetadata(challenge.metadata);
  if (metadata.excludedMethods?.includes("email")) {
    return { ok: false, error: "Email cannot be used as the second factor for this sign-in." };
  }

  const identity = await resolveIdentity(admin, challenge.user_id);
  if (!identity.realEmail || !identity.emailConfirmed) {
    return { ok: false, error: "This account does not have a verified email address." };
  }

  if (challenge.email_send_count >= MAX_OTP_SENDS) {
    return { ok: false, error: "You have reached the email code limit for this sign-in. Use another method." };
  }

  if (challenge.email_sent_at) {
    const elapsed = Date.now() - new Date(challenge.email_sent_at).getTime();
    if (elapsed < SEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting another code.`,
      };
    }
  }

  const sentThisHour = await sumRecentSends(admin, challenge.user_id, "email_send_count");
  if (sentThisHour >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "Too many email codes requested. Please try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: identity.realEmail,
    options: { shouldCreateUser: false },
  });

  if (error) {
    await logSecurityEvent({
      action: "TWO_FACTOR_OTP_SEND_FAILED",
      userId: challenge.user_id,
      status: "FAILED",
      metadata: { method: "email", message: error.message },
    });
    return { ok: false, error: "We couldn't send the email code right now. Please try again shortly." };
  }

  await admin
    .from("two_factor_challenges")
    .update({
      email_sent_at: nowIso(),
      email_send_count: challenge.email_send_count + 1,
    })
    .eq("id", challenge.id);

  await logSecurityEvent({
    action: "TWO_FACTOR_OTP_SENT",
    userId: challenge.user_id,
    metadata: { method: "email" },
  });

  return {
    ok: true,
    message: "We sent a 6-digit code to your verified email.",
    remainingSends: MAX_OTP_SENDS - (challenge.email_send_count + 1),
    cooldownSeconds: OTP_SEND_COOLDOWN_SECONDS,
  };
}

export async function sendChallengeSmsCode(): Promise<SendChallengeCodeResult> {
  const admin = createAdminClient();
  const challenge = await getChallengeFromCookie(admin);
  if (!challenge) return { ok: false, error: "Your verification session expired. Please sign in again." };

  const row = await getTwoFactorRow(admin, challenge.user_id);
  if (!row?.enabled) return { ok: false, error: "Two-factor authentication is not enabled." };
  if (isFuture(row.locked_until)) {
    return { ok: false, error: `Too many failed attempts. Try again after ${new Date(row.locked_until!).toLocaleTimeString()}.` };
  }

  const metadata = parseMetadata(challenge.metadata);
  if (metadata.excludedMethods?.includes("sms")) {
    return { ok: false, error: "SMS cannot be used as the second factor for this sign-in." };
  }

  const identity = await resolveIdentity(admin, challenge.user_id);
  if (!identity.phone) return { ok: false, error: "This account does not have a verified phone number." };

  const smsStatus = getSmsSetupStatus();
  if (!smsStatus.configured) {
    return { ok: false, error: "SMS verification is not configured on this server." };
  }

  if (challenge.sms_send_count >= MAX_OTP_SENDS) {
    return { ok: false, error: "You have reached the SMS code limit for this sign-in. Use another method." };
  }

  if (challenge.sms_sent_at) {
    const elapsed = Date.now() - new Date(challenge.sms_sent_at).getTime();
    if (elapsed < SEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting another code.`,
      };
    }
  }

  const sentThisHour = await sumRecentSends(admin, challenge.user_id, "sms_send_count");
  if (sentThisHour >= MAX_SENDS_PER_HOUR) {
    return { ok: false, error: "Too many SMS codes requested. Please try again later." };
  }

  const provider = getSmsProvider();
  const result = await provider.sendVerification({ to: identity.phone });
  if (!result.ok) {
    await logSecurityEvent({
      action: "TWO_FACTOR_OTP_SEND_FAILED",
      userId: challenge.user_id,
      status: "FAILED",
      metadata: { method: "sms", provider: result.provider, error: result.error },
    });
    return { ok: false, error: "We couldn't send the SMS code right now. Please try again shortly." };
  }

  await admin
    .from("two_factor_challenges")
    .update({
      sms_sent_at: nowIso(),
      sms_send_count: challenge.sms_send_count + 1,
    })
    .eq("id", challenge.id);

  await logSecurityEvent({
    action: "TWO_FACTOR_OTP_SENT",
    userId: challenge.user_id,
    metadata: { method: "sms", provider: result.provider },
  });

  return {
    ok: true,
    message: "We sent a 6-digit code to your verified phone.",
    remainingSends: MAX_OTP_SENDS - (challenge.sms_send_count + 1),
    cooldownSeconds: OTP_SEND_COOLDOWN_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// verifying a challenge
// ---------------------------------------------------------------------------

async function recordChallengeFailure(input: {
  admin: AdminClient;
  challenge: ChallengeRow;
  row: TwoFactorRow;
  method: TwoFactorVerificationMethod;
  message: string;
  reason: string;
  context: RequestContext;
}): Promise<TwoFactorVerifyResult> {
  const attempts = input.challenge.attempts + 1;
  const shouldLock = attempts >= MAX_CHALLENGE_ATTEMPTS;
  const remaining = Math.max(0, MAX_CHALLENGE_ATTEMPTS - attempts);
  const lockedUntil = shouldLock ? new Date(Date.now() + LOCK_MS).toISOString() : null;

  await input.admin
    .from("two_factor_challenges")
    .update({ attempts, ...(shouldLock ? { used_at: nowIso() } : {}) })
    .eq("id", input.challenge.id);

  await input.admin.from("failed_2fa_attempts").insert({
    user_id: input.challenge.user_id,
    method: input.method,
    reason: input.reason.slice(0, 300),
    ip: input.context.ip,
    user_agent: input.context.userAgent?.slice(0, 500) ?? null,
  });

  await input.admin
    .from("user_two_factor")
    .update({
      failed_attempts: Number(input.row.failed_attempts ?? 0) + 1,
      ...(lockedUntil ? { locked_until: lockedUntil } : {}),
      updated_at: nowIso(),
    })
    .eq("user_id", input.challenge.user_id);

  await logSecurityEvent({
    action: shouldLock ? "TWO_FACTOR_LOCKED" : "TWO_FACTOR_FAILED",
    userId: input.challenge.user_id,
    status: "FAILED",
    metadata: {
      method: input.method,
      reason: input.reason,
      attempts,
      locked: shouldLock,
    },
  });

  return {
    ok: false,
    error: shouldLock
      ? `Too many failed attempts. Second-factor verification is locked for ${LOCK_MINUTES} minutes.`
      : input.message,
    remainingAttempts: remaining,
    locked: shouldLock,
    lockedUntil,
  };
}

export async function verifyTwoFactorChallenge(input: {
  method: TwoFactorVerificationMethod;
  code: string;
  rememberDevice?: boolean;
}): Promise<TwoFactorVerifyResult> {
  const method = input.method;
  const code = input.code.trim();
  if (!code) {
    return { ok: false, error: "Enter your verification code.", remainingAttempts: MAX_CHALLENGE_ATTEMPTS, locked: false };
  }

  const admin = createAdminClient();
  const context = await getRequestContext();
  const challenge = await getChallengeFromCookie(admin);
  if (!challenge) {
    return {
      ok: false,
      error: "Your verification session expired. Please sign in again.",
      remainingAttempts: 0,
      locked: false,
      expired: true,
    };
  }

  const row = await getTwoFactorRow(admin, challenge.user_id);
  if (!row?.enabled) {
    return { ok: false, error: "Two-factor authentication is not enabled.", remainingAttempts: 0, locked: false };
  }

  if (isFuture(row.locked_until)) {
    return {
      ok: false,
      error: `Second-factor verification is temporarily locked. Try again after ${new Date(row.locked_until!).toLocaleTimeString()}.`,
      remainingAttempts: 0,
      locked: true,
      lockedUntil: row.locked_until,
    };
  }

  if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
    return {
      ok: false,
      error: "This verification session has no attempts left. Please sign in again.",
      remainingAttempts: 0,
      locked: true,
      expired: true,
    };
  }

  const metadata = parseMetadata(challenge.metadata);
  if (metadata.excludedMethods?.includes(method as TwoFactorMethod)) {
    return recordChallengeFailure({
      admin,
      challenge,
      row,
      method,
      message: "This verification method cannot be used for this sign-in.",
      reason: "method_excluded_for_first_factor",
      context,
    });
  }

  const identity = await resolveIdentity(admin, challenge.user_id);
  let failureMessage: string | null = null;
  let failureReason = "invalid_code";
  let verified = false;
  let verifiedTotpStep: number | null = null;

  if (method === "totp") {
    if (!row.encrypted_secret) {
      failureMessage = "Authenticator verification is not configured for this account.";
      failureReason = "totp_not_configured";
    } else {
      try {
        const secret = decryptSecret(row.encrypted_secret);
        const result = verifyTotp(secret, code, {
          lastUsedStep: row.last_totp_step === null ? null : Number(row.last_totp_step),
        });
        if (result.valid && result.step !== null) {
          verified = true;
          verifiedTotpStep = result.step;
        } else {
          failureReason = result.reason;
          failureMessage =
            result.reason === "replay"
              ? "That authenticator code was already used. Wait for the next code."
              : result.reason === "malformed"
                ? "Enter the 6-digit authenticator code."
                : "Invalid authenticator code. Check your app's clock and try again.";
        }
      } catch {
        failureMessage = "Authenticator verification failed. Please try again.";
        failureReason = "totp_decrypt_failed";
      }
    }
  } else if (method === "recovery") {
    const normalized = normalizeRecoveryCode(code);
    if (normalized.length !== 10) {
      failureMessage = "Enter a valid recovery code (format XXXXX-XXXXX).";
      failureReason = "recovery_malformed";
    } else {
      const { data: updated, error } = await admin
        .from("two_factor_recovery_codes")
        .update({
          used_at: nowIso(),
          used_ip: context.ip,
          used_user_agent: context.userAgent?.slice(0, 500) ?? null,
        })
        .eq("user_id", challenge.user_id)
        .eq("code_hash", hashRecoveryCode(normalized))
        .is("used_at", null)
        .select("id")
        .maybeSingle();

      if (error || !updated) {
        failureMessage = "Invalid or already used recovery code.";
        failureReason = "recovery_invalid";
      } else {
        verified = true;
      }
    }
  } else if (method === "email") {
    if (!identity.realEmail || !identity.emailConfirmed) {
      failureMessage = "Email verification is not available for this account.";
      failureReason = "email_not_available";
    } else if (metadata.excludedMethods?.includes("email")) {
      failureMessage = "Email cannot be used as the second factor for this sign-in.";
      failureReason = "email_excluded";
    } else if (!challenge.email_sent_at) {
      failureMessage = "Request an email code first.";
      failureReason = "email_not_sent";
    } else if (Date.now() - new Date(challenge.email_sent_at).getTime() > EMAIL_OTP_TTL_MS) {
      failureMessage = "That email code expired. Request a new one.";
      failureReason = "email_expired";
    } else {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email: identity.realEmail,
        token: code.replace(/\s/g, ""),
        type: "email",
      });

      if (error || !data.user) {
        failureMessage = "Invalid or expired email code.";
        failureReason = error?.message ? `email_verify: ${error.message}` : "email_invalid";
      } else if (data.user.id !== challenge.user_id) {
        await supabase.auth.signOut({ scope: "local" });
        failureMessage = "This email code belongs to a different account.";
        failureReason = "email_user_mismatch";
      } else {
        verified = true;
      }
    }
  } else if (method === "sms") {
    if (!identity.phone) {
      failureMessage = "SMS verification is not available for this account.";
      failureReason = "sms_not_available";
    } else if (!getSmsSetupStatus().configured) {
      failureMessage = "SMS verification is not configured on this server.";
      failureReason = "sms_not_configured";
    } else if (!challenge.sms_sent_at) {
      failureMessage = "Request an SMS code first.";
      failureReason = "sms_not_sent";
    } else if (Date.now() - new Date(challenge.sms_sent_at).getTime() > EMAIL_OTP_TTL_MS) {
      failureMessage = "That SMS code expired. Request a new one.";
      failureReason = "sms_expired";
    } else {
      const provider = getSmsProvider();
      const result = await provider.checkVerification({ to: identity.phone, code: code.replace(/\D/g, "") });
      if (result.ok) {
        verified = true;
      } else {
        failureMessage = "Invalid or expired SMS code.";
        failureReason = `sms_${result.status}`;
      }
    }
  } else {
    return {
      ok: false,
      error: "Unsupported verification method.",
      remainingAttempts: MAX_CHALLENGE_ATTEMPTS - challenge.attempts,
      locked: false,
    };
  }

  if (!verified) {
    return recordChallengeFailure({
      admin,
      challenge,
      row,
      method,
      message: failureMessage ?? "Invalid verification code.",
      reason: failureReason,
      context,
    });
  }

  // TOTP/recovery/SMS success has no Supabase session yet — mint one. Email OTP
  // verification already established the session above (and was user-checked).
  if (method !== "email") {
    try {
      await establishSupabaseSession(admin, challenge.user_id);
    } catch {
      await logSecurityEvent({
        action: "TWO_FACTOR_SESSION_FAILED",
        userId: challenge.user_id,
        status: "FAILED",
        metadata: { method },
      });
      return {
        ok: false,
        error: "Verification succeeded, but we could not start your session. Please try again.",
        remainingAttempts: Math.max(0, MAX_CHALLENGE_ATTEMPTS - challenge.attempts),
        locked: false,
      };
    }
  }

  const verifiedAt = nowIso();

  await admin
    .from("two_factor_challenges")
    .update({ used_at: verifiedAt, method })
    .eq("id", challenge.id);

  await admin
    .from("user_two_factor")
    .update({
      failed_attempts: 0,
      locked_until: null,
      last_used_at: verifiedAt,
      ...(verifiedTotpStep !== null ? { last_totp_step: verifiedTotpStep } : {}),
      updated_at: verifiedAt,
    })
    .eq("user_id", challenge.user_id);

  if (input.rememberDevice) {
    try {
      await trustCurrentDevice(challenge.user_id);
    } catch {
      // Remembering a device is a convenience; never fail an authenticated login.
    }
  }

  await clearChallengeCookie();

  if (metadata.guestId) {
    try {
      const supabase = await createClient();
      await supabase.rpc("merge_guest_cart", { p_from_user: metadata.guestId });
    } catch {
      // Cart merge is best-effort.
    }
  }

  await logSecurityEvent({
    action: method === "recovery" ? "TWO_FACTOR_RECOVERY_USED" : "TWO_FACTOR_VERIFIED",
    userId: challenge.user_id,
    metadata: { method, remembered_device: Boolean(input.rememberDevice) },
  });

  revalidatePath("/", "layout");

  return { ok: true, redirectTo: sanitizeRedirect(metadata.redirectTo) };
}

// ---------------------------------------------------------------------------
// settings status
// ---------------------------------------------------------------------------

export async function getTwoFactorStatus(): Promise<TwoFactorStatusView> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const [row, identity, recovery, devices, smsStatus] = await Promise.all([
    getTwoFactorRow(admin, user.id),
    resolveIdentity(admin, user.id),
    countRecoveryCodes(admin, user.id),
    admin
      .from("trusted_devices")
      .select("id, token_hash, browser, os, ip, location, created_at, last_used_at, expires_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .gt("expires_at", nowIso())
      .order("created_at", { ascending: false }),
    Promise.resolve(getSmsSetupStatus()),
  ]);

  const store = await cookies();
  const currentToken = store.get(TRUSTED_DEVICE_COOKIE)?.value;
  const currentHash = currentToken ? hashToken(currentToken) : null;

  return {
    enabled: Boolean(row?.enabled),
    method: (row?.method as TwoFactorMethod | undefined) ?? null,
    enabledAt: row?.enabled_at ?? null,
    lastUsedAt: row?.last_used_at ?? null,
    lockedUntil: isFuture(row?.locked_until) ? row!.locked_until : null,
    pendingMethod: (row?.pending_method as TwoFactorMethod | undefined) ?? null,
    recoveryRemaining: recovery.remaining,
    recoveryTotal: recovery.total,
    maskedEmail: maskEmail(identity.realEmail),
    maskedPhone: maskPhone(identity.phone),
    hasRealEmail: Boolean(identity.realEmail && identity.emailConfirmed),
    hasVerifiedPhone: Boolean(identity.phone),
    smsConfigured: smsStatus.configured,
    smsMissing: smsStatus.missing,
    trustedDevices: (devices.data ?? []).map((device) => ({
      id: device.id,
      browser: device.browser ?? "Unknown",
      os: device.os ?? "Unknown",
      ip: device.ip ?? null,
      location: device.location ?? null,
      createdAt: device.created_at,
      lastUsedAt: device.last_used_at,
      expiresAt: device.expires_at,
      current: Boolean(currentHash && device.token_hash === currentHash),
    })),
  };
}

// ---------------------------------------------------------------------------
// sensitive-action identity checks
// ---------------------------------------------------------------------------

async function verifyAccountPassword(password: string): Promise<TwoFactorActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "Your session has ended. Please sign in again." };
  }
  if (isShadowEmail(user.email)) {
    return {
      ok: false,
      error:
        "Add a real email address and set a password before managing two-factor authentication. Phone-only accounts can contact support for 2FA changes.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (error) {
    await logSecurityEvent({
      action: "TWO_FACTOR_PASSWORD_FAILED",
      userId: user.id,
      status: "FAILED",
    });
    return { ok: false, error: "Password confirmation failed. Check your password and try again." };
  }

  return { ok: true, message: "Password confirmed." };
}

async function verifyCurrentSecondFactor(input: {
  userId: string;
  row: TwoFactorRow;
  code: string;
}): Promise<TwoFactorActionResult> {
  const code = input.code.trim();
  if (!code) return { ok: false, error: "Enter your current authenticator or recovery code." };

  const admin = createAdminClient();
  const context = await getRequestContext();

  if (input.row.encrypted_secret) {
    try {
      const secret = decryptSecret(input.row.encrypted_secret);
      const result = verifyTotp(secret, code, {
        lastUsedStep: input.row.last_totp_step === null ? null : Number(input.row.last_totp_step),
      });
      if (result.valid && result.step !== null) {
        await admin
          .from("user_two_factor")
          .update({ last_totp_step: result.step, updated_at: nowIso() })
          .eq("user_id", input.userId);
        return { ok: true, message: "Authenticator code verified." };
      }
      if (result.reason === "replay") {
        return { ok: false, error: "That authenticator code was already used. Wait for the next code." };
      }
    } catch {
      // Fall through to recovery-code verification.
    }
  }

  const normalized = normalizeRecoveryCode(code);
  if (normalized.length === 10) {
    const { data: updated } = await admin
      .from("two_factor_recovery_codes")
      .update({
        used_at: nowIso(),
        used_ip: context.ip,
        used_user_agent: context.userAgent?.slice(0, 500) ?? null,
      })
      .eq("user_id", input.userId)
      .eq("code_hash", hashRecoveryCode(normalized))
      .is("used_at", null)
      .select("id")
      .maybeSingle();

    if (updated) {
      await logSecurityEvent({
        action: "TWO_FACTOR_RECOVERY_USED",
        userId: input.userId,
        metadata: { context: "sensitive_action" },
      });
      return { ok: true, message: "Recovery code verified." };
    }
  }

  await logSecurityEvent({
    action: "TWO_FACTOR_SENSITIVE_ACTION_FAILED",
    userId: input.userId,
    status: "FAILED",
  });

  return { ok: false, error: "Invalid authenticator or recovery code." };
}

async function replaceRecoveryCodes(admin: AdminClient, userId: string): Promise<string[]> {
  const codes = generateRecoveryCodes(10);
  const batchId = randomUUID();

  await admin.from("two_factor_recovery_codes").delete().eq("user_id", userId);
  const { error } = await admin.from("two_factor_recovery_codes").insert(
    codes.map((code) => ({
      user_id: userId,
      batch_id: batchId,
      code_hash: hashRecoveryCode(code),
    })),
  );

  if (error) throw new Error(error.message);
  return codes;
}

// ---------------------------------------------------------------------------
// setup: authenticator app
// ---------------------------------------------------------------------------

export async function startTotpSetup(password: string): Promise<StartTotpSetupResult> {
  const passwordCheck = await verifyAccountPassword(password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, user.id);
  const secret = generateTotpSecret();
  const encrypted = encryptSecret(secret);

  if (row) {
    const { error } = await admin
      .from("user_two_factor")
      .update({
        pending_method: "totp",
        pending_encrypted_secret: encrypted,
        pending_attempts: 0,
        pending_contact_sent_at: null,
        updated_at: nowIso(),
      })
      .eq("user_id", user.id);
    if (error) return { ok: false, error: "Could not start authenticator setup. Please try again." };
  } else {
    const { error } = await admin.from("user_two_factor").insert({
      user_id: user.id,
      method: "totp",
      enabled: false,
      pending_method: "totp",
      pending_encrypted_secret: encrypted,
    });
    if (error) return { ok: false, error: "Could not start authenticator setup. Please try again." };
  }

  await logSecurityEvent({
    action: "TWO_FACTOR_SETUP_STARTED",
    userId: user.id,
    metadata: { method: "totp" },
  });

  return {
    ok: true,
    secret,
    manualKey: formatManualKey(secret),
    otpauthUrl: buildOtpAuthUrl({ secret, accountName: user.email, issuer: "MeCart" }),
  };
}

export async function confirmTotpSetup(code: string): Promise<ConfirmSetupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, user.id);
  if (!row || row.pending_method !== "totp" || !row.pending_encrypted_secret) {
    return { ok: false, error: "Authenticator setup has expired. Start again." };
  }

  if (row.pending_attempts >= MAX_CHALLENGE_ATTEMPTS) {
    await admin
      .from("user_two_factor")
      .update({
        pending_method: null,
        pending_encrypted_secret: null,
        pending_attempts: 0,
        updated_at: nowIso(),
      })
      .eq("user_id", user.id);
    return { ok: false, error: "Too many invalid codes. Authenticator setup was reset. Start again." };
  }

  let verified = false;
  let step: number | null = null;
  try {
    const secret = decryptSecret(row.pending_encrypted_secret);
    const result = verifyTotp(secret, code, { window: 1 });
    verified = result.valid;
    step = result.step;
  } catch {
    verified = false;
  }

  if (!verified || step === null) {
    await admin
      .from("user_two_factor")
      .update({ pending_attempts: Number(row.pending_attempts ?? 0) + 1, updated_at: nowIso() })
      .eq("user_id", user.id);
    await logSecurityEvent({
      action: "TWO_FACTOR_SETUP_FAILED",
      userId: user.id,
      status: "FAILED",
      metadata: { method: "totp" },
    });
    return { ok: false, error: "That code is invalid. Check your authenticator app and try again." };
  }

  const firstEnable = !row.enabled;
  const enabledAt = row.enabled_at ?? nowIso();

  const { error } = await admin
    .from("user_two_factor")
    .update({
      method: "totp",
      enabled: true,
      encrypted_secret: row.pending_encrypted_secret,
      secret_verified_at: nowIso(),
      enabled_at: enabledAt,
      last_totp_step: step,
      pending_method: null,
      pending_encrypted_secret: null,
      pending_attempts: 0,
      pending_contact_sent_at: null,
      failed_attempts: 0,
      locked_until: null,
      updated_at: nowIso(),
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Could not enable authenticator verification. Please try again." };

  const recoveryCodes = firstEnable ? await replaceRecoveryCodes(admin, user.id) : undefined;

  await logSecurityEvent({
    action: firstEnable ? "TWO_FACTOR_ENABLED" : "TWO_FACTOR_METHOD_CHANGED",
    userId: user.id,
    metadata: { method: "totp" },
  });

  return {
    ok: true,
    enabled: true,
    recoveryCodes,
    message: firstEnable
      ? "Two-factor authentication is enabled. Save your recovery codes now."
      : "Authenticator app is now your primary second factor.",
  };
}

// ---------------------------------------------------------------------------
// setup: email / SMS as primary method
// ---------------------------------------------------------------------------

export async function beginContactMethodSetup(input: {
  method: "email" | "sms";
  password: string;
}): Promise<TwoFactorActionResult> {
  const passwordCheck = await verifyAccountPassword(input.password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const [row, identity] = await Promise.all([
    getTwoFactorRow(admin, user.id),
    resolveIdentity(admin, user.id),
  ]);

  if (row?.pending_contact_sent_at) {
    const elapsed = Date.now() - new Date(row.pending_contact_sent_at).getTime();
    if (elapsed < SEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil((SEND_COOLDOWN_MS - elapsed) / 1000)} seconds before requesting another code.`,
      };
    }
  }

  if (input.method === "email") {
    if (!identity.realEmail || !identity.emailConfirmed) {
      return { ok: false, error: "Verify an email address on your account first." };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: identity.realEmail,
      options: { shouldCreateUser: false },
    });
    if (error) return { ok: false, error: "Could not send the email code. Please try again shortly." };
  } else {
    if (!identity.phone) return { ok: false, error: "Verify a phone number on your account first." };
    if (!getSmsSetupStatus().configured) {
      return { ok: false, error: "SMS verification is not configured on this server." };
    }

    const provider = getSmsProvider();
    const result = await provider.sendVerification({ to: identity.phone });
    if (!result.ok) return { ok: false, error: "Could not send the SMS code. Please try again shortly." };
  }

  const values = {
    pending_method: input.method,
    pending_encrypted_secret: null,
    pending_attempts: 0,
    pending_contact_sent_at: nowIso(),
    updated_at: nowIso(),
  };

  const { error } = row
    ? await admin.from("user_two_factor").update(values).eq("user_id", user.id)
    : await admin.from("user_two_factor").insert({
        user_id: user.id,
        method: input.method,
        enabled: false,
        ...values,
      });

  if (error) return { ok: false, error: "Could not start verification setup. Please try again." };

  await logSecurityEvent({
    action: "TWO_FACTOR_SETUP_STARTED",
    userId: user.id,
    metadata: { method: input.method },
  });

  return {
    ok: true,
    message: input.method === "email" ? "We sent a 6-digit code to your email." : "We sent a 6-digit code to your phone.",
  };
}

export async function confirmContactMethodSetup(code: string): Promise<ConfirmSetupResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, user.id);
  if (!row || !row.pending_method || row.pending_method === "totp" || !row.pending_contact_sent_at) {
    return { ok: false, error: "Verification setup has expired. Start again." };
  }

  if (Date.now() - new Date(row.pending_contact_sent_at).getTime() > EMAIL_OTP_TTL_MS) {
    return { ok: false, error: "That code expired. Start the setup again." };
  }

  if (row.pending_attempts >= MAX_CHALLENGE_ATTEMPTS) {
    await admin
      .from("user_two_factor")
      .update({
        pending_method: null,
        pending_attempts: 0,
        pending_contact_sent_at: null,
        updated_at: nowIso(),
      })
      .eq("user_id", user.id);
    return { ok: false, error: "Too many invalid codes. Start the setup again." };
  }

  const identity = await resolveIdentity(admin, user.id);
  const method = row.pending_method as "email" | "sms";
  let verified = false;

  if (method === "email") {
    if (!identity.realEmail) return { ok: false, error: "Verify an email address on your account first." };
    const { data, error } = await supabase.auth.verifyOtp({
      email: identity.realEmail,
      token: code.replace(/\s/g, ""),
      type: "email",
    });
    verified = !error && data.user?.id === user.id;
  } else {
    if (!identity.phone) return { ok: false, error: "Verify a phone number on your account first." };
    if (!getSmsSetupStatus().configured) {
      return { ok: false, error: "SMS verification is not configured on this server." };
    }
    const provider = getSmsProvider();
    const result = await provider.checkVerification({ to: identity.phone, code: code.replace(/\D/g, "") });
    verified = result.ok;
  }

  if (!verified) {
    await admin
      .from("user_two_factor")
      .update({ pending_attempts: Number(row.pending_attempts ?? 0) + 1, updated_at: nowIso() })
      .eq("user_id", user.id);
    await logSecurityEvent({
      action: "TWO_FACTOR_SETUP_FAILED",
      userId: user.id,
      status: "FAILED",
      metadata: { method },
    });
    return { ok: false, error: "That code is invalid or expired. Try again." };
  }

  const firstEnable = !row.enabled;

  const { error } = await admin
    .from("user_two_factor")
    .update({
      method,
      enabled: true,
      enabled_at: row.enabled_at ?? nowIso(),
      secret_verified_at: row.secret_verified_at ?? nowIso(),
      pending_method: null,
      pending_encrypted_secret: null,
      pending_attempts: 0,
      pending_contact_sent_at: null,
      failed_attempts: 0,
      locked_until: null,
      updated_at: nowIso(),
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Could not enable that method. Please try again." };

  const recoveryCodes = firstEnable ? await replaceRecoveryCodes(admin, user.id) : undefined;

  await logSecurityEvent({
    action: firstEnable ? "TWO_FACTOR_ENABLED" : "TWO_FACTOR_METHOD_CHANGED",
    userId: user.id,
    metadata: { method },
  });

  return {
    ok: true,
    enabled: true,
    recoveryCodes,
    message: firstEnable
      ? "Two-factor authentication is enabled. Save your recovery codes now."
      : `${method === "email" ? "Email" : "SMS"} is now your primary second factor.`,
  };
}

// ---------------------------------------------------------------------------
// disable / recovery codes / trusted devices
// ---------------------------------------------------------------------------

export async function disableTwoFactor(input: {
  password: string;
  code: string;
}): Promise<TwoFactorActionResult> {
  const passwordCheck = await verifyAccountPassword(input.password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, user.id);
  if (!row?.enabled) return { ok: true, message: "Two-factor authentication is already disabled." };

  const factorCheck = await verifyCurrentSecondFactor({ userId: user.id, row, code: input.code });
  if (!factorCheck.ok) return factorCheck;

  await admin
    .from("user_two_factor")
    .update({
      enabled: false,
      encrypted_secret: null,
      pending_method: null,
      pending_encrypted_secret: null,
      pending_attempts: 0,
      pending_contact_sent_at: null,
      secret_verified_at: null,
      enabled_at: null,
      last_totp_step: null,
      failed_attempts: 0,
      locked_until: null,
      updated_at: nowIso(),
    })
    .eq("user_id", user.id);

  await admin.from("two_factor_recovery_codes").delete().eq("user_id", user.id);
  await admin
    .from("trusted_devices")
    .update({ revoked_at: nowIso() })
    .eq("user_id", user.id)
    .is("revoked_at", null);
  await admin.from("two_factor_challenges").delete().eq("user_id", user.id);
  await clearTrustedDeviceCookie();

  await logSecurityEvent({ action: "TWO_FACTOR_DISABLED", userId: user.id });

  revalidatePath("/profile/security");
  return { ok: true, message: "Two-factor authentication has been disabled." };
}

export async function regenerateRecoveryCodes(input: {
  password: string;
  code: string;
}): Promise<{ ok: true; codes: string[] } | { ok: false; error: string }> {
  const passwordCheck = await verifyAccountPassword(input.password);
  if (!passwordCheck.ok) return { ok: false, error: passwordCheck.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const row = await getTwoFactorRow(admin, user.id);
  if (!row?.enabled) return { ok: false, error: "Enable two-factor authentication first." };

  const factorCheck = await verifyCurrentSecondFactor({ userId: user.id, row, code: input.code });
  if (!factorCheck.ok) return { ok: false, error: factorCheck.error };

  const codes = await replaceRecoveryCodes(admin, user.id);
  await logSecurityEvent({ action: "TWO_FACTOR_RECOVERY_REGENERATED", userId: user.id });

  revalidatePath("/profile/security");
  return { ok: true, codes };
}

export async function revokeTrustedDevice(deviceId: string): Promise<TwoFactorActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  const { data: device } = await admin
    .from("trusted_devices")
    .select("id, token_hash")
    .eq("id", deviceId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!device) return { ok: false, error: "Device not found." };

  await admin.from("trusted_devices").update({ revoked_at: nowIso() }).eq("id", device.id);

  const store = await cookies();
  const currentToken = store.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (currentToken && hashToken(currentToken) === device.token_hash) {
    await clearTrustedDeviceCookie();
  }

  await logSecurityEvent({
    action: "TWO_FACTOR_DEVICE_REVOKED",
    userId: user.id,
    metadata: { device_id: device.id },
  });

  revalidatePath("/profile/security");
  return { ok: true, message: "Trusted device removed." };
}

export async function revokeAllTrustedDevices(): Promise<TwoFactorActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };

  const admin = createAdminClient();
  await admin
    .from("trusted_devices")
    .update({ revoked_at: nowIso() })
    .eq("user_id", user.id)
    .is("revoked_at", null);
  await clearTrustedDeviceCookie();

  await logSecurityEvent({ action: "TWO_FACTOR_DEVICES_REVOKED_ALL", userId: user.id });
  revalidatePath("/profile/security");
  return { ok: true, message: "All trusted devices were signed out." };
}

// ---------------------------------------------------------------------------
// admin dashboard
// ---------------------------------------------------------------------------

export async function getAdminTwoFactorData(): Promise<AdminTwoFactorData> {
  const admin = createAdminClient();

  const [{ data: profiles, error: profilesError }, { data: factors }, { data: codes }, { data: failures }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, username, email, role, phone_number, phone_verified, created_at, deleted_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(0, 4999),
      admin.from("user_two_factor").select("*").range(0, 4999),
      admin.from("two_factor_recovery_codes").select("user_id, used_at").range(0, 49999),
      admin
        .from("failed_2fa_attempts")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .range(0, 49999),
    ]);

  if (profilesError) throw new Error(profilesError.message);

  const factorByUser = new Map((factors ?? []).map((factor) => [factor.user_id, factor]));
  const recoveryByUser = new Map<string, { total: number; used: number }>();

  for (const code of codes ?? []) {
    const current = recoveryByUser.get(code.user_id) ?? { total: 0, used: 0 };
    current.total += 1;
    if (code.used_at) current.used += 1;
    recoveryByUser.set(code.user_id, current);
  }

  const failuresByUser = new Map<string, number>();
  for (const failure of failures ?? []) {
    if (!failure.user_id) continue;
    failuresByUser.set(failure.user_id, (failuresByUser.get(failure.user_id) ?? 0) + 1);
  }

  const rows: AdminTwoFactorRow[] = (profiles ?? []).map((profile) => {
    const factor = factorByUser.get(profile.id);
    const recovery = recoveryByUser.get(profile.id) ?? { total: 0, used: 0 };
    const locked = isFuture(factor?.locked_until);

    return {
      userId: profile.id,
      name: profile.full_name,
      username: profile.username,
      email: profile.email,
      phone: profile.phone_verified ? profile.phone_number : null,
      role: profile.role,
      enabled: Boolean(factor?.enabled),
      method: factor?.enabled ? factor.method : null,
      enabledAt: factor?.enabled_at ?? null,
      lastUsedAt: factor?.last_used_at ?? null,
      failedAttempts: Number(factor?.failed_attempts ?? 0),
      lockedUntil: locked ? (factor?.locked_until ?? null) : null,
      recoveryRemaining: recovery.total - recovery.used,
      recoveryUsed: recovery.used,
      status: locked ? "locked" : factor?.enabled ? "enabled" : "disabled",
    };
  });

  const stats: AdminTwoFactorStats = {
    totalUsers: rows.length,
    enabledUsers: rows.filter((row) => row.enabled).length,
    withoutTwoFactor: rows.filter((row) => !row.enabled).length,
    recoveryCodesUsed: (codes ?? []).filter((code) => Boolean(code.used_at)).length,
    failedAttempts24h: failures?.length ?? 0,
    lockedUsers: rows.filter((row) => row.status === "locked").length,
  };

  return { rows, stats };
}

export async function adminUnlockTwoFactor(userId: string, adminId: string): Promise<TwoFactorActionResult> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("user_two_factor")
    .update({ failed_attempts: 0, locked_until: null, updated_at: nowIso() })
    .eq("user_id", userId);

  if (error) return { ok: false, error: "Could not unlock this user." };

  await admin.from("two_factor_challenges").delete().eq("user_id", userId);
  await logSecurityEvent({
    action: "ADMIN_2FA_UNLOCKED",
    userId,
    adminId,
    metadata: { admin_id: adminId },
  });

  return { ok: true, message: "Second-factor lock cleared." };
}

export async function adminResetTwoFactor(userId: string, adminId: string): Promise<TwoFactorActionResult> {
  const admin = createAdminClient();

  const { error } = await admin.from("user_two_factor").delete().eq("user_id", userId);
  if (error) return { ok: false, error: "Could not reset two-factor authentication." };

  await admin.from("two_factor_recovery_codes").delete().eq("user_id", userId);
  await admin
    .from("trusted_devices")
    .update({ revoked_at: nowIso() })
    .eq("user_id", userId)
    .is("revoked_at", null);
  await admin.from("two_factor_challenges").delete().eq("user_id", userId);

  await logSecurityEvent({
    action: "ADMIN_2FA_RESET",
    userId,
    adminId,
    metadata: { admin_id: adminId },
  });

  return { ok: true, message: "Two-factor authentication was reset. The user can enroll again." };
}

// Re-exported for the setup UI and tests.
export { generateTotp };
