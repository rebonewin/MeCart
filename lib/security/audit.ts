import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

function parseClient(userAgent: string | null) {
  const ua = userAgent ?? "";
  let browser = "Unknown";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os };
}

export async function logAudit(input: {
  action: string;
  resource: string;
  oldValue?: string | null;
  newValue?: string | null;
  status?: "SUCCESS" | "FAILED";
  adminId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const h = await headers();
    const { browser, os } = parseClient(h.get("user-agent"));
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("audit_logs").insert({
      admin_id: input.adminId ?? user?.id ?? null,
      action: input.action,
      resource: input.resource,
      old_value: input.oldValue ?? null,
      new_value: input.newValue ?? null,
      status: input.status ?? "SUCCESS",
      ip_address: ipAddress,
      user_agent: h.get("user-agent"),
      browser,
      os,
    });
  } catch {
    // Never throw from audit logging
  }
}

export async function logActivity(input: {
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("activity_logs").insert({
      user_id: input.userId ?? user?.id ?? null,
      action: input.action,
      resource: input.resource ?? null,
      ip_address: ipAddress,
      user_agent: h.get("user-agent"),
      metadata: (input.metadata ?? null) as never,
    });
  } catch {
    // Never throw
  }
}

// --- security / auth event trail ---------------------------------------------

export type SecurityEventAction =
  | "OTP_SENT"
  | "OTP_RESENT"
  | "OTP_SENT_FAILED"
  | "OTP_BLOCKED"
  | "OTP_VERIFIED"
  | "OTP_FAILED"
  | "OTP_EXPIRED"
  | "PASSWORD_CREATED"
  | "ACCOUNT_CREATED"
  | "PASSWORD_RESET"
  | "ACCOUNT_DEACTIVATED"
  | "ACCOUNT_REACTIVATED"
  | "ADMIN_RESEND_VERIFICATION";

export type SecurityEventInput = {
  action: SecurityEventAction | (string & {});
  email?: string | null;
  userId?: string | null;
  adminId?: string | null;
  status?: "SUCCESS" | "FAILED";
  metadata?: Record<string, unknown> | null;
};

/**
 * Writes an auth/OTP event to both `activity_logs` and `audit_logs`.
 *
 * Uses the service-role client when available so events are recorded even
 * before a session exists (OTP issued to a brand-new account). Falls back to
 * the caller's session client so no event is ever silently dropped when the
 * service key is absent. Never throws — auditing must not break auth flows.
 */
export async function logSecurityEvent(input: SecurityEventInput) {
  try {
    const h = await headers();
    const userAgent = h.get("user-agent");
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    const { browser, os } = parseClient(userAgent);

    const resource = input.email
      ? `auth:${input.email}`
      : input.userId
        ? `user:${input.userId}`
        : "auth";

    const status = input.status ?? "SUCCESS";
    const metadata = (input.metadata ?? null) as Json;

    let written = false;

    try {
      const admin = createAdminClient();

      const [{ error: activityError }, { error: auditError }] = await Promise.all([
        admin.from("activity_logs").insert({
          user_id: input.userId ?? null,
          action: input.action,
          resource,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata,
        }),
        admin.from("audit_logs").insert({
          admin_id: input.adminId ?? input.userId ?? null,
          action: input.action,
          resource,
          status,
          ip_address: ipAddress,
          user_agent: userAgent,
          os,
          browser,
        }),
      ]);

      written = !activityError || !auditError;
    } catch {
      // Service client unavailable — fall back to the session client below.
    }

    if (!written) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("activity_logs").insert({
        user_id: input.userId ?? user?.id ?? null,
        action: input.action,
        resource,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata,
      });
    }
  } catch {
    // Never throw from audit logging.
  }
}
