"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer } from "recharts";
import {
  AlertTriangle,
  Globe,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type KpiItem = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: string;
  up: boolean;
  icon: "wallet" | "cart" | "users" | "package" | "globe" | "trending" | "sparkles" | "alert";
  chart: number[];
};

const icons: Record<KpiItem["icon"], LucideIcon> = {
  wallet: Wallet,
  cart: ShoppingCart,
  users: Users,
  package: Package,
  globe: Globe,
  trending: TrendingUp,
  sparkles: Sparkles,
  alert: AlertTriangle,
};

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1100;
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(value * (1 - (1 - progress) ** 3));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span>
      {prefix}
      {count >= 100 ? Math.round(count).toLocaleString() : count.toFixed(2)}
      {suffix}
    </span>
  );
}

export function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = icons[item.icon];
        return (
          <motion.div
            key={item.label}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -7, scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-60" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-white">
                  <AnimatedCounter value={item.value} prefix={item.prefix} suffix={item.suffix} />
                </p>
                <p className={`mt-2 text-sm font-semibold ${item.up ? "text-emerald-300" : "text-amber-300"}`}>
                  {item.change}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20 transition group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="relative mt-4 h-12">
              {item.chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={item.chart.map((value, i) => ({ value, i }))}>
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#dashboardGradient)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center text-xs text-slate-500">No trend data</p>
              )}
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        );
      })}
    </section>
  );
}
