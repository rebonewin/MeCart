import "server-only";

import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid, toNumber } from "@/lib/repositories/utils";
import type {
  CouponRow,
  OrderItemRow,
  OrderRow,
  ProductRow,
  ReviewRow,
  StoreRow,
  VendorConversationRow,
  VendorLedgerEntryRow,
  VendorMessageRow,
  VendorNotificationRow,
  VendorOrderAllocationRow,
  VendorPayoutAccountRow,
  VendorPayoutRow,
  VendorReturnRow,
  VendorShippingProfileRow,
  VendorShippingRateRow,
  VendorShippingRateRow as ShippingRateRow,
} from "@/types/database";

export type SellerProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  vendorSku: string | null;
  price: number;
  compareAt: number;
  stock: number;
  status: ProductRow["status"];
  approvalStatus: ProductRow["approval_status"];
  storeId: string | null;
  storeName: string;
  image: string | null;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};

export async function listSellerProducts(
  vendorId: string,
  options: { search?: string; status?: string; approval?: string; limit?: number; offset?: number } = {},
): Promise<{ items: SellerProduct[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendorId)
    .is("deleted_at", null);

  if (options.search) {
    query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%,vendor_sku.ilike.%${options.search}%`);
  }
  if (options.status) query = query.eq("status", options.status as ProductRow["status"]);
  if (options.approval) query = query.eq("approval_status", options.approval as ProductRow["approval_status"]);

  const limit = Math.min(options.limit ?? 25, 100);
  const offset = options.offset ?? 0;
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (!rows.length) return { items: [], total: count ?? 0 };

  const productIds = rows.map((row) => row.id);
  const storeIds = [...new Set(rows.map((row) => row.store_id).filter((id): id is string => Boolean(id)))];
  const categoryIds = [...new Set(rows.map((row) => row.category_id))];

  const [imagesRes, storesRes, categoriesRes] = await Promise.all([
    supabase
      .from("product_images")
      .select("product_id, url, position")
      .in("product_id", productIds)
      .order("position"),
    storeIds.length ? supabase.from("stores").select("id, name").in("id", storeIds) : Promise.resolve({ data: [], error: null }),
    supabase.from("categories").select("id, name").in("id", categoryIds),
  ]);

  const images = new Map<string, string>();
  for (const image of imagesRes.data ?? []) {
    if (!images.has(image.product_id)) images.set(image.product_id, image.url);
  }
  const stores = new Map((storesRes.data ?? []).map((store) => [store.id, store.name]));
  const categories = new Map((categoriesRes.data ?? []).map((category) => [category.id, category.name]));

  return {
    total: count ?? rows.length,
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      vendorSku: row.vendor_sku,
      price: toNumber(row.final_price),
      compareAt: toNumber(row.original_price),
      stock: row.stock,
      status: row.status,
      approvalStatus: row.approval_status,
      storeId: row.store_id,
      storeName: row.store_id ? stores.get(row.store_id) ?? "Store" : "—",
      image: images.get(row.id) ?? null,
      categoryName: categories.get(row.category_id) ?? "Uncategorized",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  };
}

export async function getSellerProduct(vendorId: string, id: string) {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) return null;

  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("position");

  return { ...product, images: images ?? [] };
}

export type SellerOrderView = {
  allocation: VendorOrderAllocationRow;
  order: OrderRow;
  items: OrderItemRow[];
};

export async function listSellerOrders(
  vendorId: string,
  options: { status?: string; search?: string; limit?: number; offset?: number } = {},
): Promise<SellerOrderView[]> {
  const supabase = await createClient();
  let allocationQuery = supabase
    .from("vendor_order_allocations")
    .select("*")
    .eq("vendor_id", vendorId);
  if (options.status) {
    allocationQuery = allocationQuery.eq(
      "fulfillment_status",
      options.status as VendorOrderAllocationRow["fulfillment_status"],
    );
  }
  const allocations = unwrapList(
    await allocationQuery.order("created_at", { ascending: false }).limit(options.limit ?? 100),
  );
  if (!allocations.length) return [];

  const orderIds = [...new Set(allocations.map((allocation) => allocation.order_id))];
  const [ordersRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("*").in("id", orderIds).is("deleted_at", null),
    supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .eq("vendor_id", vendorId),
  ]);

  const orderMap = new Map((ordersRes.data ?? []).map((order) => [order.id, order]));
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of itemsRes.data ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return allocations
    .map((allocation) => {
      const order = orderMap.get(allocation.order_id);
      if (!order) return null;
      return {
        allocation,
        order,
        items: itemsByOrder.get(order.id) ?? [],
      };
    })
    .filter((row): row is SellerOrderView => Boolean(row))
    .filter((row) => {
      if (!options.search) return true;
      const needle = options.search.toLowerCase();
      return (
        row.order.order_number.toLowerCase().includes(needle) ||
        row.order.customer_name.toLowerCase().includes(needle) ||
        row.order.customer_email.toLowerCase().includes(needle)
      );
    });
}

export async function getSellerOrder(vendorId: string, orderId: string): Promise<SellerOrderView | null> {
  const supabase = await createClient();
  const { data: allocation } = await supabase
    .from("vendor_order_allocations")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (!allocation) return null;

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .eq("vendor_id", vendorId)
      .order("created_at"),
  ]);
  if (!order) return null;
  return { allocation, order, items: items ?? [] };
}

export type SellerDashboard = {
  revenue: number;
  revenue30: number;
  orders: number;
  orders30: number;
  units: number;
  pendingFulfillment: number;
  availableBalance: number;
  pendingBalance: number;
  productCount: number;
  lowStock: number;
  pendingApproval: number;
  openReturns: number;
  unreadMessages: number;
  unreadNotifications: number;
  recentOrders: SellerOrderView[];
  revenueSeries: { label: string; revenue: number; orders: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
};

export async function getSellerDashboard(vendorId: string): Promise<SellerDashboard> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [allocationsRes, ledgerRes, productsRes, returnsRes, conversationsRes, notificationsRes, recent] =
    await Promise.all([
      supabase
        .from("vendor_order_allocations")
        .select("*")
        .eq("vendor_id", vendorId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("vendor_ledger_entries")
        .select("amount, available_at, payout_id, type")
        .eq("vendor_id", vendorId)
        .is("payout_id", null),
      supabase
        .from("products")
        .select("id, stock, status, approval_status")
        .eq("vendor_id", vendorId)
        .is("deleted_at", null),
      supabase
        .from("vendor_returns")
        .select("id")
        .eq("vendor_id", vendorId)
        .in("status", ["REQUESTED", "APPROVED", "RECEIVED"]),
      supabase
        .from("vendor_conversations")
        .select("id")
        .eq("vendor_id", vendorId)
        .in("status", ["OPEN", "PENDING"]),
      supabase
        .from("vendor_notifications")
        .select("id")
        .eq("vendor_id", vendorId)
        .is("read_at", null),
      listSellerOrders(vendorId, { limit: 6 }),
    ]);

  const allocations = allocationsRes.data ?? [];
  const revenue30 = allocations.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
  const orders30 = new Set(allocations.map((item) => item.order_id)).size;
  const units = allocations.length;
  const pendingFulfillment = allocations.filter((item) =>
    ["PENDING", "PROCESSING", "PACKED"].includes(item.fulfillment_status),
  ).length;

  const ledger = ledgerRes.data ?? [];
  const now = Date.now();
  const availableBalance = ledger
    .filter((entry) => new Date(entry.available_at).getTime() <= now)
    .reduce((sum, entry) => sum + toNumber(entry.amount), 0);
  const pendingBalance = ledger
    .filter((entry) => new Date(entry.available_at).getTime() > now)
    .reduce((sum, entry) => sum + toNumber(entry.amount), 0);

  const products = productsRes.data ?? [];

  const seriesMap = new Map<string, { label: string; revenue: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    seriesMap.set(key, {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      orders: 0,
    });
  }
  const seenOrders = new Set<string>();
  for (const allocation of allocations) {
    const key = allocation.created_at.slice(0, 10);
    const bucket = seriesMap.get(key);
    if (!bucket) continue;
    bucket.revenue += toNumber(allocation.subtotal);
    if (!seenOrders.has(allocation.order_id)) {
      bucket.orders += 1;
      seenOrders.add(allocation.order_id);
    }
  }

  const itemRows = unwrapList(
    await supabase
      .from("order_items")
      .select("name, quantity, total, vendor_id, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", since.toISOString()),
  );
  const topMap = new Map<string, { name: string; units: number; revenue: number }>();
  for (const item of itemRows) {
    const entry = topMap.get(item.name) ?? { name: item.name, units: 0, revenue: 0 };
    entry.units += item.quantity;
    entry.revenue += toNumber(item.total);
    topMap.set(item.name, entry);
  }

  return {
    revenue: revenue30,
    revenue30,
    orders: orders30,
    orders30,
    units,
    pendingFulfillment,
    availableBalance,
    pendingBalance,
    productCount: products.length,
    lowStock: products.filter((product) => product.stock <= 5).length,
    pendingApproval: products.filter((product) => product.approval_status === "PENDING").length,
    openReturns: returnsRes.data?.length ?? 0,
    unreadMessages: conversationsRes.data?.length ?? 0,
    unreadNotifications: notificationsRes.data?.length ?? 0,
    recentOrders: recent,
    revenueSeries: [...seriesMap.values()],
    topProducts: [...topMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  };
}

export type SellerAnalytics = {
  revenue: number;
  refunds: number;
  commission: number;
  orders: number;
  units: number;
  averageOrder: number;
  conversionFunnel: { label: string; value: number; tone: string }[];
  series: { label: string; revenue: number; orders: number; commission: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  fulfilment: Record<string, number>;
};

export async function getSellerAnalytics(vendorId: string, days = 90): Promise<SellerAnalytics> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [allocationsRes, itemsRes, refundsRes] = await Promise.all([
    supabase
      .from("vendor_order_allocations")
      .select("*")
      .eq("vendor_id", vendorId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("order_items")
      .select("name, quantity, total, created_at")
      .eq("vendor_id", vendorId)
      .gte("created_at", since.toISOString()),
    supabase
      .from("vendor_returns")
      .select("refund_amount, commission_reversal, status")
      .eq("vendor_id", vendorId)
      .gte("created_at", since.toISOString())
      .in("status", ["REFUNDED", "RECEIVED", "CLOSED"]),
  ]);

  const allocations = allocationsRes.data ?? [];
  const items = itemsRes.data ?? [];
  const refunds = refundsRes.data ?? [];
  const orderIds = new Set(allocations.map((allocation) => allocation.order_id));
  const revenue = allocations.reduce((sum, allocation) => sum + toNumber(allocation.subtotal), 0);
  const commission = allocations.reduce((sum, allocation) => sum + toNumber(allocation.commission_amount), 0);

  const seriesMap = new Map<string, { label: string; revenue: number; orders: number; commission: number }>();
  const bucketDays = 14;
  for (let index = 0; index < days; index += bucketDays) {
    const start = new Date(since);
    start.setDate(start.getDate() + index);
    const end = new Date(start);
    end.setDate(end.getDate() + bucketDays - 1);
    seriesMap.set(start.toISOString().slice(0, 10), {
      label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      revenue: 0,
      orders: 0,
      commission: 0,
    });
  }
  for (const allocation of allocations) {
    const created = new Date(allocation.created_at);
    const diff = Math.floor((created.getTime() - since.getTime()) / 86_400_000);
    const bucketIndex = Math.max(0, Math.floor(diff / bucketDays));
    const bucketStart = new Date(since);
    bucketStart.setDate(bucketStart.getDate() + bucketIndex * bucketDays);
    const bucket = seriesMap.get(bucketStart.toISOString().slice(0, 10));
    if (!bucket) continue;
    bucket.revenue += toNumber(allocation.subtotal);
    bucket.commission += toNumber(allocation.commission_amount);
    bucket.orders += 1;
  }

  const topMap = new Map<string, { name: string; units: number; revenue: number }>();
  for (const item of items) {
    const entry = topMap.get(item.name) ?? { name: item.name, units: 0, revenue: 0 };
    entry.units += item.quantity;
    entry.revenue += toNumber(item.total);
    topMap.set(item.name, entry);
  }

  const fulfilment: Record<string, number> = {};
  for (const allocation of allocations) {
    fulfilment[allocation.fulfillment_status] = (fulfilment[allocation.fulfillment_status] ?? 0) + 1;
  }

  return {
    revenue,
    refunds: refunds.reduce((sum, refund) => sum + toNumber(refund.refund_amount), 0),
    commission,
    orders: orderIds.size,
    units: items.reduce((sum, item) => sum + item.quantity, 0),
    averageOrder: orderIds.size ? revenue / orderIds.size : 0,
    conversionFunnel: [
      { label: "Sessions", value: 0, tone: "muted" },
      { label: "Add to cart", value: 0, tone: "muted" },
      { label: "Checkout", value: 0, tone: "gold" },
      { label: "Paid orders", value: orderIds.size, tone: "green" },
    ],
    series: [...seriesMap.values()],
    topProducts: [...topMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    fulfilment,
  };
}

export type SellerCustomer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  total: number;
  lastOrder: string;
};

export async function listSellerCustomers(vendorId: string): Promise<SellerCustomer[]> {
  const supabase = await createClient();
  const orders = unwrapList(
    await supabase
      .from("orders")
      .select("id, customer_name, customer_email, created_at")
      .in(
        "id",
        (
          await supabase
            .from("vendor_order_allocations")
            .select("order_id")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false })
            .limit(1000)
        ).data?.map((row) => row.order_id) ?? [],
      )
      .order("created_at", { ascending: false }),
  );
  if (!orders.length) return [];

  const orderIds = orders.map((order) => order.id);
  const { data: allocations } = await supabase
    .from("vendor_order_allocations")
    .select("order_id, subtotal")
    .eq("vendor_id", vendorId)
    .in("order_id", orderIds);

  const totals = new Map<string, number>();
  for (const allocation of allocations ?? []) {
    totals.set(
      allocation.order_id,
      (totals.get(allocation.order_id) ?? 0) + toNumber(allocation.subtotal),
    );
  }

  const map = new Map<string, SellerCustomer>();
  for (const order of orders) {
    const key = order.customer_email.toLowerCase();
    const entry =
      map.get(key) ??
      ({
        id: key,
        name: order.customer_name,
        email: order.customer_email,
        orders: 0,
        total: 0,
        lastOrder: order.created_at,
      } satisfies SellerCustomer);
    entry.orders += 1;
    entry.total += totals.get(order.id) ?? 0;
    if (order.created_at > entry.lastOrder) entry.lastOrder = order.created_at;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export async function listSellerCoupons(vendorId: string): Promise<(CouponRow & { usageCount: number })[]> {
  const supabase = await createClient();
  const coupons = unwrapList(
    await supabase
      .from("coupons")
      .select("*")
      .eq("vendor_id", vendorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );
  if (!coupons.length) return [];
  const { data: usage } = await supabase
    .from("coupon_usage")
    .select("coupon_id")
    .in("coupon_id", coupons.map((coupon) => coupon.id));
  const map = new Map<string, number>();
  for (const row of usage ?? []) map.set(row.coupon_id, (map.get(row.coupon_id) ?? 0) + 1);
  return coupons.map((coupon) => ({ ...coupon, usageCount: map.get(coupon.id) ?? coupon.used_count }));
}

export async function listSellerReviews(
  vendorId: string,
): Promise<(ReviewRow & { productName: string })[]> {
  const supabase = await createClient();
  const reviews = unwrapList(
    await supabase
      .from("reviews")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(200),
  );
  if (!reviews.length) return [];
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", [...new Set(reviews.map((review) => review.product_id))]);
  const names = new Map((products ?? []).map((product) => [product.id, product.name]));
  return reviews.map((review) => ({ ...review, productName: names.get(review.product_id) ?? "Product" }));
}

export type SellerConversation = VendorConversationRow & {
  customerName: string;
  customerEmail: string;
  unread: number;
  messages: VendorMessageRow[];
};

export async function listSellerConversations(vendorId: string): Promise<SellerConversation[]> {
  const supabase = await createClient();
  const conversations = unwrapList(
    await supabase
      .from("vendor_conversations")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("last_message_at", { ascending: false })
      .limit(100),
  );
  if (!conversations.length) return [];

  const [messagesRes, profilesRes] = await Promise.all([
    supabase
      .from("vendor_messages")
      .select("*")
      .in("conversation_id", conversations.map((conversation) => conversation.id))
      .order("created_at"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [...new Set(conversations.map((conversation) => conversation.customer_id))]),
  ]);
  const profiles = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));
  return conversations.map((conversation) => {
    const messages = (messagesRes.data ?? []).filter(
      (message) => message.conversation_id === conversation.id,
    );
    const profile = profiles.get(conversation.customer_id);
    return {
      ...conversation,
      customerName: profile?.full_name ?? "Customer",
      customerEmail: profile?.email ?? "",
      unread: messages.filter(
        (message) => message.sender_type === "CUSTOMER" && !message.read_at,
      ).length,
      messages,
    };
  });
}

export async function listSellerReturns(vendorId: string): Promise<(VendorReturnRow & { orderNumber: string; customerName: string })[]> {
  const supabase = await createClient();
  const rows = unwrapList(
    await supabase
      .from("vendor_returns")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
  );
  if (!rows.length) return [];
  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, customer_name")
    .in("id", [...new Set(rows.map((row) => row.order_id))]);
  const map = new Map((orders ?? []).map((order) => [order.id, order]));
  return rows.map((row) => ({
    ...row,
    orderNumber: map.get(row.order_id)?.order_number ?? "—",
    customerName: map.get(row.order_id)?.customer_name ?? "Customer",
  }));
}

export type SellerFinance = {
  ledger: VendorLedgerEntryRow[];
  payouts: VendorPayoutRow[];
  accounts: VendorPayoutAccountRow[];
  available: number;
  pending: number;
  lifetime: number;
};

export async function getSellerFinance(vendorId: string): Promise<SellerFinance> {
  const supabase = await createClient();
  const [ledgerRes, payoutsRes, accountsRes] = await Promise.all([
    supabase
      .from("vendor_ledger_entries")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("vendor_payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false }),
    supabase.from("vendor_payout_accounts").select("*").eq("vendor_id", vendorId),
  ]);
  const ledger = ledgerRes.data ?? [];
  const now = Date.now();
  return {
    ledger,
    payouts: payoutsRes.data ?? [],
    accounts: accountsRes.data ?? [],
    available: ledger
      .filter((entry) => !entry.payout_id && new Date(entry.available_at).getTime() <= now)
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0),
    pending: ledger
      .filter((entry) => !entry.payout_id && new Date(entry.available_at).getTime() > now)
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0),
    lifetime: ledger
      .filter((entry) => entry.type === "SALE")
      .reduce((sum, entry) => sum + toNumber(entry.amount), 0),
  };
}

export async function listSellerShipping(vendorId: string): Promise<{
  profiles: VendorShippingProfileRow[];
  rates: VendorShippingRateRow[];
}> {
  const supabase = await createClient();
  const [profilesRes, ratesRes] = await Promise.all([
    supabase
      .from("vendor_shipping_profiles")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("is_default", { ascending: false }),
    supabase.from("vendor_shipping_rates").select("*").eq("vendor_id", vendorId),
  ]);
  const profiles = profilesRes.data ?? [];
  const rates = (ratesRes.data ?? []) as ShippingRateRow[];
  return { profiles, rates };
}

export async function listSellerNotifications(vendorId: string): Promise<VendorNotificationRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("vendor_notifications")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(100),
  );
}

export async function listSellerStores(vendorId: string): Promise<StoreRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("stores")
      .select("*")
      .eq("vendor_id", vendorId)
      .is("deleted_at", null)
      .order("created_at"),
  );
}

export async function markSellerNotificationRead(vendorId: string, notificationId: string) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase
      .from("vendor_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("vendor_id", vendorId)
      .eq("id", notificationId),
  );
}
