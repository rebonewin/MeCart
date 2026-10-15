"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Megaphone,
  Package,
  PackageOpen,
  Receipt,
  Shield,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

type Notification = {
  id: string;
  category: string;
  title: string;
  description: string;
  time: string;
  priority: "Critical" | "High" | "Medium" | "Low";
};

const initialNotifications: Notification[] = [
  { id: "1", category: "Orders", title: "New order received", description: "#ORD-1052 from Luca Rossi valued at $1,180.00", time: "2 mins ago", priority: "High" },
  { id: "2", category: "Payments", title: "Payment settled", description: "Stripe payment for #ORD-1051 confirmed", time: "4 mins ago", priority: "Medium" },
  { id: "3", category: "Inventory", title: "Low stock alert", description: "Nike Tempo Cap has 3 units remaining", time: "8 mins ago", priority: "High" },
  { id: "4", category: "Customers", title: "New customer registered", description: "Zoya Khan joined from India", time: "11 mins ago", priority: "Low" },
  { id: "5", category: "Security", title: "Admin login detected", description: "Successful login from Mumbai, India", time: "15 mins ago", priority: "Medium" },
  { id: "6", category: "AI", title: "AI recommendation ready", description: "Restock Nike Vaporfly before Thursday", time: "20 mins ago", priority: "Low" },
];

const filters = ["All", "Orders", "Payments", "Inventory", "Customers", "Security", "Marketing", "AI", "System", "Archived", "Unread", "High Priority"];

const tone = {
  Critical: "from-red-500 to-rose-500",
  High: "from-amber-500 to-orange-500",
  Medium: "from-blue-500 to-cyan-500",
  Low: "from-slate-500 to-gray-400",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Orders: Package,
  Payments: Receipt,
  Inventory: PackageOpen,
  Customers: Users,
  Security: Shield,
  AI: Sparkles,
  Marketing: Megaphone,
  System: Wrench,
};

export default function NotificationsPage() {
  const [selected, setSelected] = useState("All");
  const [items, setItems] = useState(initialNotifications);

  const filtered = selected === "All" ? items : items.filter((item) => item.category === selected || selected === "High Priority" && item.priority === "High");
  const unread = items.length;
  const highPriority = items.filter((item) => item.priority === "High" || item.priority === "Critical").length;

  const dismiss = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

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
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">Mark All Read</button>
            <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10">Archive</button>
            <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20">Refresh</button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Unread", value: `${unread}` },
          { label: "Today", value: "6" },
          { label: "High Priority", value: `${highPriority}` },
          { label: "Archived", value: "24" },
        ].map((card) => (
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
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelected(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selected === filter
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
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
                <h2 className="text-xl font-bold text-white">Live Notifications</h2>
                <p className="text-sm text-slate-400">Realtime updates from across your business.</p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <Activity className="h-3.5 w-3.5" /> Live
              </span>
            </div>
          </div>
          <div className="space-y-3 p-4">
            <AnimatePresence initial={false}>
              {filtered.map((item) => {
                const Icon = iconMap[item.category] ?? Bell;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone[item.priority]} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{item.title}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-r ${tone[item.priority]}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.category} · {item.time}</p>
                    </div>
                    <button
                      onClick={() => dismiss(item.id)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold transition hover:bg-red-500/20 hover:text-red-200"
                    >
                      Dismiss
                    </button>
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
            {items.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-blue-400" />
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-white">Notification Settings</p>
            {["Email notifications", "Push notifications", "Security alerts", "Low stock alerts", "AI alerts"].map((setting) => (
              <label key={setting} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span>{setting}</span>
                <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">Enabled</span>
              </label>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
