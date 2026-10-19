import type {
  SmsCheckResult,
  SmsProvider,
  SmsProviderHealth,
  SmsProviderName,
  SmsSendResult,
} from "../types";

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * Generic adapter scaffold for additional providers (MSG91, Gupshup, Vonage).
 *
 * The contract is identical to Twilio Verify, so switching providers never
 * touches business logic — only the adapter implementation is swapped in.
 * Until a provider is implemented the adapter fails loudly and reports the
 * environment variable names it will need, instead of silently faking an OTP.
 */
export function createStubProvider(name: SmsProviderName, envNames: string[]): SmsProvider {
  const missingEnv = () => envNames.filter((variable) => !env(variable));

  const notImplemented = (action: string): string =>
    `SMS provider "${name}" is not implemented yet (${action} skipped). ` +
    `Configure SMS_PROVIDER=twilio or provide: ${missingEnv().join(", ") || envNames.join(", ")}.`;

  return {
    name,
    isConfigured(): boolean {
      return false;
    },
    missingEnv,
    async sendVerification(): Promise<SmsSendResult> {
      return { ok: false, provider: name, error: notImplemented("send"), retryable: false };
    },
    async checkVerification(): Promise<SmsCheckResult> {
      return { ok: false, provider: name, status: "failed", error: notImplemented("verify") };
    },
    async health(): Promise<SmsProviderHealth> {
      return {
        provider: name,
        configured: false,
        ok: false,
        detail: notImplemented("health"),
      };
    },
  };
}
