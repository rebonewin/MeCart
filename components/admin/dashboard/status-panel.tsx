"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Server } from "lucide-react";
import { Panel } from "@/components/admin/dashboard/panel";

export type StatusBar = { name: string; value: number };
export type StatusRow = { name: string; status: string; tone: "good" | "warn"; gradient: string };

export function StatusPanel({ bars, rows, attention }: { bars: StatusBar[]; rows: StatusRow[]; attention: boolean }) {
  return (
    <Panel>
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">System Status</h2>
            <p className="text-sm text-slate-400">Right panel performance and health</p>
          </div>
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              attention ? "bg-amber-400/10 text-amber-300" : "bg-emerald-400/10 text-emerald-300"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" /> {attention ? "Attention" : "Healthy"}
          </span>
        </div>
      </div>
      <div className="space-y-4 p-5">
        {bars.map((bar) => (
          <div key={bar.name}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-300">{bar.name}</span>
              <span className="font-semibold text-white">{bar.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
        <div className="grid gap-3 pt-2">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${row.gradient} text-white`}>
                  <Server className="h-5 w-5" />
                </div>
                <span className="font-medium">{row.name}</span>
              </div>
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  row.tone === "warn" ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
