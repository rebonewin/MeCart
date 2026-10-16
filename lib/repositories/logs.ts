import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList } from "@/lib/repositories/utils";
import type { ActivityLogRow, AuditLogRow } from "@/types/database";

export type ActivityLogWithUser = ActivityLogRow & { userName: string | null; userEmail: string | null };
export type AuditLogWithAdmin = AuditLogRow & { adminName: string | null };

export async function listActivityLogs(limit = 200): Promise<ActivityLogWithUser[]> {
  const supabase = await createClient();
  const logs = unwrapList(
    await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(limit),
  );
  if (!logs.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...new Set(logs.map((l) => l.user_id).filter((id): id is string => Boolean(id)))]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return logs.map((log) => ({
    ...log,
    userName: log.user_id ? profileMap.get(log.user_id)?.full_name ?? null : null,
    userEmail: log.user_id ? profileMap.get(log.user_id)?.email ?? null : null,
  }));
}

export async function listAuditLogs(limit = 200): Promise<AuditLogWithAdmin[]> {
  const supabase = await createClient();
  const logs = unwrapList(
    await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit),
  );
  if (!logs.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .in("id", [...new Set(logs.map((l) => l.admin_id).filter((id): id is string => Boolean(id)))]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return logs.map((log) => ({
    ...log,
    adminName: log.admin_id
      ? profileMap.get(log.admin_id)?.full_name ?? profileMap.get(log.admin_id)?.username ?? null
      : null,
  }));
}

export async function getSecurityStats(): Promise<{
  auditEvents: number;
  failedEvents: number;
  activityEvents: number;
  failedLogins: number;
}> {
  const supabase = await createClient();
  const [audit, activity, failedLogins] = await Promise.all([
    supabase.from("audit_logs").select("status"),
    supabase.from("activity_logs").select("action"),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "LOGIN_FAILED"),
  ]);

  const auditRows = audit.data ?? [];
  const activityRows = activity.data ?? [];

  return {
    auditEvents: auditRows.length,
    failedEvents: auditRows.filter((a) => a.status === "FAILED").length,
    activityEvents: activityRows.length,
    failedLogins: failedLogins.count ?? 0,
  };
}
