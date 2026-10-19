import { NextResponse } from "next/server";
import {
  PHONE_OTP_PURPOSES,
  verifyPhoneOtpCode,
  type PhoneOtpPurpose,
} from "@/lib/services/phone-otp-service";

export const dynamic = "force-dynamic";

function isPurpose(value: unknown): value is PhoneOtpPurpose {
  return typeof value === "string" && (PHONE_OTP_PURPOSES as readonly string[]).includes(value);
}

/** POST /api/sms/verify — check the SMS code and run the matching flow. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const result = await verifyPhoneOtpCode({
    phone: String(body.phone ?? ""),
    code: String(body.code ?? ""),
    purpose: isPurpose(body.purpose) ? body.purpose : "login",
    deviceId: typeof body.deviceId === "string" ? body.deviceId : null,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : null,
    challenge: (body.challenge ?? null) as never,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
