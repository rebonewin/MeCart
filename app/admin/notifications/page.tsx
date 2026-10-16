import { requireStaff } from "@/lib/auth";
import { listNotifications } from "@/lib/repositories/notifications";
import {
  NotificationsPanel,
  type NotificationItem,
  type NotificationStats,
} from "@/components/admin/notifications-panel";

export const dynamic = "force-dynamic";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminNotificationsPage() {
  const user = await requireStaff();
  const rows = await listNotifications(user.id, 100);

  const items: NotificationItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.body,
    type: row.type,
    read: row.read_at !== null,
    time: formatRelativeTime(row.created_at),
  }));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats: NotificationStats = {
    unread: items.filter((item) => !item.read).length,
    today: rows.filter((row) => new Date(row.created_at) >= startOfToday).length,
    week: rows.filter((row) => new Date(row.created_at) >= weekAgo).length,
    total: items.length,
  };

  return <NotificationsPanel notifications={items} stats={stats} />;
}
