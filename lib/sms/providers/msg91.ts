import { createStubProvider } from "./stub";

/** MSG91 OTP adapter (scaffold — implement sendVerification/checkVerification). */
export const createMsg91Provider = () =>
  createStubProvider("msg91", ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_OTP_TEMPLATE_ID"]);
