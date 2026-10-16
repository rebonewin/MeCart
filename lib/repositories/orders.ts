import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type {
  OrderItemRow,
  OrderRow,
  OrderStatus,
  PaymentMethod,
  PaymentRow,
  PaymentStatus,
} from "@/types/database";

export type OrderWithDetails = {
  order: OrderRow;
  items: OrderItemRow[];
  payments: PaymentRow[];
  customerName: string | null;
  customerEmail: string | null;
};

export type CheckoutPayload = {
  items: { product_id: string; quantity: number; size?: string | null; color?: string | null }[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  billing_address?: string | null;
  city: string;
  zip: string;
  coupon_code?: string | null;
  payment_method: PaymentMethod;
  notes?: string | null;
};

export type PlaceOrderResult = {
  order_id: string;
  order_number: string;
  invoice_number: string;
  payment_id: string;
  transaction_id: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  grand_total: number;
};

export async function placeOrder(payload: CheckoutPayload): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", { payload: payload as never });
  if (error) throw new Error(error.message);
  const result = data as unknown as PlaceOrderResult;
  return { ...result, grand_total: toNumber(result.grand_total) };
}

export async function listOrdersForUser(userId: string): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  const orders = unwrapList(
    await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
  return hydrateOrders(orders);
}

export async function listAllOrders(options: { status?: OrderStatus; paymentStatus?: PaymentStatus; limit?: number } = {}): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  let query = supabase.from("orders").select("*").is("deleted_at", null);
  if (options.status) query = query.eq("status", options.status);
  if (options.paymentStatus) query = query.eq("payment_status", options.paymentStatus);
  const orders = unwrapList(
    await query.order("created_at", { ascending: false }).limit(options.limit ?? 200),
  );
  return hydrateOrders(orders);
}

async function hydrateOrders(orders: OrderRow[]): Promise<OrderWithDetails[]> {
  if (!orders.length) return [];
  const supabase = await createClient();
  const orderIds = orders.map((o) => o.id);

  const [itemsRes, paymentsRes, profilesRes] = await Promise.all([
    supabase.from("order_items").select("*").in("order_id", orderIds).order("created_at"),
    supabase.from("payments").select("*").in("order_id", orderIds).order("created_at"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));

  return orders.map((order) => {
    const profile = order.user_id ? profileMap.get(order.user_id) : undefined;
    return {
      order,
      items: (itemsRes.data ?? []).filter((i) => i.order_id === order.id),
      payments: (paymentsRes.data ?? []).filter((p) => p.order_id === order.id),
      customerName: profile?.full_name ?? order.customer_name,
      customerEmail: profile?.email ?? order.customer_email,
    };
  });
}

export async function getOrderDetails(id: string): Promise<OrderWithDetails | null> {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return null;
  const [hydrated] = await hydrateOrders([order]);
  return hydrated;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("orders").update({ status }).eq("id", id));
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("orders").update({ payment_status: status }).eq("id", id));
  unwrapVoid(await supabase.from("payments").update({ status }).eq("order_id", id));
}

export type OrderStats = {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  recentOrders: OrderRow[];
};

export async function getOrderStats(): Promise<OrderStats> {
  const supabase = await createClient();
  const orders = unwrapList(
    await supabase.from("orders").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
  );

  const paid = orders.filter((o) => o.payment_status === "PAID");
  const revenue = paid.reduce((sum, o) => sum + toNumber(o.grand_total), 0);

  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "PENDING").length,
    paidOrders: paid.length,
    totalRevenue: revenue,
    averageOrderValue: paid.length ? revenue / paid.length : 0,
    recentOrders: orders.slice(0, 10),
  };
}

export async function listPaymentsWithOrders(): Promise<(PaymentRow & { orderNumber: string; grandTotal: number })[]> {
  const supabase = await createClient();
  const payments = unwrapList(
    await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(200),
  );
  if (!payments.length) return [];

  const orderIds = [...new Set(payments.map((p) => p.order_id))];
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, grand_total")
    .in("id", orderIds);

  const orderMap = new Map((orders ?? []).map((o) => [o.id, o]));

  return payments.map((p) => ({
    ...p,
    orderNumber: orderMap.get(p.order_id)?.order_number ?? "",
    grandTotal: toNumber(orderMap.get(p.order_id)?.grand_total ?? 0),
  }));
}

export async function getMonthlyRevenueSeries(months = 6): Promise<{ label: string; revenue: number; orders: number }[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const orders = unwrapList(
    await supabase
      .from("orders")
      .select("created_at, grand_total, payment_status")
      .is("deleted_at", null)
      .gte("created_at", since.toISOString()),
  );

  const buckets = new Map<string, { label: string; revenue: number; orders: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, {
      label: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.payment_status === "PAID") bucket.revenue += toNumber(order.grand_total);
  }

  return [...buckets.values()];
}

export { toNumber };
export type { OrderRow, OrderItemRow, PaymentRow };
