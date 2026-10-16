import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
