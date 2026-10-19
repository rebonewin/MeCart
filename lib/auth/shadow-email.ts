/**
 * Phone-first accounts receive a synthetic, non-deliverable address so the
 * Supabase auth record always has an email. It must never be shown as a real
 * contact or offered as an email-verification channel.
 */
export const SHADOW_EMAIL_DOMAIN = "phone.mecart.app";

export function isShadowEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${SHADOW_EMAIL_DOMAIN}`));
}
