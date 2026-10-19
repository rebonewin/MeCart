/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSmsProvider, getSmsSetupStatus, type SmsProviderName } from "@/lib/sms";
import { isValidE164, maskPhone, normalizePhone } from "@/lib/sms/phone";
import { createOtpChallenge, verifyOtpChallenge, type OtpChallenge } from "@/lib/sms/signing";
import { logSecurityEvent } from "@/lib/security/audit";

/**
 * Phone OTP business logic — shared by server actions and the /api/sms routes.
 *
 * The OTP itself lives entirely inside the SMS provider (Twilio Verify).
 * This module owns throttling bookkeeping, brute-force blocking, account
 * resolution (login vs. signup vs. linking), session bridging and auditing.
 */

export const PHONE_OTP_PURPOSES = [
  "login",
  "registration",
  "phone_verification",
  "phone_change",
  "link",
  "change",
  "reverify",
] as const;

export type PhoneOtpPurpose = (typeof PHONE_OTP_PURPOSES)[number];

export const OTP_EXPIRY_SECONDS = 300;
export const MAX_RESENDS = 3;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_VERIFY_ATTEMPTS = 5;
export const BLOCK_MINUTES = 15;
export const SHADOW_EMAIL_DOMAIN = "phone.mecart.app";

export type SendPhoneOtpResult =
  | {
      ok: true;
      message: string;
      expiresInSeconds: number;
      resendAvailableInSeconds: number;
      maxResends: number;
      resendCount: number;
      provider: string;
      challenge: OtpChallenge;
    }
  | { ok: false; error: string; missingConfig?: string[] };

export type VerifyPhoneOtpResult =
  | {
      ok: true;
      message: string;
      remainingAttempts: number;
      needsProfile: boolean;
      isNewUser: boolean;
      purpose: PhoneOtpPurpose;
    }
  | { ok: false; error: string; remainingAttempts?: number; blockedUntil?: string | null };

export type PhoneAccountActionResult = { ok: true; message: string } | { ok: false; error: string };

export type AdminPhoneVerificationRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  country_code: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  last_otp_sent_at: string | null;
  last_phone_login: string | null;
  otp_attempts: number;
  failed_attempts: number;
  blocked_until: string | null;
  verification_provider: string | null;
  status: "verified" | "pending" | "failed" | "blocked";
  is_active: boolean | null;
  created_at: string;
  pending: boolean;
};

export function isShadowEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${SHADOW_EMAIL_DOMAIN}`));
}

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

function dbError(message: string | null | undefined): string {
  const normalized = (message ?? "").trim();
  if (!normalized) return "Something went wrong. Please try again.";
  if (/duplicate key/i.test(normalized)) return "This phone number is already linked to another account.";
  return normalized.length > 300 ? `${normalized.slice(0, 297)}...` : normalized;
}

function isProviderName(value: unknown): value is SmsProviderName {
  return value === "twilio" || value === "msg91" || value === "gupshup" || value === "vonage";
}

async function audit(
  action: string,
  options: { phone?: string; userId?: string | null; adminId?: string | null; status?: "SUCCESS" | "FAILED"; metadata?: Record<string, unknown> } = {},
) {
  await logSecurityEvent({
    action,
    userId: options.userId ?? null,
    adminId: options.adminId ?? null,
    status: options.status ?? "SUCCESS",
    metadata: {
      ...(options.phone ? { phone: maskPhone(options.phone) } : {}),
      ...(options.metadata ?? {}),
    },
  });
}

async function getSessionUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

async function findProfileByPhone(admin: any, phone: string) {
  const { data } = await admin
    .from("profiles")
    .select("id, email, full_name, username, account_status, is_active, phone_number, phone_verified")
    .eq("phone_number", phone)
    .is("deleted_at", null)
    .maybeSingle();
  return data as
    | {
        id: string;
        email: string | null;
        full_name: string | null;
        username: string | null;
        account_status: string | null;
        is_active: boolean | null;
        phone_number: string | null;
        phone_verified: boolean | null;
      }
    | null;
}

async function markPhoneVerified(
  admin: any,
  profileId: string,
  phone: string,
  providerName: string,
  options: { countryCode?: string | null } = {},
) {
  const now = new Date().toISOString();
  const { data: current } = await admin
    .from("profiles")
    .select("account_status, country_code")
    .eq("id", profileId)
    .maybeSingle();

  const suspended = current?.account_status === "suspended";
  const update: Record<string, unknown> = {
    phone_number: phone,
    country_code: options.countryCode ?? current?.country_code ?? null,
    phone_verified: true,
    phone_verified_at: now,
    phone_last_login: now,
    last_phone_login: now,
    failed_attempts: 0,
    otp_attempts: 0,
    blocked_until: null,
    verification_provider: providerName,
    updated_at: now,
  };
  if (!suspended) update.account_status = "active";

  await admin.from("profiles").update(update).eq("id", profileId);
}

async function createPhoneShadowUser(admin: any, phone: string): Promise<{ id: string; email: string }> {
  const digits = phone.replace(/\D/g, "");
  const candidates = [
    `phone.${digits}@${SHADOW_EMAIL_DOMAIN}`,
    `phone.${digits}.${Date.now().toString(36)}@${SHADOW_EMAIL_DOMAIN}`,
  ];

  let lastError = "Unable to create phone account.";
  for (const email of candidates) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { signup_source: "phone_otp", phone, phone_verified: true },
    });
    if (!error && data?.user?.id) return { id: data.user.id as string, email };
    lastError = error?.message ?? lastError;
  }
  throw new Error(lastError);
}

async function establishSupabaseSession(admin: any, userId: string): Promise<void> {
  const { data: userRes, error: getUserError } = await admin.auth.admin.getUserById(userId);
  if (getUserError || !userRes?.user) {
    throw new Error(getUserError?.message ?? "Unable to resolve account for sign-in.");
  }

  let email: string | null = userRes.user.email ?? null;
  if (!email) {
    email = `phone.${userId.replace(/-/g, "").slice(0, 20)}@${SHADOW_EMAIL_DOMAIN}`;
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (emailError) throw new Error(emailError.message);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error(linkError?.message ?? "Unable to create a secure session.");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) throw new Error(verifyError.message);
}

/**
 * Send (or resend) an OTP through the configured SMS provider.
 * The caller must present the signed challenge issued for this phone/purpose.
 */
export async function sendPhoneOtpCode(input: {
  phone: string;
  purpose: PhoneOtpPurpose;
  deviceId?: string | null;
  countryCode?: string | null;
  challenge: Partial<OtpChallenge> | null | undefined;
  userId?: string | null;
}): Promise<SendPhoneOtpResult> {
  const phone = normalizePhone(input.phone);
  if (!isValidE164(phone)) {
    return { ok: false, error: "Enter a valid phone number in international format." };
  }
  if (!PHONE_OTP_PURPOSES.includes(input.purpose)) {
    return { ok: false, error: "Invalid verification purpose." };
  }

  const challengeCheck = verifyOtpChallenge(
    { phone, purpose: input.purpose, deviceId: input.deviceId ?? null },
    input.challenge,
  );
  if (!challengeCheck.ok) {
    return { ok: false, error: challengeCheck.error };
  }

  const provider = getSmsProvider();
  if (!provider.isConfigured()) {
    const missing = provider.missingEnv();
    await audit("PHONE_OTP_SENT_FAILED", {
      phone,
      userId: input.userId,
      status: "FAILED",
      metadata: { reason: "provider_not_configured", provider: provider.name, missing },
    });
    return {
      ok: false,
      error: `SMS provider "${provider.name}" is not configured yet. Missing: ${missing.join(", ")}.`,
      missingConfig: missing,
    };
  }

  const admin = createAdminClient() as any;
  const clientIp = await getClientIp();

  try {
    await admin.rpc("expire_stale_phone_otp_requests", { p_limit: 100 });
  } catch {
    // Maintenance sweep is best-effort.
  }

  const rpc = await admin.rpc("create_phone_otp_request", {
    p_phone_number: phone,
    p_purpose: input.purpose,
    p_expires_in_seconds: OTP_EXPIRY_SECONDS,
    p_max_resend: MAX_RESENDS,
    p_client_ip: clientIp,
    p_device_id: input.deviceId ?? null,
    p_provider: provider.name,
    p_signature_nonce: input.challenge?.nonce ?? null,
    p_country_code: input.countryCode ?? null,
  });

  if (rpc.error) {
    await audit("PHONE_OTP_BLOCKED", {
      phone,
      userId: input.userId,
      status: "FAILED",
      metadata: { reason: "throttled", message: rpc.error.message },
    });
    return { ok: false, error: dbError(rpc.error.message) };
  }

  const row = rpc.data as { request_id: string; resend_count: number; expires_at: string } | null;

  const send = await provider.sendVerification({ to: phone, channel: "sms" });
  if (!send.ok) {
    if (row?.request_id) {
      await admin
        .from("phone_otp_requests")
        .update({ last_error: send.error })
        .eq("id", row.request_id);
    }
    await audit("PHONE_OTP_SENT_FAILED", {
      phone,
      userId: input.userId,
      status: "FAILED",
      metadata: { provider: provider.name, code: send.code ?? null, error: send.error },
    });
    return {
      ok: false,
      error: send.retryable
        ? "The SMS provider is temporarily unavailable. Please try again in a moment."
        : send.error,
    };
  }

  await audit(row && row.resend_count > 0 ? "PHONE_OTP_RESENT" : "PHONE_OTP_SENT", {
    phone,
    userId: input.userId,
    metadata: {
      provider: provider.name,
      resend_count: row?.resend_count ?? 0,
      expires_in_seconds: OTP_EXPIRY_SECONDS,
    },
  });

  return {
    ok: true,
    message: "We sent a 6-digit code by SMS. It expires in 5 minutes.",
    expiresInSeconds: OTP_EXPIRY_SECONDS,
    resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
    maxResends: MAX_RESENDS,
    resendCount: row?.resend_count ?? 0,
    provider: provider.name,
    challenge: {
      nonce: input.challenge?.nonce ?? "",
      timestamp: input.challenge?.timestamp ?? 0,
      signature: input.challenge?.signature ?? "",
    },
  };
}

/** Public helper so callers can mint a challenge bound to phone/purpose/device. */
export function createPhoneOtpChallenge(input: {
  phone: string;
  purpose: PhoneOtpPurpose;
  deviceId?: string | null;
}): { ok: true; challenge: OtpChallenge } | { ok: false; error: string } {
  const phone = normalizePhone(input.phone);
  if (!isValidE164(phone)) {
    return { ok: false, error: "Enter a valid phone number in international format." };
  }
  if (!PHONE_OTP_PURPOSES.includes(input.purpose)) {
    return { ok: false, error: "Invalid verification purpose." };
  }
  return {
    ok: true,
    challenge: createOtpChallenge({ phone, purpose: input.purpose, deviceId: input.deviceId ?? null }),
  };
}

async function finalizeLogin(
  admin: any,
  phone: string,
  providerName: string,
  countryCode?: string | null,
): Promise<VerifyPhoneOtpResult> {
  let profile = await findProfileByPhone(admin, phone);
  let isNewUser = false;

  if (profile && (profile.account_status === "suspended" || profile.is_active === false)) {
    await audit("PHONE_LOGIN_BLOCKED", {
      phone,
      userId: profile.id,
      status: "FAILED",
      metadata: { reason: "account_deactivated" },
    });
    return { ok: false, error: "This account has been deactivated. Please contact support." };
  }

  if (!profile) {
    const created = await createPhoneShadowUser(admin, phone);
    isNewUser = true;
    await markPhoneVerified(admin, created.id, phone, providerName, { countryCode });
    await audit("PHONE_ACCOUNT_CREATED", {
      phone,
      userId: created.id,
      metadata: { provider: providerName },
    });
    profile = await findProfileByPhone(admin, phone);
    if (!profile) {
      return { ok: false, error: "Unable to create your account. Please try again." };
    }
  } else {
    await markPhoneVerified(admin, profile.id, phone, providerName, { countryCode });
  }

  try {
    await establishSupabaseSession(admin, profile.id);
  } catch (error) {
    await audit("PHONE_LOGIN_FAILED", {
      phone,
      userId: profile.id,
      status: "FAILED",
      metadata: { reason: "session_bridge_failed", message: error instanceof Error ? error.message : "unknown" },
    });
    return { ok: false, error: "Phone verified, but we could not start your session. Please try again." };
  }

  await audit("PHONE_LOGIN", {
    phone,
    userId: profile.id,
    metadata: { provider: providerName, new_user: isNewUser },
  });

  return {
    ok: true,
    message: isNewUser ? "Phone verified. Let's finish your profile." : "Welcome back to MeCart!",
    remainingAttempts: 0,
    needsProfile: isNewUser,
    isNewUser,
    purpose: "login",
  };
}

async function finalizeLink(
  admin: any,
  purpose: PhoneOtpPurpose,
  phone: string,
  providerName: string,
  countryCode?: string | null,
): Promise<VerifyPhoneOtpResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before linking a phone number." };
  }

  const existing = await findProfileByPhone(admin, phone);
  if (existing && existing.id !== user.id) {
    const { data: authUser } = await admin.auth.admin.getUserById(user.id);
    const authEmail: string | null = authUser?.user?.email ?? null;
    const realVerifiedEmail = Boolean(
      authEmail && !isShadowEmail(authEmail) && authUser?.user?.email_confirmed_at,
    );
    const existingIsShadow = !existing.email || isShadowEmail(existing.email);

    if (!(realVerifiedEmail && existingIsShadow)) {
      return { ok: false, error: "This phone number is already linked to another account." };
    }

    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", existing.id);

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: "This phone belongs to another account with order history. Sign in with that account instead.",
      };
    }

    await admin
      .from("profiles")
      .update({
        phone_number: null,
        phone_verified: false,
        phone_verified_at: null,
        verification_provider: null,
        blocked_until: null,
      })
      .eq("id", existing.id);

    const deletion = await admin.auth.admin.deleteUser(existing.id);
    if (deletion.error) {
      return { ok: false, error: "Unable to merge the existing phone account. Please contact support." };
    }

    await audit("PHONE_ACCOUNT_MERGED", {
      phone,
      userId: user.id,
      metadata: { merged_from: existing.id, reason: "verified_email_plus_phone_match" },
    });
  }

  await markPhoneVerified(admin, user.id, phone, providerName, { countryCode });

  const action = purpose === "change" ? "PHONE_CHANGED" : purpose === "reverify" ? "PHONE_REVERIFIED" : "PHONE_LINKED";
  await audit(action, { phone, userId: user.id, metadata: { provider: providerName } });

  return {
    ok: true,
    message: purpose === "change" ? "Phone number updated." : "Phone number linked successfully.",
    remainingAttempts: 0,
    needsProfile: false,
    isNewUser: false,
    purpose,
  };
}

async function finalizeChange(
  admin: any,
  phone: string,
  providerName: string,
  countryCode?: string | null,
): Promise<VerifyPhoneOtpResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before changing your phone number." };
  }

  const existing = await findProfileByPhone(admin, phone);
  if (existing && existing.id !== user.id) {
    return { ok: false, error: "This phone number is already linked to another account." };
  }

  const { data: before } = await admin
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .maybeSingle();

  await markPhoneVerified(admin, user.id, phone, providerName, { countryCode });

  await audit("PHONE_CHANGED", {
    phone,
    userId: user.id,
    metadata: {
      provider: providerName,
      from: before?.phone_number ? maskPhone(before.phone_number as string) : null,
    },
  });

  return {
    ok: true,
    message: "Phone number updated.",
    remainingAttempts: 0,
    needsProfile: false,
    isNewUser: false,
    purpose: "change",
  };
}

/** Check the code against the provider and finalize the matching flow. */
export async function verifyPhoneOtpCode(input: {
  phone: string;
  code: string;
  purpose: PhoneOtpPurpose;
  deviceId?: string | null;
  countryCode?: string | null;
  challenge?: Partial<OtpChallenge> | null;
}): Promise<VerifyPhoneOtpResult> {
  const phone = normalizePhone(input.phone);
  if (!isValidE164(phone)) {
    return { ok: false, error: "Enter a valid phone number in international format." };
  }
  if (!/^\d{6}$/.test(input.code.trim())) {
    return { ok: false, error: "Enter the 6-digit code from the SMS." };
  }
  if (!PHONE_OTP_PURPOSES.includes(input.purpose)) {
    return { ok: false, error: "Invalid verification purpose." };
  }

  if (input.challenge?.signature) {
    const challengeCheck = verifyOtpChallenge(
      { phone, purpose: input.purpose, deviceId: input.deviceId ?? null },
      input.challenge,
    );
    if (!challengeCheck.ok) return { ok: false, error: challengeCheck.error };
  }

  const admin = createAdminClient() as any;
  const code = input.code.trim();

  const { data: activeRows } = await admin
    .from("phone_otp_requests")
    .select("*")
    .eq("phone_number", phone)
    .eq("purpose", input.purpose)
    .is("consumed_at", null)
    .eq("is_verified", false)
    .order("requested_at", { ascending: false })
    .limit(1);

  const request = (activeRows ?? [])[0] as Record<string, any> | undefined;

  if (!request) {
    const { data: latestRows } = await admin
      .from("phone_otp_requests")
      .select("expires_at, consumed_at, is_verified, last_error, blocked_until")
      .eq("phone_number", phone)
      .eq("purpose", input.purpose)
      .order("requested_at", { ascending: false })
      .limit(1);
    const latest = (latestRows ?? [])[0] as Record<string, any> | undefined;
    if (latest?.blocked_until && new Date(latest.blocked_until as string) > new Date()) {
      await audit("PHONE_OTP_VERIFY_BLOCKED", {
        phone,
        status: "FAILED",
        metadata: { blocked_until: latest.blocked_until },
      });
      return {
        ok: false,
        error: "Too many wrong attempts. Try again in a few minutes.",
        blockedUntil: latest.blocked_until as string,
      };
    }
    if (latest && !latest.is_verified && !latest.consumed_at) {
      await audit("PHONE_OTP_EXPIRED", { phone, metadata: { purpose: input.purpose } });
      return { ok: false, error: "This code expired. Request a new one." };
    }
    return { ok: false, error: "No active code found. Request a new one." };
  }

  if (request.blocked_until && new Date(request.blocked_until as string) > new Date()) {
    await audit("PHONE_OTP_VERIFY_BLOCKED", {
      phone,
      status: "FAILED",
      metadata: { blocked_until: request.blocked_until },
    });
    return {
      ok: false,
      error: "Too many wrong attempts. Try again in a few minutes.",
      blockedUntil: request.blocked_until as string,
    };
  }

  if (request.expires_at && new Date(request.expires_at as string) < new Date()) {
    await admin
      .from("phone_otp_requests")
      .update({ consumed_at: new Date().toISOString(), last_error: "expired" })
      .eq("id", request.id);
    await audit("PHONE_OTP_EXPIRED", { phone, metadata: { purpose: input.purpose } });
    return { ok: false, error: "This code expired. Request a new one." };
  }

  const providerName: SmsProviderName = isProviderName(request.provider) ? request.provider : "twilio";
  const provider = getSmsProvider(providerName);
  const check = await provider.checkVerification({ to: phone, code });

  const rpc = await admin.rpc("verify_phone_otp_request", {
    p_phone_number: phone,
    p_purpose: input.purpose,
    p_success: check.ok,
    p_error: check.ok ? null : check.error,
  });

  const ledger = (rpc.error ? null : (rpc.data as Record<string, any>)) ?? null;
  const remaining = typeof ledger?.remaining === "number" ? ledger.remaining : 0;

  if (!check.ok) {
    await audit("PHONE_OTP_VERIFY_FAILED", {
      phone,
      status: "FAILED",
      metadata: {
        provider: providerName,
        code: check.code ?? null,
        attempts: ledger?.attempts ?? null,
        blocked: ledger?.status === "blocked",
      },
    });
    if (ledger?.status === "blocked") {
      return {
        ok: false,
        error: "Too many wrong codes. This number is temporarily blocked — try again in 15 minutes.",
        remainingAttempts: 0,
        blockedUntil: (ledger.blocked_until as string) ?? null,
      };
    }
    const suffix = remaining > 0 ? ` ${remaining} attempt${remaining === 1 ? "" : "s"} left.` : "";
    return {
      ok: false,
      error: check.status === "expired" ? check.error : `Incorrect code.${suffix || " Please request a new one."}`,
      remainingAttempts: remaining,
    };
  }

  await audit("PHONE_OTP_VERIFIED", {
    phone,
    metadata: { provider: providerName, purpose: input.purpose },
  });

  if (input.purpose === "link" || input.purpose === "phone_verification" || input.purpose === "reverify") {
    return finalizeLink(admin, input.purpose, phone, providerName, input.countryCode);
  }
  if (input.purpose === "change" || input.purpose === "phone_change") {
    return finalizeChange(admin, phone, providerName, input.countryCode);
  }

  return finalizeLogin(admin, phone, providerName, input.countryCode);
}

/** Persist the optional profile details collected after a phone signup. */
export async function completePhoneProfileForSession(input: {
  phone: string;
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  password?: string | null;
}): Promise<PhoneAccountActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Session expired. Please verify your phone again." };

  const admin = createAdminClient() as any;
  const { data: profile } = await admin
    .from("profiles")
    .select("id, phone_number, phone_verified, username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.phone_verified) {
    return { ok: false, error: "Please verify your phone number first." };
  }

  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) return { ok: false, error: emailError.message };
  }

  if (input.password && input.password.length >= 8) {
    const { error: passwordError } = await supabase.auth.updateUser({ password: input.password });
    if (passwordError) return { ok: false, error: passwordError.message };
  }

  const update: Record<string, unknown> = {
    account_status: "active",
    updated_at: new Date().toISOString(),
  };
  if (input.fullName?.trim()) update.full_name = input.fullName.trim();
  if (input.avatarUrl) update.avatar_url = input.avatarUrl;
  if (email) {
    update.email = email;
    update.username =
      email
        .split("@")[0]
        .replace(/[^a-z0-9._-]/gi, "")
        .slice(0, 32) || profile.username;
  }

  await admin.from("profiles").update(update).eq("id", user.id);
  await audit("PHONE_PROFILE_COMPLETED", { phone: profile.phone_number as string, userId: user.id });

  return { ok: true, message: "Profile saved." };
}

/** Unlink (remove) the phone number from the signed-in account. */
export async function unlinkPhoneNumber(): Promise<PhoneAccountActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to manage your phone number." };

  const admin = createAdminClient() as any;
  const { data: before } = await admin
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .maybeSingle();

  if (!before?.phone_number) {
    return { ok: false, error: "No phone number is linked to this account." };
  }

  await admin
    .from("profiles")
    .update({
      phone_number: null,
      phone_verified: false,
      phone_verified_at: null,
      verification_provider: null,
      blocked_until: null,
      failed_attempts: 0,
      otp_attempts: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  await audit("PHONE_UNLINKED", {
    userId: user.id,
    metadata: { phone: maskPhone(before.phone_number as string) },
  });

  return { ok: true, message: "Phone number removed." };
}

/** Staff-initiated resend from the admin panel (no client challenge needed). */
export async function adminResendPhoneVerification(
  phone: string,
  adminId?: string | null,
): Promise<PhoneAccountActionResult> {
  const normalized = normalizePhone(phone);
  if (!isValidE164(normalized)) return { ok: false, error: "This user has no valid phone number." };

  const challengeResult = createPhoneOtpChallenge({
    phone: normalized,
    purpose: "phone_verification",
    deviceId: `admin:${adminId ?? "staff"}`,
  });
  if (!challengeResult.ok) return { ok: false, error: challengeResult.error };

  const send = await sendPhoneOtpCode({
    phone: normalized,
    purpose: "phone_verification",
    deviceId: `admin:${adminId ?? "staff"}`,
    challenge: challengeResult.challenge,
  });

  if (!send.ok) return { ok: false, error: send.error };

  await audit("ADMIN_RESEND_VERIFICATION", {
    phone: normalized,
    adminId: adminId ?? null,
    metadata: { provider: send.provider },
  });

  return { ok: true, message: "Verification code sent." };
}

/** Safe setup status for UI (provider name + missing variable names only). */
export function getPhoneOtpSetupStatus() {
  return getSmsSetupStatus();
}

/** Staff-only data feed for Users → Phone Verification. */
export async function listPhoneVerificationUsers(search?: string | null): Promise<AdminPhoneVerificationRow[]> {
  const admin = createAdminClient() as any;
  const term = (search ?? "").trim().toLowerCase();

  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, full_name, username, email, phone_number, country_code, phone_verified, phone_verified_at, phone_last_login, last_phone_login, otp_attempts, failed_attempts, blocked_until, verification_provider, last_otp_sent_at, otp_last_sent, is_active, account_status, created_at",
    )
    .not("phone_number", "is", null)
    .order("last_otp_sent_at", { ascending: false, nullsFirst: false })
    .limit(500);

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: requests } = await admin
    .from("phone_otp_requests")
    .select(
      "phone_number, purpose, requested_at, expires_at, verification_attempts, blocked_until, is_verified, country_code, last_error, provider",
    )
    .gte("requested_at", since)
    .order("requested_at", { ascending: false })
    .limit(300);

  const rows: AdminPhoneVerificationRow[] = [];
  const seen = new Set<string>();

  const deriveStatus = (row: {
    phone_verified: boolean;
    blocked_until: string | null;
    failed_attempts: number;
    last_otp_sent_at: string | null;
  }): AdminPhoneVerificationRow["status"] => {
    if (row.blocked_until && new Date(row.blocked_until) > new Date()) return "blocked";
    if (row.phone_verified) return "verified";
    if ((row.failed_attempts ?? 0) > 0) return "failed";
    return "pending";
  };

  for (const p of (profiles ?? []) as Record<string, any>[]) {
    if (!p.phone_number) continue;
    seen.add(p.phone_number as string);
    const failed = Number(p.failed_attempts ?? p.otp_attempts ?? 0);
    rows.push({
      id: p.id as string,
      full_name: (p.full_name as string | null) ?? null,
      username: (p.username as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      phone_number: p.phone_number as string,
      country_code: (p.country_code as string | null) ?? null,
      phone_verified: Boolean(p.phone_verified),
      phone_verified_at: (p.phone_verified_at as string | null) ?? null,
      last_otp_sent_at: (p.otp_last_sent as string | null) ?? (p.last_otp_sent_at as string | null) ?? null,
      last_phone_login: (p.last_phone_login as string | null) ?? (p.phone_last_login as string | null) ?? null,
      otp_attempts: Number(p.otp_attempts ?? 0),
      failed_attempts: failed,
      blocked_until: (p.blocked_until as string | null) ?? null,
      verification_provider: (p.verification_provider as string | null) ?? null,
      status: deriveStatus({
        phone_verified: Boolean(p.phone_verified),
        blocked_until: (p.blocked_until as string | null) ?? null,
        failed_attempts: failed,
        last_otp_sent_at: (p.last_otp_sent_at as string | null) ?? null,
      }),
      is_active: (p.is_active as boolean | null) ?? null,
      created_at: p.created_at as string,
      pending: false,
    });
  }

  for (const r of (requests ?? []) as Record<string, any>[]) {
    const phoneNumber = r.phone_number as string;
    if (!phoneNumber || seen.has(phoneNumber)) continue;
    seen.add(phoneNumber);
    const attempts = Number(r.verification_attempts ?? 0);
    const blocked = r.blocked_until && new Date(r.blocked_until as string) > new Date();
    rows.push({
      id: `otp:${phoneNumber}`,
      full_name: null,
      username: null,
      email: null,
      phone_number: phoneNumber,
      country_code: (r.country_code as string | null) ?? null,
      phone_verified: Boolean(r.is_verified),
      phone_verified_at: null,
      last_otp_sent_at: r.requested_at as string,
      last_phone_login: null,
      otp_attempts: attempts,
      failed_attempts: attempts,
      blocked_until: (r.blocked_until as string | null) ?? null,
      verification_provider: (r.provider as string | null) ?? null,
      status: blocked ? "blocked" : r.is_verified ? "verified" : attempts > 0 ? "failed" : "pending",
      is_active: null,
      created_at: r.requested_at as string,
      pending: true,
    });
  }

  const filtered = term
    ? rows.filter((row) =>
        `${row.full_name ?? ""} ${row.username ?? ""} ${row.email ?? ""} ${row.phone_number ?? ""}`
          .toLowerCase()
          .includes(term),
      )
    : rows;

  return filtered.slice(0, 400);
}
