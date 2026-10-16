"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security/audit";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Policy (kept in sync with supabase/migrations/20261017000400)
// ---------------------------------------------------------------------------

const OTP_EXPIRY_SECONDS = 600; // 10 minutes — matches Supabase Auth OTP expiry
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_RESENDS = 5;
const MAX_OTP_VERIFY_ATTEMPTS = 5;

const CODE_EXPIRED_MESSAGE =
  "Your verification code has expired. Please request a new one.";
const CODE_INCORRECT_MESSAGE = "That code is incorrect or has expired.";
const CODE_LOCKED_MESSAGE =
  "Too many incorrect attempts. Request a new code to continue.";
const GENERIC_SEND_MESSAGE =
  "If that account exists and is unverified, a new code has been sent.";

type AdminClient = SupabaseClient<Database>;
type SessionClient = Awaited<ReturnType<typeof createClient>>;

export type OtpPurpose = "registration" | "email_verification" | "password_reset";

export type OtpSendResult =
  | {
      ok: true;
      message: string;
      expiresInSeconds: number;
      resendAvailableInSeconds: number;
      resendCount: number;
    }
  | { ok: false; error: string };

export type OtpVerifyResult =
  | { ok: true; message: string; remainingAttempts: number; redirectTo?: string }
  | { ok: false; error: string; remainingAttempts?: number; locked?: boolean };

export type OtpAccountResult = { ok: true; message: string } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// schemas
// ---------------------------------------------------------------------------

const nameSchema = z.string().trim().min(2, "Enter your full name").max(80);
const emailSchema = z.email("Enter a valid email address").max(254);
const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your email");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Add at least one uppercase letter")
  .regex(/[a-z]/, "Add at least one lowercase letter")
  .regex(/[0-9]/, "Add at least one number")
  .regex(/[^A-Za-z0-9]/, "Add at least one special character");

const passwordCreateSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sanitizeUsername(base: string) {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  return clean || "mecart-user";
}

function readMetaString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function allocateUsername(admin: AdminClient, baseEmail: string): Promise<string> {
  const base = sanitizeUsername(baseEmail.split("@")[0] ?? "mecart");
  for (let i = 0; i < 20; i += 1) {
    const suffix = i === 0 ? "" : `-${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = `${base}${suffix}`.slice(0, 36);

    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("username", candidate);

    if (!error && (count ?? 0) === 0) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36).slice(-6)}`.slice(0, 36);
}

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

function friendlyOtpSendError(error: { message?: string; status?: number } | null): string {
  const message = (error?.message ?? "").toLowerCase();
  if (message.includes("rate limit") || message.includes("too many"))
    return "Please wait a moment. Email delivery is temporarily rate limited.";
  if (message.includes("error sending") || message.includes("smtp"))
    return "Email delivery is unavailable right now. Please try again later.";
  if (error?.status === 429) return "Please wait a moment before requesting another code.";
  return "We could not send the verification code right now. Please try again.";
}

function mapVerifyFailure(
  message: string | undefined,
  attempts: number,
  locked: boolean,
): string {  if (locked || attempts >= MAX_OTP_VERIFY_ATTEMPTS) return CODE_LOCKED_MESSAGE;
  const raw = (message ?? "").toLowerCase();
  if (raw.includes("expired")) return CODE_EXPIRED_MESSAGE;
  if (raw.includes("rate limit") || raw.includes("security purposes"))
    return "Please wait a moment before trying again.";
  return CODE_INCORRECT_MESSAGE;
}

type LedgerOutcome = {
  attempts?: number;
  remaining_attempts?: number;
  locked?: boolean;
  verified?: boolean;
};

type SignupAvailability = { username_taken: boolean; email_taken: boolean };

async function getProfileByEmail(admin: AdminClient, email: string) {
  const { data } = await admin
    .from("profiles")
    .select("id, email, username, full_name, account_status, email_verified_at")
    .eq("email", email)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// send
// ---------------------------------------------------------------------------

export async function requestEmailOtp(
  purpose: OtpPurpose,
  input: { name?: string | null; email: string },
): Promise<OtpSendResult> {
  const parsed = z
    .object({
      name: purpose === "registration" ? nameSchema : z.string().trim().max(80).optional(),
      email: emailSchema,
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid name and email" };
  }

  const email = normalizeEmail(parsed.data.email);
  const name = parsed.data.name?.trim() ?? null;
  const clientIp = await getClientIp();

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  const profile = await getProfileByEmail(admin, email);
  const { data: availability } = await admin.rpc("check_signup_available", {
    p_username: "",
    p_email: email,
  });
  const accountExists =
    (availability as SignupAvailability | null)?.email_taken === true || Boolean(profile);

  // ---- purpose-specific eligibility rules ---------------------------------
  if (purpose === "registration" && accountExists) {
    if (profile?.account_status === "active") {
      await logSecurityEvent({
        action: "OTP_BLOCKED",
        email,
        userId: profile.id,
        status: "FAILED",
        metadata: { purpose, reason: "duplicate_email" },
      });
      return { ok: false, error: "This email is already registered. Please sign in instead." };
    }
    if (profile?.account_status === "suspended") {
      return { ok: false, error: "This account is suspended. Please contact support." };
    }
    // Otherwise the account is mid-registration (pending or verified, no
    // password yet) — a fresh code resumes the funnel safely.
  }

  if ((purpose === "email_verification" || purpose === "password_reset") && !accountExists) {
    // Never reveal whether a mailbox has an account.
    return {
      ok: true,
      message: GENERIC_SEND_MESSAGE,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
      resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      resendCount: 0,
    };
  }

  // ---- server-side throttling + ledger ------------------------------------
  let resendCount = 0;
  let isResend = false;
  try {
    const { data, error } = await admin.rpc("create_email_otp_request", {
      p_email: email,
      p_purpose: purpose,
      p_expires_in_seconds: OTP_EXPIRY_SECONDS,
      p_max_resend: MAX_OTP_RESENDS,
      p_client_ip: clientIp ?? undefined,
    });

    if (error) {
      await logSecurityEvent({
        action: "OTP_BLOCKED",
        email,
        userId: profile?.id ?? null,
        status: "FAILED",
        metadata: { purpose, reason: error.message, clientIp },
      });
      return { ok: false, error: error.message };
    }

    const ledger = data as { resend_count?: number; is_resend?: boolean } | null;
    resendCount = ledger?.resend_count ?? 0;
    isResend = ledger?.is_resend ?? false;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to start verification.",
    };
  }

  // ---- dispatch the real Supabase email OTP --------------------------------
  const username = purpose === "registration" && !accountExists ? await allocateUsername(admin, email) : null;
  const supabase: SessionClient = await createClient();

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: purpose === "registration",
      ...(purpose === "registration"
        ? { data: { full_name: name, name, username, flow: "registration" } }
        : {}),
    },
  });

  if (otpError) {
    await admin
      .from("email_otp_requests")
      .update({ last_error: otpError.message })
      .eq("purpose", purpose)
      .eq("email", email)
      .is("consumed_at", null);

    await logSecurityEvent({
      action: "OTP_SENT_FAILED",
      email,
      userId: profile?.id ?? null,
      status: "FAILED",
      metadata: { purpose, error: otpError.message, clientIp },
    });
    return { ok: false, error: friendlyOtpSendError(otpError) };
  }

  await logSecurityEvent({
    action: isResend ? "OTP_RESENT" : "OTP_SENT",
    email,
    userId: profile?.id ?? null,
    metadata: { purpose, expiresInSeconds: OTP_EXPIRY_SECONDS, clientIp, resendCount },
  });

  return {
    ok: true,
    message: "A 6-digit code has been sent to your email.",
    expiresInSeconds: OTP_EXPIRY_SECONDS,
    resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    resendCount,
  };
}

export async function requestRegistrationOtp(input: { name: string; email: string }) {
  return requestEmailOtp("registration", input);
}

export async function requestEmailVerificationOtp(emailInput: string): Promise<OtpSendResult> {
  const parsed = emailSchema.safeParse(emailInput);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  return requestEmailOtp("email_verification", { email: parsed.data });
}

export async function requestPasswordResetOtp(emailInput: string): Promise<OtpSendResult> {
  const parsed = emailSchema.safeParse(emailInput);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const result = await requestEmailOtp("password_reset", { email: parsed.data });
  if (!result.ok) {
    // Throttle + validation errors are safe to surface (they never reveal
    // whether the account exists).
    return result;
  }
  return { ...result, message: GENERIC_SEND_MESSAGE };
}

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

export async function verifyOtpCode(
  purpose: OtpPurpose,
  input: { email: string; token: string; name?: string | null },
): Promise<OtpVerifyResult> {
  const parsed = z
    .object({ email: emailSchema, token: otpSchema })
    .safeParse({ email: input.email, token: input.token });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code." };
  }

  const email = normalizeEmail(parsed.data.email);
  const token = parsed.data.token;

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  // 1. The ledger is the single source of truth for expiry / attempts.
  const { data: request } = await admin
    .from("email_otp_requests")
    .select("id, verification_attempts, expires_at")
    .eq("purpose", purpose)
    .eq("email", email)
    .eq("is_verified", false)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request) {
    await logSecurityEvent({
      action: "OTP_EXPIRED",
      email,
      status: "FAILED",
      metadata: { purpose },
    });
    return { ok: false, error: CODE_EXPIRED_MESSAGE, remainingAttempts: 0, locked: false };
  }

  if (request.verification_attempts >= MAX_OTP_VERIFY_ATTEMPTS) {
    return { ok: false, error: CODE_LOCKED_MESSAGE, remainingAttempts: 0, locked: true };
  }

  // 2. The actual verification happens in Supabase Auth — never locally.
  const supabase: SessionClient = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  // 3. Mirror the outcome onto the ledger + profile counters.
  let attempts = request.verification_attempts + 1;
  let locked = false;
  let remaining = Math.max(0, MAX_OTP_VERIFY_ATTEMPTS - attempts);

  try {
    const { data: outcome, error: ledgerError } = await admin.rpc("verify_email_otp_request", {
      p_email: email,
      p_purpose: purpose,
      p_success: !error && Boolean(data?.user),
      p_error: error ? error.message : undefined,
      p_max_attempts: MAX_OTP_VERIFY_ATTEMPTS,
    });

    if (!ledgerError && outcome) {
      const result = outcome as LedgerOutcome;
      attempts = result.attempts ?? attempts;
      locked = result.locked ?? locked;
      remaining = result.remaining_attempts ?? remaining;
    }
  } catch {
    // Ledger bookkeeping must never break the real verification outcome.
  }

  if (error || !data?.user) {
    await logSecurityEvent({
      action: "OTP_FAILED",
      email,
      status: "FAILED",
      metadata: { purpose, attempts, locked, error: error?.message ?? "invalid code" },
    });
    return {
      ok: false,
      error: mapVerifyFailure(error?.message, attempts, locked),
      remainingAttempts: remaining,
      locked,
    };
  }

  const user = data.user;
  let redirectTo: string | undefined;

  // 4. Purpose-specific bookkeeping after a real, verified OTP.
  if (purpose === "registration") {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName =
      input.name?.trim() ||
      readMetaString(metadata, "full_name") ||
      readMetaString(metadata, "name");
    const username =
      readMetaString(metadata, "username") || (await allocateUsername(admin, email));

    if (input.name) {
      await supabase.auth.updateUser({
        data: { ...metadata, full_name: fullName, name: fullName, username, flow: "registration" },
      });
    }

    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        email,
        account_status: "email_verified",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } else if (purpose === "email_verification") {
    // Hosted GoTrue stores a bcrypt placeholder even for passwordless users,
    // so route on our own account lifecycle instead of encrypted_password.
    const { data: profileRow } = await admin
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .maybeSingle();
    const currentStatus = profileRow?.account_status ?? "pending_verification";
    const needsPassword = currentStatus === "pending_verification" || currentStatus === "email_verified";

    if (currentStatus !== "suspended") {
      await admin
        .from("profiles")
        .update({
          account_status: needsPassword ? "email_verified" : "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    redirectTo = needsPassword
      ? `/register?resume=password&email=${encodeURIComponent(email)}`
      : "/";
  }

  await logSecurityEvent({
    action: "OTP_VERIFIED",
    email,
    userId: user.id,
    metadata: { purpose },
  });

  return {
    ok: true,
    message: "Verification successful.",
    remainingAttempts: remaining,
    ...(redirectTo ? { redirectTo } : {}),
  };
}

export async function verifyPasswordResetOtp(input: { email: string; token: string }) {
  return verifyOtpCode("password_reset", input);
}

// ---------------------------------------------------------------------------
// password creation (only reached after a successful OTP verification)
// ---------------------------------------------------------------------------

export async function completeRegistration(input: {
  email: string;
  password: string;
  confirm: string;
}): Promise<OtpAccountResult> {
  const parsed = passwordCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid password" };
  }

  const email = normalizeEmail(parsed.data.email);
  const supabase: SessionClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email || normalizeEmail(user.email) !== email) {
    return { ok: false, error: "Your verification session has ended. Please verify your email again." };
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  // The account lifecycle tells us whether a password was ever created —
  // hosted GoTrue keeps a bcrypt placeholder even for passwordless users.
  const { data: registrationProfile } = await admin
    .from("profiles")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (registrationProfile?.account_status === "active") {
    return { ok: false, error: "This account is already active. Please sign in instead." };
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const update = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { ...metadata, password_created_at: new Date().toISOString() },
  });

  if (update.error) {
    return { ok: false, error: update.error.message };
  }

  const fullName =
    readMetaString(metadata, "full_name") ?? readMetaString(metadata, "name");
  const username =
    readMetaString(metadata, "username") ?? (await allocateUsername(admin, email));

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name: fullName,
      username,
      account_status: "active",
      email_verified_at: user.email_confirmed_at ?? new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await logSecurityEvent({
      action: "ACCOUNT_CREATED",
      email,
      userId: user.id,
      status: "FAILED",
      metadata: { reason: profileError.message },
    });
  }

  await admin.rpc("consumed_email_otp_request", { p_email: email, p_purpose: "registration" });

  await logSecurityEvent({
    action: "PASSWORD_CREATED",
    email,
    userId: user.id,
    metadata: { flow: "registration" },
  });
  await logSecurityEvent({
    action: "ACCOUNT_CREATED",
    email,
    userId: user.id,
    metadata: { flow: "registration" },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Account created successfully." };
}

export async function completePasswordReset(input: {
  email: string;
  password: string;
  confirm: string;
}): Promise<OtpAccountResult> {
  const parsed = passwordCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid password" };
  }

  const email = normalizeEmail(parsed.data.email);
  const supabase: SessionClient = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || normalizeEmail(user.email) !== email) {
    return { ok: false, error: "Your reset session has ended. Please verify your email again." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  try {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        account_status: "active",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {
    // Profile refresh is best-effort; the password change already succeeded.
  }

  await logSecurityEvent({
    action: "PASSWORD_RESET",
    email,
    userId: user.id,
    metadata: { flow: "password_reset" },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: "Password updated. You can sign in with your new password." };
}

// ---------------------------------------------------------------------------
// admin operations (Users -> Email Verification)
// ---------------------------------------------------------------------------

export type EmailVerificationUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  account_status: string | null;
  email_verified_at: string | null;
  verification_attempts: number | null;
  failed_otp_attempts: number | null;
  last_otp_sent_at: string | null;
  is_active: boolean | null;
  created_at: string;
};

/** Staff-only read for the Users -> Email Verification admin section. */
export async function listEmailVerificationUsers(): Promise<EmailVerificationUser[]> {
  try {
    await requireStaff();
  } catch {
    return [];
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, username, email, account_status, email_verified_at, verification_attempts, failed_otp_attempts, last_otp_sent_at, is_active, created_at",
    )
    .not("email", "is", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error || !data) return [];
  return data as EmailVerificationUser[];
}

export async function resendEmailVerification(userId: string): Promise<OtpAccountResult> {
  const parsed = z.uuid().safeParse(userId);
  if (!parsed.success) return { ok: false, error: "Invalid user id." };

  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, account_status, email_verified_at")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!profile?.email) {
    return { ok: false, error: "That user has no email address on file." };
  }
  if (profile.account_status === "suspended") {
    return { ok: false, error: "Account is suspended — reactivate before resending." };
  }
  if (profile.account_status === "active" && profile.email_verified_at) {
    return { ok: false, error: "That account is already verified and active." };
  }

  const result = await requestEmailOtp("email_verification", { email: profile.email });
  if (!result.ok) return result;

  await logSecurityEvent({
    action: "ADMIN_RESEND_VERIFICATION",
    email: profile.email,
    userId: profile.id,
    adminId: staff.id,
    metadata: { by: staff.username ?? staff.email },
  });

  return { ok: true, message: `Verification code sent to ${profile.email}.` };
}

export async function setAccountStatus(
  userId: string,
  status: "pending_verification" | "active" | "suspended",
): Promise<OtpAccountResult> {
  const parsedId = z.uuid().safeParse(userId);
  if (!parsedId.success) return { ok: false, error: "Invalid user id." };
  if (!["pending_verification", "active", "suspended"].includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    return { ok: false, error: "Unauthorized" };
  }

  if (adminUser.id === parsedId.data) {
    return { ok: false, error: "You cannot change your own account status." };
  }

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, account_status")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (!profile) return { ok: false, error: "User not found." };

  const { error } = await admin
    .from("profiles")
    .update({
      account_status: status,
      is_active: status !== "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsedId.data);

  if (error) return { ok: false, error: error.message };

  await logSecurityEvent({
    action:
      status === "suspended"
        ? "ACCOUNT_DEACTIVATED"
        : status === "active"
          ? "ACCOUNT_REACTIVATED"
          : "ACCOUNT_STATUS_CHANGED",
    email: profile.email,
    userId: parsedId.data,
    adminId: adminUser.id,
    metadata: { from: profile.account_status, to: status, by: adminUser.username ?? adminUser.email },
  });

  revalidatePath("/admin/users/email-verification");
  return {
    ok: true,
    message:
      status === "suspended"
        ? "Account deactivated. The user can no longer sign in."
        : "Account status updated.",
  };
}
