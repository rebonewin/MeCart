/**
 * Provider-agnostic SMS OTP contracts.
 *
 * The application never generates or stores OTP codes. Each provider owns the
 * code lifecycle (creation, delivery, checking, expiry) — Twilio Verify today,
 * MSG91 / Gupshup / Vonage pluggable later without touching business logic.
 */

export type SmsProviderName = "twilio" | "msg91" | "gupshup" | "vonage";

export type SmsSendInput = {
  /** E.164 formatted destination, e.g. +919876543210 */
  to: string;
  channel?: "sms" | "whatsapp";
  locale?: string;
  metadata?: Record<string, string>;
};

export type SmsSendResult =
  | {
      ok: true;
      provider: SmsProviderName;
      status: string;
      messageId: string | null;
    }
  | {
      ok: false;
      provider: SmsProviderName;
      error: string;
      code?: string | number | null;
      retryable: boolean;
    };

export type SmsCheckInput = {
  to: string;
  code: string;
};

export type SmsCheckResult =
  | {
      ok: true;
      provider: SmsProviderName;
      status: "approved";
    }
  | {
      ok: false;
      provider: SmsProviderName;
      status: "pending" | "expired" | "failed";
      error: string;
      code?: string | number | null;
    };

export type SmsProviderHealth = {
  provider: SmsProviderName;
  configured: boolean;
  ok: boolean;
  detail: string;
};

export interface SmsProvider {
  readonly name: SmsProviderName;
  /** True when every required environment variable is present. */
  isConfigured(): boolean;
  /** Names (never values) of the missing environment variables. */
  missingEnv(): string[];
  sendVerification(input: SmsSendInput): Promise<SmsSendResult>;
  checkVerification(input: SmsCheckInput): Promise<SmsCheckResult>;
  health(): Promise<SmsProviderHealth>;
}
