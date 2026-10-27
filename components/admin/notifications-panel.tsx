"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Megaphone,
  Package,
  Receipt,
  RefreshCcw,
  Shield,
  Star,
  Wrench,
} from "lucide-react";
import { markAllReadAction, markReadAction } from "@/lib/actions/notifications";
import type { NotificationType } from "@/types/database";

export type NotificationItem = {
  id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  read: boolean;
  time: string;
};

export type NotificationStats = {
  unread: number;
  today: number;
  week: number;
  total: number;
};

const FILTERS = ["All", "Unread", "Orders", "Payments", "Promotions", "Security", "Reviews", "System"] as const;
type Filter = (typeof FILTERS)[number];

const TYPE_LABEL: Record<NotificationType, string> = {
  ORDER: "Orders",
  PAYMENT: "Payments",
  SYSTEM: "System",
  PROMOTION: "Promotions",
  SECURITY: "Security",
  REVIEW: "Reviews",
};

const TYPE_TONE: Record<NotificationType, string> = {
  ORDER: "from-blue-500 to-cyan-500",
  PAYMENT: "from-emerald-500 to-teal-500",
  SYSTEM: "from-slate-500 to-gray-400",
  PROMOTION: "from-fuchsia-500 to-pink-500",
  SECURITY: "from-amber-500 to-orange-500",
  REVIEW: "from-violet-500 to-indigo-500",
};

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  ORDER: Package,
  PAYMENT: Receipt,
  SYSTEM: Wrench,
  PROMOTION: Megaphone,
  SECURITY: Shield,
  REVIEW: Star,
};

export function NotificationsPanel({
  notifications,
  stats,
}: {
  notifications: NotificationItem[];
  stats: NotificationStats;
}) {
  const router = useRouter();
  const [locallyRead, setLocallyRead] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<Filter>("All");
  const [pending, startTransition] = useTransition();

  const items = notifications.map((item) => (locallyRead.has(item.id) ? { ...item, read: true } : item));

  const filtered = items.filter((item) => {
    if (selected === "All") return true;
    if (selected === "Unread") return !item.read;
    return TYPE_LABEL[item.type] === selected;
  });

  const markRead = (id: string) => {
    startTransition(async () => {
      try {
        await markReadAction(id);
        setLocallyRead((prev) => new Set(prev).add(id));
        toast.success("Marked as read");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to mark as read");
      }
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      try {
        await markAllReadAction();
        setLocallyRead(new Set(notifications.map((item) => item.id)));
        toast.success("All notifications marked as read");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update notifications");
      }
    });
  };

  const statCards = [
    { label: "Unread", value: stats.unread },
    { label: "Today", value: stats.today },
    { label: "This Week", value: stats.week },
    { label: "Total", value: stats.total },
  ];

  return (
    <div className="relative min-h-screen space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <motion.section
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart Notification Center</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Notifications</h1>
            <p className="mt-2 text-sm text-slate-300">Everything happening across your store.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-blue-200">
              <Bell className="h-4 w-4" /> {stats.unread} unread
            </span>
            <Button
              onClick={markAllRead}
              disabled={pending || stats.unread === 0}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </Button>
            <Button
              onClick={() => router.refresh()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <motion.div
            key={card.label}
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl"
            whileHover={{ y: -4 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-300" />
          <h2 className="text-lg font-bold text-white">Filters</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              onClick={() => setSelected(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selected === filter
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <motion.div
          className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Notifications</h2>
                <p className="text-sm text-slate-400">Latest updates from across your business.</p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                <Bell className="h-3.5 w-3.5" /> {stats.unread} unread
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <AnimatePresence initial={false}>
              {filtered.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                      item.read
                        ? "border-white/10 bg-white/[0.03]"
                        : "border-blue-400/30 bg-blue-500/[0.08] hover:bg-blue-500/[0.12]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${TYPE_TONE[item.type]} text-white shadow-lg`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold ${item.read ? "text-slate-300" : "text-white"}`}>{item.title}</p>
                        <span
                          className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${TYPE_TONE[item.type]}`}
                        >
                          {TYPE_LABEL[item.type]}
                        </span>
                        {!item.read && <span className="h-2 w-2 rounded-full bg-blue-400" />}
                      </div>
                      {item.message && <p className="mt-1 text-sm text-slate-300">{item.message}</p>}
                      <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                    </div>
                    {item.read ? (
                      <span className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500">Read</span>
                    ) : (
                      <Button
                        onClick={() => markRead(item.id)}
                        disabled={pending}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Mark read
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-400">
                No notifications in this group.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold text-white">Notification Timeline</h2>
          <p className="mb-5 text-sm text-slate-400">Recent store activity.</p>
          <div className="space-y-4 border-l border-white/10 pl-5">
            {items.slice(0, 6).map((item) => (
              <div key={item.id} className="relative">
                <div className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-gradient-to-r ${TYPE_TONE[item.type]}`} />
                <p className={`font-medium ${item.read ? "text-slate-300" : "text-white"}`}>{item.title}</p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-slate-400">Nothing yet — you are all caught up.</p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-white">By Type</p>
            {(Object.keys(TYPE_LABEL) as NotificationType[]).map((type) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
              >
                <span className="text-slate-300">{TYPE_LABEL[type]}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {items.filter((item) => item.type === type).length}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
