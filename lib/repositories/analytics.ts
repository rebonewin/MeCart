import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList } from "@/lib/repositories/utils";
import type { DB } from "@/lib/repositories/utils";
import type { Json } from "@/types/database";

/** Client-safe event recording. Pass the Supabase client (browser or server). */
export async function recordEvent(
  supabase: DB,
  input: { name: string; path?: string | null; sessionId?: string | null; properties?: Json; userId?: string | null },
) {
  try {
    await supabase.from("analytics_events").insert({
      name: input.name,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      path: input.path ?? null,
      properties: input.properties ?? {},
    });
  } catch {
    // analytics must never break the app
  }
}

export type DashboardStats = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  pendingOrders: number;
  lowStock: number;
  revenueChangePct: number;
  ordersChangePct: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [ordersRes, profilesRes, productsRes] = await Promise.all([
    supabase.from("orders").select("grand_total, payment_status, status, created_at").is("deleted_at", null),
    supabase.from("profiles").select("id, role, created_at").is("deleted_at", null),
    supabase.from("products").select("id, stock, status").is("deleted_at", null),
  ]);

  const orders = ordersRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const products = productsRes.data ?? [];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const paid = orders.filter((o) => o.payment_status === "PAID");
  const revenue = paid.reduce((sum, o) => sum + toNumber(o.grand_total), 0);

  const thisMonthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const prevMonthOrders = orders.filter(
    (o) => new Date(o.created_at) >= prevMonthStart && new Date(o.created_at) < monthStart,
  );

  const thisMonthRevenue = thisMonthOrders
    .filter((o) => o.payment_status === "PAID")
    .reduce((sum, o) => sum + toNumber(o.grand_total), 0);
  const prevMonthRevenue = prevMonthOrders
    .filter((o) => o.payment_status === "PAID")
    .reduce((sum, o) => sum + toNumber(o.grand_total), 0);

  const pct = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 1000) / 10;

  return {
    revenue,
    orders: orders.length,
    customers: profiles.filter((p) => p.role === "customer" || p.role === "guest").length,
    products: products.filter((p) => !("deleted_at" in p) || true).length,
    pendingOrders: orders.filter((o) => o.status === "PENDING").length,
    lowStock: products.filter((p) => p.stock <= 10).length,
    revenueChangePct: pct(thisMonthRevenue, prevMonthRevenue),
    ordersChangePct: pct(thisMonthOrders.length, prevMonthOrders.length),
  };
}

export async function getTrafficSeries(days = 14): Promise<{ label: string; events: number; orders: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [eventsRes, ordersRes] = await Promise.all([
    supabase.from("analytics_events").select("created_at").gte("created_at", since.toISOString()),
    supabase.from("orders").select("created_at").is("deleted_at", null).gte("created_at", since.toISOString()),
  ]);

  const series: { label: string; events: number; orders: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayEnd = new Date(d);
    dayEnd.setDate(d.getDate() + 1);

    series.push({
      label,
      events: (eventsRes.data ?? []).filter((e) => {
        const t = new Date(e.created_at);
        return t >= d && t < dayEnd;
      }).length,
      orders: (ordersRes.data ?? []).filter((o) => {
        const t = new Date(o.created_at);
        return t >= d && t < dayEnd;
      }).length,
    });
  }
  return series;
}

export type TopProduct = { productId: string; name: string; units: number; revenue: number };

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const supabase = await createClient();
  const items = unwrapList(
    await supabase.from("order_items").select("product_id, name, quantity, total").limit(1000),
  );

  const map = new Map<string, TopProduct>();
  for (const item of items) {
    const key = item.product_id ?? item.name;
    const entry = map.get(key) ?? { productId: key, name: item.name, units: 0, revenue: 0 };
    entry.units += item.quantity;
    entry.revenue += toNumber(item.total);
    map.set(key, entry);
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export async function listRecentEvents(limit = 20) {
  const supabase = await createClient();
  return unwrapList(
    await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(limit),
  );
}
