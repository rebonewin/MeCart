"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrafficPoint = { label: string; events: number; orders: number };

export function AnalyticsTrafficChart({ data }: { data: TrafficPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
          <Legend />
          <Bar dataKey="events" name="Events" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          <Bar dataKey="orders" name="Orders" fill="#06b6d4" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
