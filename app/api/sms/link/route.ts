import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPhoneOtpCode } from "@/lib/services/phone-otp-service";

export const dynamic = "force-dynamic";

/** POST /api/sms/link — start linking a phone to the signed-in account. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const result = await sendPhoneOtpCode({
    phone: String(body.phone ?? ""),
    purpose: "link",
    deviceId: typeof body.deviceId === "string" ? body.deviceId : null,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : null,
    challenge: (body.challenge ?? null) as never,
    userId: user.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
