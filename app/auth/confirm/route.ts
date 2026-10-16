import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email link confirmation endpoint.
 * Verifies a token_hash server-side (works in any browser) and stores the
 * session in cookies. Active once a custom SMTP provider is configured and the
 * recovery email template points at
 * /auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 * (free-tier default templates use the ConfirmationURL flow handled by
 * /reset-password directly).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/reset-password";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/forgot-password?error=invalid_link", request.url));
}
