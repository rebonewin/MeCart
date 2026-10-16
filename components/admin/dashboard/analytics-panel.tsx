"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import { Panel } from "@/components/admin/dashboard/panel";

export type AnalyticsPoint = { label: string; revenue: number; orders: number; visitors: number };

const timeRanges = ["Today", "This Week", "Month", "Year", "Last Year"];

export function AnalyticsPanel({ data }: { data: AnalyticsPoint[] }) {
  const [range, setRange] = useState("This Week");
  const [chart, setChart] = useState<"Revenue" | "Orders" | "Visitors">("Revenue");

  return (
    <Panel>
      <div className="border-b border-white/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Main Analytics</h2>
            <p className="text-sm text-slate-400">Performance across revenue, orders, visitors, and profit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Revenue", "Orders", "Visitors"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setChart(item)}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  chart === item ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
            <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              {range} <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {timeRanges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                range === item ? "bg-white text-slate-900" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="h-80">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
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
                  cursor={{ stroke: "rgba(96,165,250,0.4)" }}
                />
                <Area
                  type="monotone"
                  dataKey={chart === "Visitors" ? "visitors" : chart === "Orders" ? "orders" : "revenue"}
                  stroke="#60a5fa"
                  strokeWidth={3}
                  fill="url(#areaFill)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-400">No data yet</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
