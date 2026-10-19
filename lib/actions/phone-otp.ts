"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import type { OtpChallenge } from "@/lib/sms/signing";
import {
  adminResendPhoneVerification,
  completePhoneProfileForSession,
  createPhoneOtpChallenge as createChallengeForPhone,
  getPhoneOtpSetupStatus as getSetupStatus,
  listPhoneVerificationUsers as listAdminPhoneUsers,
  sendPhoneOtpCode,
  unlinkPhoneNumber as unlinkPhoneForSession,
  verifyPhoneOtpCode,
  type AdminPhoneVerificationRow,
  type PhoneAccountActionResult,
  type PhoneOtpPurpose,
  type SendPhoneOtpResult,
  type VerifyPhoneOtpResult,
} from "@/lib/services/phone-otp-service";

export type PhoneOtpSendResult = SendPhoneOtpResult;
export type PhoneOtpVerifyResult = VerifyPhoneOtpResult;
export type { AdminPhoneVerificationRow };

type ChallengeInput = Partial<OtpChallenge> | null | undefined;

type OtpContext = {
  purpose?: PhoneOtpPurpose;
  deviceId?: string | null;
  countryCode?: string | null;
  challenge?: ChallengeInput;
};

const SESSION_PURPOSES: PhoneOtpPurpose[] = ["link", "change", "reverify", "phone_verification"];

/** Issue a short-lived signed challenge bound to phone + purpose + device. */
export async function createPhoneOtpChallenge(input: {
  phone: string;
  purpose?: PhoneOtpPurpose;
  deviceId?: string | null;
}) {
  return createChallengeForPhone({
    phone: input.phone,
    purpose: input.purpose ?? "login",
    deviceId: input.deviceId ?? null,
  });
}

/** Send (or resend) a real SMS OTP through the configured provider. */
export async function requestPhoneOtp(
  phoneInput: string,
  context: OtpContext = {},
): Promise<PhoneOtpSendResult> {
  const purpose: PhoneOtpPurpose = context.purpose ?? "login";

  if (SESSION_PURPOSES.includes(purpose)) {
    const user = await requireUser().catch(() => null);
    if (!user) return { ok: false, error: "Sign in to manage your phone number." };
  }

  return sendPhoneOtpCode({
    phone: phoneInput,
    purpose,
    deviceId: context.deviceId ?? null,
    countryCode: context.countryCode ?? null,
    challenge: context.challenge ?? null,
  });
}

/** Verify the SMS code and run the matching flow (login / signup / link). */
export async function verifyPhoneOtp(
  phoneInput: string,
  token: string,
  context: OtpContext = {},
): Promise<PhoneOtpVerifyResult> {
  const result = await verifyPhoneOtpCode({
    phone: phoneInput,
    code: token,
    purpose: context.purpose ?? "login",
    deviceId: context.deviceId ?? null,
    countryCode: context.countryCode ?? null,
    challenge: context.challenge ?? null,
  });

  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/profile");
    revalidatePath("/admin/users/phone-verification");
  }

  return result;
}

/** Staff-only resend from Users → Phone Verification. */
export async function resendPhoneVerification(phone: string): Promise<PhoneAccountActionResult> {
  const staff = await requireStaff();
  const result = await adminResendPhoneVerification(phone, staff.id);
  if (result.ok) revalidatePath("/admin/users/phone-verification");
  return result;
}

/** Finish the optional profile step after a phone signup. */
export async function completePhoneProfile(input: {
  phone: string;
  fullName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
}): Promise<PhoneAccountActionResult> {
  const result = await completePhoneProfileForSession({
    phone: input.phone,
    fullName: input.fullName ?? null,
    email: input.email ?? null,
    avatarUrl: input.avatarUrl ?? null,
    password: input.password ?? null,
  });

  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/profile");
  }

  return result;
}

/** Start linking a phone number to the signed-in account (send step). */
export async function linkPhoneNumber(input: {
  phone: string;
  challenge?: ChallengeInput;
  deviceId?: string | null;
  countryCode?: string | null;
}): Promise<PhoneOtpSendResult> {
  return requestPhoneOtp(input.phone, { ...input, purpose: "link" });
}

/** Start changing the signed-in account's phone number (send step). */
export async function changePhoneNumber(input: {
  phone: string;
  challenge?: ChallengeInput;
  deviceId?: string | null;
  countryCode?: string | null;
}): Promise<PhoneOtpSendResult> {
  return requestPhoneOtp(input.phone, { ...input, purpose: "change" });
}

/** Remove the phone number from the signed-in account. */
export async function unlinkPhoneNumber(): Promise<PhoneAccountActionResult> {
  const result = await unlinkPhoneForSession();
  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/profile");
  }
  return result;
}

/** Non-sensitive provider setup status for UI notices. */
export async function getPhoneOtpSetupStatus() {
  return getSetupStatus();
}

/** Staff-only read for the Users → Phone Verification admin section. */
export async function listPhoneVerificationUsers(
  search: string | null = null,
): Promise<AdminPhoneVerificationRow[]> {
  await requireStaff();
  return listAdminPhoneUsers(search);
}
