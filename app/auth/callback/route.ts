import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security/audit";
import {
  beginTwoFactorGate,
  CHALLENGE_TTL_SECONDS,
  TWO_FACTOR_COOKIE,
} from "@/lib/services/two-factor-service";

/**
 * OAuth (PKCE) callback. Exchanges the code server-side, then applies the same
 * 2FA gate as password/OTP sign-in: an enabled account without a trusted
 * device is redirected to /two-factor with the freshly minted Supabase session
 * revoked server-side.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  try {
    const gate = await beginTwoFactorGate({
      userId: data.user.id,
      firstFactor: "oauth",
      redirectTo: next,
      signOutExistingSession: true,
    });

    if (gate.required) {
      await logSecurityEvent({
        action: "LOGIN_2FA_REQUIRED",
        userId: data.user.id,
        metadata: { first_factor: "oauth" },
      });

      const response = NextResponse.redirect(new URL("/two-factor", origin));
      if (gate.challengeToken) {
        response.cookies.set(TWO_FACTOR_COOKIE, gate.challengeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: CHALLENGE_TTL_SECONDS,
        });
      }
      return response;
    }
  } catch {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Fail closed below.
    }
    await logSecurityEvent({
      action: "LOGIN_2FA_GATE_FAILED",
      userId: data.user.id,
      status: "FAILED",
      metadata: { first_factor: "oauth" },
    });
    return NextResponse.redirect(new URL("/login?error=secure_verification", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
