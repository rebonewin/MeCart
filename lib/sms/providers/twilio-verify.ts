import type {
  SmsCheckInput,
  SmsCheckResult,
  SmsProvider,
  SmsProviderHealth,
  SmsSendInput,
  SmsSendResult,
} from "../types";

/**
 * Twilio Verify API provider.
 *
 * Uses the Verify REST API directly (no SDK dependency):
 *   POST /v2/Services/{ServiceSid}/Verifications       — send code
 *   POST /v2/Services/{ServiceSid}/VerificationCheck   — check code
 *   GET  /v2/Services/{ServiceSid}                     — health check
 *
 * Twilio generates, delivers and validates the code. Nothing is generated or
 * stored by MeCart. Credentials are read from the environment only.
 */

const TWILIO_API_BASE = "https://verify.twilio.com/v2";
const REQUIRED_ENV = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"] as const;

type TwilioPayload = {
  status?: string;
  sid?: string;
  message?: string;
  code?: number;
  more_info?: string;
} | null;

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TwilioVerifyProvider implements SmsProvider {
  readonly name = "twilio" as const;

  isConfigured(): boolean {
    const sid = env("TWILIO_ACCOUNT_SID");
    const token = env("TWILIO_AUTH_TOKEN");
    const service = env("TWILIO_VERIFY_SERVICE_SID");
    return sid.startsWith("AC") && token.length > 0 && service.startsWith("VA");
  }

  missingEnv(): string[] {
    return REQUIRED_ENV.filter((name) => !env(name));
  }

  private serviceSid(): string {
    const service = env("TWILIO_VERIFY_SERVICE_SID");
    if (!service) throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured.");
    return service;
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${env("TWILIO_ACCOUNT_SID")}:${env("TWILIO_AUTH_TOKEN")}`).toString("base64")}`;
  }

  /** fetch with two retries on network failure, 429 and 5xx responses. */
  private async request(path: string, init: RequestInit, attempt = 0): Promise<Response> {
    const maxAttempts = 3;
    try {
      const response = await fetch(`${TWILIO_API_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: this.authHeader(),
          ...(init.headers ?? {}),
        },
        cache: "no-store",
      });

      if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts - 1) {
        await sleep(350 * 2 ** attempt);
        return this.request(path, init, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < maxAttempts - 1) {
        await sleep(350 * 2 ** attempt);
        return this.request(path, init, attempt + 1);
      }
      throw error;
    }
  }

  private async parse(response: Response): Promise<TwilioPayload> {
    try {
      return (await response.json()) as TwilioPayload;
    } catch {
      return null;
    }
  }

  async sendVerification(input: SmsSendInput): Promise<SmsSendResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        provider: this.name,
        error: `Twilio Verify is not configured. Missing: ${this.missingEnv().join(", ")}.`,
        retryable: false,
      };
    }

    const body = new URLSearchParams({
      To: input.to,
      Channel: input.channel ?? "sms",
    });

    try {
      const response = await this.request(`/Services/${this.serviceSid()}/Verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const payload = await this.parse(response);

      if (response.ok && payload?.status) {
        return { ok: true, provider: this.name, status: payload.status, messageId: payload.sid ?? null };
      }

      return {
        ok: false,
        provider: this.name,
        error: payload?.message ?? `Twilio Verify send failed (HTTP ${response.status}).`,
        code: payload?.code ?? response.status,
        retryable: response.status === 429 || response.status >= 500,
      };
    } catch (error) {
      return {
        ok: false,
        provider: this.name,
        error: error instanceof Error ? error.message : "Twilio Verify send failed.",
        retryable: true,
      };
    }
  }

  async checkVerification(input: SmsCheckInput): Promise<SmsCheckResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        provider: this.name,
        status: "failed",
        error: `Twilio Verify is not configured. Missing: ${this.missingEnv().join(", ")}.`,
      };
    }

    const body = new URLSearchParams({
      To: input.to,
      Code: input.code,
    });

    try {
      const response = await this.request(`/Services/${this.serviceSid()}/VerificationCheck`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const payload = await this.parse(response);

      if (response.ok && payload?.status === "approved") {
        return { ok: true, provider: this.name, status: "approved" };
      }

      // 20404 / 404 = no pending verification (expired or already consumed).
      if (response.status === 404 || payload?.code === 20404) {
        return {
          ok: false,
          provider: this.name,
          status: "expired",
          error: "This code expired. Request a new one.",
          code: payload?.code ?? 20404,
        };
      }

      // 60202 = max check attempts reached on Twilio's side.
      if (payload?.code === 60202) {
        return {
          ok: false,
          provider: this.name,
          status: "failed",
          error: "Too many attempts for this code. Request a new one.",
          code: payload.code,
        };
      }

      return {
        ok: false,
        provider: this.name,
        status: "pending",
        error: payload?.message ?? "Incorrect code.",
        code: payload?.code ?? response.status,
      };
    } catch (error) {
      return {
        ok: false,
        provider: this.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Twilio Verify check failed.",
      };
    }
  }

  async health(): Promise<SmsProviderHealth> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        configured: false,
        ok: false,
        detail: `Missing environment variables: ${this.missingEnv().join(", ") || "unknown"}.`,
      };
    }

    try {
      const response = await this.request(`/Services/${this.serviceSid()}`, { method: "GET" });
      const payload = await this.parse(response);

      return {
        provider: this.name,
        configured: true,
        ok: response.ok,
        detail: response.ok
          ? `Verify Service ${payload?.sid ?? this.serviceSid()} reachable (status ${payload?.status ?? "ok"}).`
          : payload?.message ?? `Twilio responded with HTTP ${response.status}.`,
      };
    } catch (error) {
      return {
        provider: this.name,
        configured: true,
        ok: false,
        detail: error instanceof Error ? error.message : "Twilio health check failed.",
      };
    }
  }
}
