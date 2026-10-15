"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Globe,
  Package,
  Plus,
  Printer,
  RefreshCcw,
  Server,
  ShoppingCart,
  Sparkles,
  Tag,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const kpiData = [
  { label: "Revenue", value: 184920, prefix: "$", suffix: "", change: "+12.4%", up: true, icon: Wallet, chart: [22, 28, 24, 36, 31, 42, 39, 48] },
  { label: "Orders", value: 1284, prefix: "", suffix: "", change: "+8.2%", up: true, icon: ShoppingCart, chart: [12, 19, 14, 22, 17, 26, 24, 31] },
  { label: "Customers", value: 8420, prefix: "", suffix: "", change: "+4.8%", up: true, icon: Users, chart: [9, 12, 11, 15, 13, 18, 20, 24] },
  { label: "Products", value: 612, prefix: "", suffix: "", change: "+1.7%", up: true, icon: Package, chart: [6, 7, 8, 7, 9, 10, 9, 11] },
  { label: "Visitors", value: 48210, prefix: "", suffix: "", change: "+16.9%", up: true, icon: Globe, chart: [20, 25, 23, 33, 30, 41, 38, 52] },
  { label: "Conversion", value: 4.82, prefix: "", suffix: "%", change: "+0.6%", up: true, icon: TrendingUp, chart: [4.2, 4.4, 4.3, 4.7, 4.6, 4.8, 4.9, 4.82] },
  { label: "Profit", value: 61240, prefix: "$", suffix: "", change: "+9.1%", up: true, icon: Sparkles, chart: [15, 20, 18, 24, 22, 30, 28, 34] },
  { label: "Pending", value: 27, prefix: "", suffix: "", change: "Need action", up: false, icon: AlertTriangle, chart: [8, 5, 7, 9, 6, 8, 7, 5] },
];

const revenueData = [
  { label: "Mon", revenue: 14800, orders: 96, visitors: 4200 },
  { label: "Tue", revenue: 18200, orders: 118, visitors: 4800 },
  { label: "Wed", revenue: 16100, orders: 102, visitors: 4600 },
  { label: "Thu", revenue: 22300, orders: 141, visitors: 5400 },
  { label: "Fri", revenue: 27800, orders: 178, visitors: 6100 },
  { label: "Sat", revenue: 31200, orders: 198, visitors: 6800 },
  { label: "Sun", revenue: 26400, orders: 162, visitors: 5900 },
];

const timeRanges = ["Today", "This Week", "Month", "Year", "Last Year"];

const recentOrders = [
  { id: "#ORD-1048", customer: "Aarav Singh", avatar: "A", amount: "$249.00", status: "Delivered", payment: "Paid", color: "text-emerald-300" },
  { id: "#ORD-1049", customer: "Mia Johnson", avatar: "M", amount: "$89.90", status: "Processing", payment: "Paid", color: "text-blue-300" },
  { id: "#ORD-1050", customer: "Noah Williams", avatar: "N", amount: "$412.30", status: "Shipped", payment: "Paid", color: "text-cyan-300" },
  { id: "#ORD-1051", customer: "Zoya Khan", avatar: "Z", amount: "$67.50", status: "Pending", payment: "Unpaid", color: "text-amber-300" },
  { id: "#ORD-1052", customer: "Luca Rossi", avatar: "L", amount: "$1,180.00", status: "Delivered", payment: "Paid", color: "text-emerald-300" },
];

const topProducts = [
  { name: "Nike Vaporfly Sneakers", sales: "1.2K", revenue: "$284K", growth: "+18%", progress: 86, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=120&q=80" },
  { name: "Apple Watch Ultra", sales: "860", revenue: "$246K", growth: "+12%", progress: 74, image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=120&q=80" },
  { name: "MacBook Pro M3", sales: "421", revenue: "$534K", growth: "+9%", progress: 62, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=120&q=80" },
  { name: "Sony WH-1000XM5", sales: "990", revenue: "$174K", growth: "+16%", progress: 69, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=120&q=80" },
];

const lowStock = [
  { name: "Nike Tempo Cap", qty: 3, image: "https://images.unsplash.com/photo-1521369909029-2afed88211a1?auto=format&fit=crop&w=120&q=80" },
  { name: "USB-C Charger", qty: 5, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=120&q=80" },
  { name: "Running Socks", qty: 7, image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=120&q=80" },
];

const activity = [
  { text: "Zoya placed an order for $249.00", time: "2 mins ago", color: "from-emerald-400 to-cyan-400" },
  { text: "Stripe payment received", time: "4 mins ago", color: "from-blue-400 to-indigo-400" },
  { text: "Nike sneakers stock updated", time: "8 mins ago", color: "from-violet-400 to-fuchsia-400" },
  { text: "New customer registered", time: "11 mins ago", color: "from-amber-400 to-orange-400" },
  { text: "Coupon SAVE20 created", time: "15 mins ago", color: "from-pink-400 to-rose-400" },
];

const customers = [
  { name: "Aarav Singh", country: "India", orders: 18, spent: "$8,420", joined: "18 days ago", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" },
  { name: "Mia Johnson", country: "USA", orders: 9, spent: "$2,140", joined: "34 days ago", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" },
  { name: "Luca Rossi", country: "Italy", orders: 14, spent: "$6,480", joined: "2 months ago", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80" },
];

const servers = [
  { name: "API Server", value: 88 },
  { name: "Database", value: 76 },
  { name: "Storage", value: 64 },
  { name: "Cache", value: 91 },
];

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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -6 }}
    >
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState("This Week");
  const [chart, setChart] = useState<"Revenue" | "Orders" | "Visitors" | "Profits" | "Sales">("Revenue");
  const greeting = "Good Morning Admin";

  return (
    <div className="relative min-h-screen space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <motion.section
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart Enterprise Control</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{greeting} 👋</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Revenue, traffic, inventory, orders, and business health are all live in one premium analytics workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p className="text-slate-400">Today</p>
              <p className="font-bold text-white">$8,420</p>
            </div>
            <div className="glass-card rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <p className="text-slate-400">Orders</p>
              <p className="font-bold text-white">94</p>
            </div>
            <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiData.map((item, index) => {
          const Icon = item.icon;
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={item.chart.map((value, i) => ({ value, i }))}>
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#dashboardGradient)" />
                  </BarChart>
                </ResponsiveContainer>
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

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Panel>
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Main Analytics</h2>
                <p className="text-sm text-slate-400">Performance across revenue, orders, visitors, and profit.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Revenue", "Orders", "Visitors"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setChart(item as "Revenue" | "Orders" | "Visitors")}
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
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
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">System Status</h2>
                <p className="text-sm text-slate-400">Right panel performance and health</p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Healthy
              </span>
            </div>
          </div>
          <div className="space-y-4 p-5">
            {servers.map((server) => (
              <div key={server.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{server.name}</span>
                  <span className="font-semibold text-white">{server.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${server.value}%` }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
            <div className="grid gap-3 pt-2">
              {[
                ["API", "Operational", "from-emerald-500 to-cyan-500"],
                ["Database", "Operational", "from-emerald-500 to-cyan-500"],
                ["CDN", "Running", "from-blue-500 to-indigo-500"],
              ].map(([name, status, gradient]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white`}>
                      <Server className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{name}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr_0.85fr]">
        <Panel>
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                <p className="text-sm text-slate-400">Live customer purchases</p>
              </div>
              <Link href="/admin/orders" className="flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-white">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="p-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                    <td className="p-3 font-semibold text-blue-300">{order.id}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold">
                          {order.avatar}
                        </div>
                        <span>{order.customer}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{order.amount}</td>
                    <td className="p-3">
                      <span className={`rounded-full bg-white/5 px-3 py-1 text-xs font-semibold ${order.color}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Top Selling Products</h2>
            <p className="text-sm text-slate-400">Best performers this week</p>
          </div>
          <div className="space-y-4 p-5">
            {topProducts.map((product) => (
              <div key={product.name} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                <img src={product.image} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.sales} sales · {product.revenue}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${product.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{product.growth}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Recent Customers</h2>
            <p className="text-sm text-slate-400">New and engaged buyers</p>
          </div>
          <div className="space-y-4 p-5">
            {customers.map((customer) => (
              <div key={customer.name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <img src={customer.avatar} alt={customer.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-400/30" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{customer.name}</p>
                    <p className="text-xs text-slate-400">{customer.country} · {customer.joined}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{customer.orders} orders</span>
                  <span className="font-bold text-emerald-300">{customer.spent}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Low Stock Alerts</h2>
            <p className="text-sm text-slate-400">Products needing attention</p>
          </div>
          <div className="space-y-4 p-5">
            {lowStock.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.qty} units remaining</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">Priority</span>
                  <button className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20">Restock</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Realtime Activity</h2>
            <p className="text-sm text-slate-400">Live feed from the store</p>
          </div>
          <div className="space-y-3 p-5">
            {activity.map((event, index) => (
              <motion.div
                key={`${event.text}-${index}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className={`mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r ${event.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{event.text}</p>
                  <p className="text-xs text-slate-400">{event.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Add Product", href: "/admin/products/new", icon: Package, text: "Create a new product listing" },
          { label: "Create Coupon", href: "/admin/coupons", icon: Ticket, text: "Start a new promotion" },
          { label: "Add Category", href: "/admin/categories", icon: Tag, text: "Create a new category group" },
          { label: "View Orders", href: "/admin/orders", icon: ShoppingCart, text: "Check order statuses" },
          { label: "Export Report", href: "/admin/reports", icon: Printer, text: "Download PDF and CSV reports" },
          { label: "Run Analytics", href: "/admin/analytics", icon: BarChart3, text: "Review charts and traffic" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <motion.div
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl transition hover:bg-white/[0.08]"
                whileHover={{ y: -5, scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{action.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{action.text}</p>
              </motion.div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
