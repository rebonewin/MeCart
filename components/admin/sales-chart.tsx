"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SalesChart({ data }: { data: { label: string; revenue: number }[] }) {
  if (!data.length) {
    return <div className="flex h-72 items-center justify-center text-sm text-gray-500">No data yet</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
          <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
