import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityEvent } from "@/lib/security/audit";

/**
 * Email link confirmation endpoint.
 * Verifies a token_hash server-side (works in any browser) and stores the
 * session in cookies. Active once a custom SMTP provider is configured and the
 * recovery email template points at
 * /auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 * (free-tier default templates use the ConfirmationURL flow handled by
 * /reset-password directly).
 *
 * Because this link works in any browser, it is also the strongest email-only
 * path into an account: for accounts with 2FA enabled the session is revoked
 * immediately so a link can never bypass the second factor.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/reset-password";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error && data.user) {
      let blocked = true;

      try {
        const admin = createAdminClient();
        const { data: factor } = await admin
          .from("user_two_factor")
          .select("enabled")
          .eq("user_id", data.user.id)
          .maybeSingle();
        blocked = Boolean(factor?.enabled);

        if (blocked) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.access_token) {
            try {
              await admin.auth.admin.signOut(session.access_token, "local");
            } catch {
              // Cookie removal below still applies.
            }
          }
          await supabase.auth.signOut({ scope: "local" });
        }
      } catch {
        // Fail closed: if 2FA state cannot be checked, do not keep the session.
        blocked = true;
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Best effort.
        }
      }

      if (blocked) {
        await logSecurityEvent({
          action: "EMAIL_LINK_BLOCKED_2FA",
          userId: data.user.id,
          status: "FAILED",
          metadata: { type },
        });
        return NextResponse.redirect(new URL("/forgot-password?error=two_factor", request.url));
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/forgot-password?error=invalid_link", request.url));
}
