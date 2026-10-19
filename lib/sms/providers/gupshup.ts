import { createStubProvider } from "./stub";

/** Gupshup SMS adapter (scaffold — implement sendVerification/checkVerification). */
export const createGupshupProvider = () =>
  createStubProvider("gupshup", ["GUPSHUP_USER_ID", "GUPSHUP_PASSWORD", "GUPSHUP_APP_NAME", "GUPSHUP_SOURCE"]);
