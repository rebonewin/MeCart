"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";

export function DashboardHero({ todayRevenue, todayOrders }: { todayRevenue: number; todayOrders: number }) {
  return (
    <motion.section
      className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart Enterprise Control</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Good Morning Admin 👋</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Revenue, traffic, inventory, orders, and business health are all live in one premium analytics workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-card rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <p className="text-slate-400">Today</p>
            <p className="font-bold text-white">${Math.round(todayRevenue).toLocaleString("en-US")}</p>
          </div>
          <div className="glass-card rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <p className="text-slate-400">Orders</p>
            <p className="font-bold text-white">{todayOrders.toLocaleString("en-US")}</p>
          </div>
          <Button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
    </motion.section>
  );
}
