/**
 * MeCart SMS OTP template.
 *
 * Twilio Verify renders this wording server-side; {{code}} is replaced by the
 * real generated code. Configure it on the Verify Service (Console → Verify
 * Service → Templates, or via the Verify Templates API). `npm run twilio:setup`
 * prints the exact template and the values the service needs.
 */
export const MECART_SMS_TEMPLATE = [
  "MeCart",
  "Your verification code is {{code}}",
  "Valid for 5 minutes.",
  "Never share this code.",
].join("\n");

/** Plain-text rendering for docs / setup output (uses a placeholder). */
export function renderTemplateExample(code = "123456"): string {
  return MECART_SMS_TEMPLATE.replace("{{code}}", code);
}
