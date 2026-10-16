import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { Json, NotificationRow } from "@/types/database";

export async function listNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id));
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null),
  );
}

export async function createNotification(input: {
  userId: string;
  title: string;
  body?: string | null;
  type?: "ORDER" | "PAYMENT" | "SYSTEM" | "PROMOTION" | "SECURITY" | "REVIEW";
  link?: string | null;
  data?: Json;
}) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase.from("notifications").insert({
      user_id: input.userId,
      title: input.title,
      body: input.body ?? null,
      type: input.type ?? "SYSTEM",
      link: input.link ?? null,
      data: input.data ?? null,
    }),
  );
}

export async function broadcastNotification(input: {
  title: string;
  body?: string | null;
  type?: "SYSTEM" | "PROMOTION";
  link?: string | null;
}) {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id").is("deleted_at", null);
  if (!profiles?.length) return 0;

  const rows = profiles.map((profile) => ({
    user_id: profile.id,
    title: input.title,
    body: input.body ?? null,
    type: input.type ?? "SYSTEM",
    link: input.link ?? null,
  }));

  unwrapVoid(await supabase.from("notifications").insert(rows));
  return rows.length;
}
