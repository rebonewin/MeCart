import { NextResponse } from "next/server";
import { createPhoneOtpChallenge } from "@/lib/services/phone-otp-service";
import { normalizePhone } from "@/lib/sms/phone";
import { PHONE_OTP_PURPOSES, type PhoneOtpPurpose } from "@/lib/services/phone-otp-service";

export const dynamic = "force-dynamic";

function isPurpose(value: unknown): value is PhoneOtpPurpose {
  return typeof value === "string" && (PHONE_OTP_PURPOSES as readonly string[]).includes(value);
}

/** POST /api/sms/challenge — issue the signed request token for send/verify. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = normalizePhone(String(body.phone ?? ""));

  const result = createPhoneOtpChallenge({
    phone,
    purpose: isPurpose(body.purpose) ? body.purpose : "login",
    deviceId: typeof body.deviceId === "string" ? body.deviceId : null,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
