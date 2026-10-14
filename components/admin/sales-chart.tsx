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

const data = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5100 },
  { month: "Mar", revenue: 4700 },
  { month: "Apr", revenue: 6200 },
  { month: "May", revenue: 7100 },
  { month: "Jun", revenue: 6800 },
  { month: "Jul", revenue: 7600 },
  { month: "Aug", revenue: 8200 },
  { month: "Sep", revenue: 8900 },
  { month: "Oct", revenue: 9500 },
  { month: "Nov", revenue: 10200 },
  { month: "Dec", revenue: 11800 },
];

export function SalesChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
          <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
