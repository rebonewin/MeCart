import Link from "next/link";
import { Bell } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerNotifications } from "@/lib/repositories/seller";
import { dateTimeLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader } from "@/components/seller/ui";
import { NotificationReadButton } from "@/components/seller/notification-read-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications | MeCart Seller" };

export default async function SellerNotificationsPage() {
  const context = await requireSellerContext();
  const notifications = await listSellerNotifications(context.vendor.id);
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Approval decisions, payout events, returns and marketplace announcements for your vendor account."
        actions={<SellerBadge tone={unread ? "gold" : "neutral"}>{unread} unread</SellerBadge>}
      />

      {notifications.length === 0 ? (
        <SellerEmpty title="Nothing new" description="Marketplace and order updates will land here." />
      ) : (
        <SellerCard className="overflow-hidden p-0">
          <div className="divide-y divide-white/[0.05]">
            {notifications.map((notification) => (
              <div key={notification.id} className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${!notification.read_at ? "bg-[#D4AF37]/[0.035]" : ""}`}>
                <div className="flex min-w-0 gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${!notification.read_at ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-slate-500"}`}>
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{notification.title}</p>
                      {!notification.read_at && <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />}
                    </div>
                    {notification.body && <p className="mt-1 text-xs leading-5 text-slate-400">{notification.body}</p>}
                    <p className="mt-1.5 text-[10px] text-slate-600">{dateTimeLabel(notification.created_at)} · {notification.type}</p>
                    {notification.link && (
                      <Link href={notification.link} className="mt-1.5 inline-block text-[11px] font-medium text-[#E6C768] hover:underline">Open</Link>
                    )}
                  </div>
                </div>
                <NotificationReadButton id={notification.id} read={Boolean(notification.read_at)} />
              </div>
            ))}
          </div>
        </SellerCard>
      )}
    </div>
  );
}
