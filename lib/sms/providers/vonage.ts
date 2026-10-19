import { createStubProvider } from "./stub";

/** Vonage (Nexmo) Verify adapter (scaffold — implement sendVerification/checkVerification). */
export const createVonageProvider = () =>
  createStubProvider("vonage", ["VONAGE_API_KEY", "VONAGE_API_SECRET", "VONAGE_BRAND_NAME"]);
