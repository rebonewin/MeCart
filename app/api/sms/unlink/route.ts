import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unlinkPhoneNumber } from "@/lib/services/phone-otp-service";

export const dynamic = "force-dynamic";

/** POST /api/sms/unlink — remove the phone number from the signed-in account. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await unlinkPhoneNumber();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
