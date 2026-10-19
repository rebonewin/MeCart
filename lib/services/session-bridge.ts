import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SHADOW_EMAIL_DOMAIN } from "@/lib/auth/shadow-email";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Establishes a Supabase SSR session for an already-authenticated user.
 *
 * Used after out-of-band factors (TOTP, recovery code, Twilio Verify) where no
 * Supabase session exists yet. A single-use admin magic-link token is verified
 * server-side; the browser never sees the token and no email is delivered.
 */
export async function establishSupabaseSession(admin: AdminClient, userId: string): Promise<void> {
  const { data: userRes, error: getUserError } = await admin.auth.admin.getUserById(userId);
  if (getUserError || !userRes?.user) {
    throw new Error(getUserError?.message ?? "Unable to resolve account for sign-in.");
  }

  let email: string | null = userRes.user.email ?? null;
  if (!email) {
    email = `phone.${userId.replace(/-/g, "").slice(0, 20)}@${SHADOW_EMAIL_DOMAIN}`;
    const { error: emailError } = await admin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (emailError) throw new Error(emailError.message);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    throw new Error(linkError?.message ?? "Unable to create a secure session.");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (verifyError) throw new Error(verifyError.message);
}
