/**
 * E.164 phone helpers shared by server code, client forms and scripts.
 * Pure functions — safe to import from anywhere.
 */

export const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Strip formatting characters and normalise a leading 00 prefix to +. */
export function normalizePhone(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[\s().\u2010-\u2015-]/g, "")
    .replace(/^00/, "+");
}

export function isValidE164(phone: string): boolean {
  return E164_PATTERN.test(phone);
}

/** Combine a dial code (+91) and a national number into E.164. */
export function toE164(dialCode: string, nationalNumber: string): string {
  const dial = dialCode.startsWith("+") ? dialCode : `+${dialCode.replace(/\D/g, "")}`;
  const digits = nationalNumber.replace(/\D/g, "").replace(/^0+/, "");
  return normalizePhone(`${dial}${digits}`);
}

/** 9876543210 -> +91 ••••• 3210 style masking for logs and admin UI. */
export function maskPhone(phone: string): string {
  const value = normalizePhone(phone);
  if (value.length <= 6) return "•••";
  return `${value.slice(0, 3)}••••${value.slice(-4)}`;
}
