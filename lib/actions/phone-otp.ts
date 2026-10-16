/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { logActivity } from "@/lib/security/audit";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid E.164 phone number");

export type PhoneOtpSendResult =
  | { ok: true; message: string; expiresInSeconds: number; resendAvailableInSeconds: number }
  | { ok: false; error: string };

export type PhoneOtpVerifyResult =
  | { ok: true; message: string; remainingAttempts: number }
  | { ok: false; error: string; remainingAttempts?: number };

export type PhoneOtpAccountResult = { ok: true; message: string } | { ok: false; error: string };

function cleanPhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, "");
}

async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

async function log(action: string, context?: Record<string, unknown>) {
  await logActivity({
    action,
    resource: context?.resource ? String(context.resource) : "auth",
    metadata: context ?? null,
    userId: (context?.userId as string | undefined) ?? null,
  });
}

export async function requestPhoneOtp(phoneInput: string): Promise<PhoneOtpSendResult> {
  const normalized = cleanPhone(phoneInput);
  const parsed = phoneSchema.safeParse(normalized);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid phone number." };
  const phone = parsed.data;
  const clientIp = await getClientIp();

  let admin: any;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  // Duplicate prevention
  const duplicate = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("phone_number", phone);
  if (Array.isArray(duplicate.data) && duplicate.data.length > 0) {
    return { ok: false, error: "Phone number already registered." };
  }

  try {
    const throttle = await (admin as any).rpc("create_phone_otp_request", {
      p_phone_number: phone,
      p_purpose: "login",
      p_expires_in_seconds: 300,
      p_max_resend: 5,
    });
    if (throttle.error) {
      await log("PHONE_OTP_SENT_FAILED", { resource: `auth:${phone}`, metadata: { error: throttle.error.message, clientIp } });
      return { ok: false, error: throttle.error.message };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to initialize verification request." };
  }

  const supabase = await createClient() as any;
  const { error: otpError } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (otpError) {
    await log("PHONE_OTP_SENT_FAILED", { resource: `auth:${phone}`, metadata: { error: otpError.message, clientIp } });
    return { ok: false, error: otpError.message };
  }

  await log("PHONE_OTP_SENT", { resource: `auth:${phone}`, metadata: { expiresInSeconds: 300, clientIp } });
  return {
    ok: true,
    message: "A 6-digit code has been sent by SMS.",
    expiresInSeconds: 300,
    resendAvailableInSeconds: 60,
  };
}

export async function verifyPhoneOtp(phoneInput: string, token: string): Promise<PhoneOtpVerifyResult> {
  const normalized = cleanPhone(phoneInput);
  const phoneCheck = phoneSchema.safeParse(normalized);
  if (!phoneCheck.success) return { ok: false, error: "Enter a valid phone number." };
  const phone = phoneCheck.data;
  const tokenCheck = z.string().trim().regex(/^\d{6}$/).safeParse(token);
  if (!tokenCheck.success) return { ok: false, error: "Enter the 6-digit code." };
  const code = tokenCheck.data;

  let admin: any;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: "Server is missing Supabase service credentials." };
  }

  const supabase = await createClient() as any;
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });

  let attempts = 0;
  try {
    const rpc = await (admin as any).rpc("verify_phone_otp_request", {
      p_phone_number: phone,
      p_purpose: "login",
      p_success: !error && Boolean(data?.user),
      p_error: error ? error.message : null,
    });
    attempts = (rpc.data as { attempts?: number } | null)?.attempts ?? 1;
  } catch {
    attempts = error ? 1 : 1;
  }

  const remaining = Math.max(0, 5 - attempts);

  if (error || !data?.user) {
    await log("PHONE_OTP_VERIFY_FAILED", { resource: `auth:${phone}`, metadata: { error: error?.message, attempts } });
    return { ok: false, error: "Incorrect or expired code.", remainingAttempts: remaining };
  }

  // Update profile
  const user = data.user;
  await (admin as any)
    .from("profiles")
    .upsert({
      id: user.id,
      phone_number: phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      account_status: "active",
      is_active: true,
      updated_at: new Date().toISOString(),
      phone_last_login: new Date().toISOString(),
    } satisfies Record<string, unknown>);

  await supabase.auth.updateUser({
    data: { phone_verified: true, phone },
  });

  await log("PHONE_OTP_VERIFIED", { resource: `auth:${phone}`, userId: user.id, metadata: { attempts } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Phone verified.", remainingAttempts: remaining };
}

export async function completePhoneProfile(input: { phone: string; fullName?: string; email?: string; password?: string }) {
  const supabase = await createClient() as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.phone || cleanPhone(user.phone) !== cleanPhone(input.phone)) {
    return { ok: false, error: "Please verify your phone first." } satisfies PhoneOtpAccountResult;
  }

  if (input.password && input.password.length >= 8) {
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) return { ok: false, error: error.message } satisfies PhoneOtpAccountResult;
  }

  try {
    const admin = createAdminClient() as any;
    const username = input.email ? input.email.split("@")[0] : `phone-${user.id.slice(0, 8)}`;
    await admin
      .from("profiles")
      .update({
        full_name: input.fullName ?? null,
        email: input.email ? input.email.trim().toLowerCase() : null,
        username,
        account_status: "active",
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies Record<string, unknown>)
      .eq("id", user.id);
  } catch {
    // Profile persistence should never block authentication.
  }

  if (input.email) {
    await supabase.auth.updateUser({ email: input.email.trim().toLowerCase() });
  }

  await logActivity({ action: "PHONE_PROFILE_COMPLETED", resource: `user:${user.id}`, userId: user.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Account ready." } satisfies PhoneOtpAccountResult;
}

export async function listPhoneVerificationUsers(search: string | null = null) {
  let admin: any;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }
  const { data, error } = await (admin as any)
    .from("profiles")
    .select("id, full_name, username, email, phone_number, country_code, phone_verified, phone_verified_at, phone_last_login, otp_attempts, last_otp_sent_at, is_active, created_at")
    .order("last_otp_sent_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  const term = (search ?? "").trim().toLowerCase();
  return (data as any[])
    .filter((row) => {
      if (!term) return true;
      return `${row.full_name ?? ""} ${row.username ?? ""} ${row.email ?? ""} ${row.phone_number ?? ""}`.toLowerCase().includes(term);
    })
    .map((row) => ({
      id: row.id,
      full_name: (row.full_name as string | null) ?? null,
      username: (row.username as string | null) ?? null,
      email: (row.email as string | null) ?? null,
      phone_number: (row.phone_number as string | null) ?? null,
      country_code: (row.country_code as string | null) ?? null,
      phone_verified: Boolean(row.phone_verified),
      phone_verified_at: (row.phone_verified_at as string | null) ?? null,
      last_otp_sent_at: (row.last_otp_sent_at as string | null) ?? null,
      otp_attempts: (row.otp_attempts as number | null) ?? 0,
      is_active: (row.is_active as boolean | null) ?? null,
      created_at: row.created_at as string,
    }));
}

export async function resendPhoneVerification(phone: string) {
  return requestPhoneOtp(phone);
}