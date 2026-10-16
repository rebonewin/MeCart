import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ActivityFeed, type ActivityItem } from "@/components/admin/dashboard/activity-feed";
import { AnalyticsPanel } from "@/components/admin/dashboard/analytics-panel";
import { DashboardHero } from "@/components/admin/dashboard/hero";
import { KpiGrid, type KpiItem } from "@/components/admin/dashboard/kpi-grid";
import { Panel } from "@/components/admin/dashboard/panel";
import { ProgressBar } from "@/components/admin/dashboard/progress-bar";
import { QuickActions } from "@/components/admin/dashboard/quick-actions";
import { StatusPanel, type StatusBar, type StatusRow } from "@/components/admin/dashboard/status-panel";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList } from "@/lib/repositories/utils";
import { getDashboardStats, getTopProducts, getTrafficSeries, listRecentEvents } from "@/lib/repositories/analytics";
import { getCustomerStats, listCustomers } from "@/lib/repositories/customers";
import { listInventory } from "@/lib/repositories/inventory";
import { getSecurityStats, listAuditLogs } from "@/lib/repositories/logs";
import { getMediaStats } from "@/lib/repositories/media";
import { getMonthlyRevenueSeries, getOrderStats, listAllOrders } from "@/lib/repositories/orders";
import { countProducts } from "@/lib/repositories/products";
import { getReviewStats } from "@/lib/repositories/reviews";
import type { OrderStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: "text-amber-300",
  CONFIRMED: "text-blue-300",
  PROCESSING: "text-blue-300",
  PACKED: "text-cyan-300",
  SHIPPED: "text-cyan-300",
  DELIVERED: "text-emerald-300",
  CANCELLED: "text-rose-300",
  RETURNED: "text-rose-300",
};

const activityColors = [
  "from-emerald-400 to-cyan-400",
  "from-blue-400 to-indigo-400",
  "from-violet-400 to-fuchsia-400",
  "from-amber-400 to-orange-400",
  "from-pink-400 to-rose-400",
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function DashboardPage() {
  const trafficDays = 14;

  const [
    stats,
    monthly,
    traffic,
    orderStats,
    orders,
    topProducts,
    inventory,
    customerStats,
    customerRows,
    reviewStats,
    mediaStats,
    productCounts,
    security,
    auditLogs,
    recentEvents,
  ] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenueSeries(6),
    getTrafficSeries(trafficDays),
    getOrderStats(),
    listAllOrders({ limit: 10 }),
    getTopProducts(4),
    listInventory(),
    getCustomerStats(),
    listCustomers(),
    getReviewStats(),
    getMediaStats(),
    countProducts(),
    getSecurityStats(),
    listAuditLogs(10),
    listRecentEvents(10),
  ]);

  const supabase = await createClient();

  // Daily paid revenue for the main analytics chart (missing repo query, computed inline).
  const since = new Date();
  since.setDate(since.getDate() - (trafficDays - 1));
  since.setHours(0, 0, 0, 0);
  const paidOrderRows = unwrapList(
    await supabase
      .from("orders")
      .select("created_at, grand_total, payment_status")
      .is("deleted_at", null)
      .gte("created_at", since.toISOString()),
  );

  const analyticsData = traffic.map((point, index) => {
    const dayStart = new Date(since);
    dayStart.setDate(since.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const revenue = paidOrderRows
      .filter((order) => {
        if (order.payment_status !== "PAID") return false;
        const createdAt = new Date(order.created_at);
        return createdAt >= dayStart && createdAt < dayEnd;
      })
      .reduce((sum, order) => sum + toNumber(order.grand_total), 0);
    return { label: point.label, revenue, orders: point.orders, visitors: point.events };
  });

  const lowStockItems = inventory
    .filter((item) => item.quantity <= item.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 3);

  // Cover images for the product panels (inline query, images repo helper is not exported).
  const productIds = [
    ...new Set([...topProducts.map((product) => product.productId), ...lowStockItems.map((item) => item.productId)]),
  ].filter((id) => UUID_RE.test(id));
  const imageRows = productIds.length
    ? unwrapList(
        await supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", productIds)
          .order("position"),
      )
    : [];
  const coverImages = new Map<string, string>();
  for (const image of imageRows) {
    if (!coverImages.has(image.product_id)) coverImages.set(image.product_id, image.url);
  }

  const trafficEvents = traffic.reduce((sum, point) => sum + point.events, 0);
  const trafficOrders = traffic.reduce((sum, point) => sum + point.orders, 0);
  const conversion = trafficEvents > 0 ? (trafficOrders / trafficEvents) * 100 : 0;
  const today = analyticsData.at(-1) ?? { revenue: 0, orders: 0 };
  const pct = (value: number) => `${value >= 0 ? "+" : ""}${value}%`;

  const kpiItems: KpiItem[] = [
    {
      label: "Revenue",
      value: stats.revenue,
      prefix: "$",
      change: pct(stats.revenueChangePct),
      up: stats.revenueChangePct >= 0,
      icon: "wallet",
      chart: monthly.map((point) => point.revenue),
    },
    {
      label: "Orders",
      value: stats.orders,
      change: pct(stats.ordersChangePct),
      up: stats.ordersChangePct >= 0,
      icon: "cart",
      chart: monthly.map((point) => point.orders),
    },
    {
      label: "Customers",
      value: stats.customers,
      change: `${customerStats.newThisMonth} new this month`,
      up: true,
      icon: "users",
      chart: [],
    },
    {
      label: "Products",
      value: stats.products,
      change: `${productCounts.active} active · ${productCounts.drafts} drafts`,
      up: true,
      icon: "package",
      chart: [],
    },
    {
      label: "Visitors",
      value: trafficEvents,
      change: "Last 14 days",
      up: true,
      icon: "globe",
      chart: traffic.map((point) => point.events),
    },
    {
      label: "Conversion",
      value: conversion,
      suffix: "%",
      change: "Last 14 days",
      up: true,
      icon: "trending",
      chart: traffic.map((point) => (point.events ? (point.orders / point.events) * 100 : 0)),
    },
    {
      label: "Avg. Order",
      value: orderStats.averageOrderValue,
      prefix: "$",
      change: `${orderStats.paidOrders} paid orders`,
      up: true,
      icon: "sparkles",
      chart: monthly.map((point) => (point.orders ? point.revenue / point.orders : 0)),
    },
    {
      label: "Pending",
      value: stats.pendingOrders,
      change: "Need action",
      up: false,
      icon: "alert",
      chart: [],
    },
  ];

  const outOfStock = inventory.filter((item) => item.quantity === 0).length;
  const statusBars: StatusBar[] = [
    {
      name: "Payments captured",
      value: stats.orders ? Math.round((orderStats.paidOrders / stats.orders) * 100) : 0,
    },
    { name: "Order conversion", value: trafficEvents ? Math.round(conversion) : 0 },
    {
      name: "Inventory in stock",
      value: inventory.length ? Math.round(((inventory.length - outOfStock) / inventory.length) * 100) : 0,
    },
    {
      name: "Reviews approved",
      value: reviewStats.total ? Math.round((reviewStats.approved / reviewStats.total) * 100) : 0,
    },
  ];
  const attention = security.failedEvents > 0 || security.failedLogins > 0;
  const statusRows: StatusRow[] = [
    { name: "Media Library", status: `${mediaStats.total} files`, tone: "good", gradient: "from-emerald-500 to-cyan-500" },
    { name: "Audit Trail", status: `${security.auditEvents} events`, tone: "good", gradient: "from-emerald-500 to-cyan-500" },
    {
      name: "Failed Logins",
      status: security.failedLogins > 0 ? `${security.failedLogins} flagged` : "None",
      tone: security.failedLogins > 0 ? "warn" : "good",
      gradient: "from-blue-500 to-indigo-500",
    },
  ];

  const activityItems: ActivityItem[] =
    auditLogs.length > 0
      ? auditLogs.slice(0, 6).map((log, index) => ({
          text: `${log.adminName ?? "System"} ${log.action.replace(/_/g, " ").toLowerCase()}${
            log.resource ? ` · ${log.resource}` : ""
          }`,
          time: timeAgo(log.created_at),
          color: activityColors[index % activityColors.length],
        }))
      : recentEvents.slice(0, 6).map((event, index) => ({
          text: `${event.name.replace(/_/g, " ")}${
            event.path ? ` · ${event.path}` : ""
          }`,
          time: timeAgo(event.created_at),
          color: activityColors[index % activityColors.length],
        }));

  const recentOrders = orders.slice(0, 5);
  const recentCustomers = customerRows.filter((customer) => customer.role === "customer").slice(0, 3);
  const maxUnits = Math.max(1, ...topProducts.map((product) => product.units));
  const topRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);

  return (
    <div className="relative min-h-screen space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <DashboardHero todayRevenue={today.revenue} todayOrders={today.orders} />

      <KpiGrid items={kpiItems} />

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <AnalyticsPanel data={analyticsData} />
        <StatusPanel bars={statusBars} rows={statusRows} attention={attention} />
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
                {recentOrders.map(({ order, customerName, customerEmail }) => {
                  const name = customerName ?? customerEmail ?? "Guest";
                  return (
                    <tr key={order.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                      <td className="p-3 font-semibold text-blue-300">#{order.order_number.replace(/^#/, "")}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <span>{name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold">${Number(order.grand_total).toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`rounded-full bg-white/5 px-3 py-1 text-xs font-semibold ${orderStatusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">No data yet</td>
                  </tr>
                )}
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
            {topProducts.map((product) => {
              const cover = coverImages.get(product.productId);
              const share = topRevenue > 0 ? Math.round((product.revenue / topRevenue) * 100) : 0;
              return (
                <div key={product.productId} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]">
                  {cover ? (
                    <Image src={cover} alt={product.name} width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{product.name}</p>
                    <p className="text-xs text-slate-400">
                      {product.units.toLocaleString("en-US")} sales · ${Math.round(product.revenue).toLocaleString("en-US")}
                    </p>
                    <ProgressBar value={Math.round((product.units / maxUnits) * 100)} />
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{share}%</span>
                </div>
              );
            })}
            {topProducts.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Recent Customers</h2>
            <p className="text-sm text-slate-400">New and engaged buyers</p>
          </div>
          <div className="space-y-4 p-5">
            {recentCustomers.map((customer) => {
              const name = customer.fullName ?? customer.username ?? "Customer";
              return (
                <div key={customer.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    {customer.avatarUrl ? (
                      <Image src={customer.avatarUrl} alt={name} width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-400/30" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold ring-2 ring-blue-400/30">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="truncate text-xs text-slate-400">
                        {customer.email ?? "No email"} · {timeAgo(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{customer.totalOrders} orders</span>
                    <span className="font-bold text-emerald-300">${customer.totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
            {recentCustomers.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
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
            {lowStockItems.map((item) => {
              const cover = coverImages.get(item.productId);
              return (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-red-400/15 bg-red-400/5 p-4">
                  <div className="flex items-center gap-3">
                    {cover ? (
                      <Image src={cover} alt={item.productName} width={48} height={48} className="h-12 w-12 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold">
                        {item.productName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-slate-400">{item.quantity} units remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                      {item.quantity === 0 ? "Out of stock" : "Priority"}
                    </span>
                    <button className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20">Restock</button>
                  </div>
                </div>
              );
            })}
            {lowStockItems.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
          </div>
        </Panel>

        <Panel>
          <div className="border-b border-white/10 p-5">
            <h2 className="text-xl font-bold text-white">Realtime Activity</h2>
            <p className="text-sm text-slate-400">Live feed from the store</p>
          </div>
          <ActivityFeed items={activityItems} />
        </Panel>
      </section>

      <QuickActions />
    </div>
  );
}
