"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type RevenuePoint = { label: string; revenue: number; orders: number };

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  );
}

export function HeroOrb() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="flex h-52 w-52 items-center justify-center rounded-full bg-blue-500/10"
        animate={{ scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 shadow-2xl shadow-blue-500/30">
          <Brain className="h-14 w-14 text-white" />
        </div>
      </motion.div>
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="insightsRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              color: "#fff",
            }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={3} fill="url(#insightsRevenue)" />
          <Area
            type="monotone"
            dataKey="orders"
            stroke="#f472b6"
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="6 6"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
