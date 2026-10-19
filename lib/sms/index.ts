import type { SmsProvider, SmsProviderHealth, SmsProviderName } from "./types";
import { TwilioVerifyProvider } from "./providers/twilio-verify";
import { createMsg91Provider } from "./providers/msg91";
import { createGupshupProvider } from "./providers/gupshup";
import { createVonageProvider } from "./providers/vonage";

/**
 * SMS provider registry — the single place business logic resolves a provider
 * from. Add a provider by registering a factory here; nothing else changes.
 */
const REGISTRY: Record<SmsProviderName, () => SmsProvider> = {
  twilio: () => new TwilioVerifyProvider(),
  msg91: createMsg91Provider,
  gupshup: createGupshupProvider,
  vonage: createVonageProvider,
};

export const DEFAULT_SMS_PROVIDER: SmsProviderName = "twilio";

export function getSmsProviderName(): SmsProviderName {
  const raw = (process.env.SMS_PROVIDER ?? DEFAULT_SMS_PROVIDER).trim().toLowerCase();
  return (Object.keys(REGISTRY) as SmsProviderName[]).includes(raw as SmsProviderName)
    ? (raw as SmsProviderName)
    : DEFAULT_SMS_PROVIDER;
}

export function getSmsProvider(name: SmsProviderName = getSmsProviderName()): SmsProvider {
  const factory = REGISTRY[name] ?? REGISTRY[DEFAULT_SMS_PROVIDER];
  return factory();
}

/** Safe-to-show setup status: provider name and missing variable *names* only. */
export function getSmsSetupStatus(): {
  provider: SmsProviderName;
  configured: boolean;
  missing: string[];
} {
  const provider = getSmsProvider();
  return {
    provider: provider.name,
    configured: provider.isConfigured(),
    missing: provider.missingEnv(),
  };
}

export async function checkSmsHealth(): Promise<SmsProviderHealth> {
  const provider = getSmsProvider();
  return provider.health();
}

export type { SmsProvider, SmsProviderHealth, SmsProviderName } from "./types";
