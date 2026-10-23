import "server-only";

import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/repositories/utils";
import type {
  ProductRow,
  StoreRow,
  VendorMemberRow,
  VendorPayoutRow,
  VendorReturnRow,
  VendorRow,
  VendorVerificationRow,
} from "@/types/database";

export type AdminVendorListItem = VendorRow & {
  ownerName: string | null;
  ownerEmail: string | null;
  storeCount: number;
  pendingProducts: number;
  openReturns: number;
};

export type AdminMarketplaceProduct = ProductRow & {
  vendorName: string | null;
  storeName: string | null;
};

export type AdminStoreListItem = StoreRow & {
  vendorName: string;
};

export type AdminPayoutListItem = VendorPayoutRow & {
  vendorName: string;
};

export type AdminReturnListItem = VendorReturnRow & {
  vendorName: string;
  orderNumber: string | null;
  customerName: string | null;
};

function sum(values: Array<number | string | null | undefined>) {
  return values.reduce<number>((total, value) => total + toNumber(value), 0);
}

export async function getMarketplaceAdminOverview() {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [vendorsRes, storesRes, productsRes, payoutsRes, returnsRes, allocationsRes, recentVendorsRes, pendingProductsRes, pendingPayoutsRes, openReturnsRes] =
    await Promise.all([
      supabase.from("vendors").select("*").is("deleted_at", null),
      supabase.from("stores").select("*").is("deleted_at", null),
      supabase.from("products").select("id, vendor_id, approval_status, status").is("deleted_at", null),
      supabase.from("vendor_payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("vendor_returns").select("*"),
      supabase.from("vendor_order_allocations").select("subtotal, commission_amount, vendor_earnings, created_at").gte("created_at", since.toISOString()),
      supabase.from("vendors").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
      supabase.from("products").select("*").not("vendor_id", "is", null).eq("approval_status", "PENDING").is("deleted_at", null).order("submitted_at", { ascending: true }).limit(6),
      supabase.from("vendor_payouts").select("*").eq("status", "PENDING").order("created_at").limit(6),
      supabase.from("vendor_returns").select("*").in("status", ["REQUESTED", "APPROVED", "RECEIVED"]).order("created_at").limit(6),
    ]);

  const vendors = vendorsRes.data ?? [];
  const stores = storesRes.data ?? [];
  const products = productsRes.data ?? [];
  const payouts = payoutsRes.data ?? [];
  const returns = returnsRes.data ?? [];
  const allocations = allocationsRes.data ?? [];

  return {
    vendors: {
      total: vendors.length,
      approved: vendors.filter((vendor) => vendor.status === "APPROVED").length,
      pending: vendors.filter((vendor) => vendor.status === "PENDING" || vendor.status === "UNDER_REVIEW").length,
      suspended: vendors.filter((vendor) => vendor.status === "SUSPENDED").length,
    },
    stores: {
      total: stores.length,
      active: stores.filter((store) => store.status === "ACTIVE").length,
      pending: stores.filter((store) => store.status === "PENDING_REVIEW").length,
    },
    products: {
      total: products.filter((product) => product.vendor_id).length,
      pending: products.filter((product) => product.vendor_id && product.approval_status === "PENDING").length,
      active: products.filter((product) => product.vendor_id && product.approval_status === "APPROVED" && product.status === "ACTIVE").length,
    },
    gmv30: sum(allocations.map((allocation) => allocation.subtotal)),
    commission30: sum(allocations.map((allocation) => allocation.commission_amount)),
    vendorEarnings30: sum(allocations.map((allocation) => allocation.vendor_earnings)),
    payoutsPending: payouts.filter((payout) => payout.status === "PENDING").length,
    payoutsPendingValue: sum(payouts.filter((payout) => payout.status === "PENDING").map((payout) => payout.net_amount)),
    returnsOpen: returns.filter((item) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status)).length,
    recentVendors: (recentVendorsRes.data ?? []) as VendorRow[],
    pendingProducts: (pendingProductsRes.data ?? []) as ProductRow[],
    pendingPayouts: (pendingPayoutsRes.data ?? []) as VendorPayoutRow[],
    openReturns: (openReturnsRes.data ?? []) as VendorReturnRow[],
  };
}

export async function listAdminVendors(options: { status?: string; search?: string } = {}): Promise<AdminVendorListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("vendors").select("*").is("deleted_at", null);
  if (options.status) query = query.eq("status", options.status as VendorRow["status"]);
  if (options.search) query = query.or(`display_name.ilike.%${options.search}%,legal_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
  const { data: vendors } = await query.order("created_at", { ascending: false }).limit(300);
  const rows = (vendors ?? []) as VendorRow[];
  if (!rows.length) return [];

  const [storesRes, productsRes, returnsRes, profilesRes] = await Promise.all([
    supabase.from("stores").select("vendor_id, status").in("vendor_id", rows.map((vendor) => vendor.id)).is("deleted_at", null),
    supabase.from("products").select("vendor_id, approval_status").in("vendor_id", rows.map((vendor) => vendor.id)).is("deleted_at", null),
    supabase.from("vendor_returns").select("vendor_id, status").in("vendor_id", rows.map((vendor) => vendor.id)),
    supabase.from("profiles").select("id, full_name, email").in("id", rows.map((vendor) => vendor.owner_id)),
  ]);

  return rows.map((vendor) => {
    const profile = (profilesRes.data ?? []).find((item) => item.id === vendor.owner_id);
    return {
      ...vendor,
      ownerName: profile?.full_name ?? null,
      ownerEmail: profile?.email ?? null,
      storeCount: (storesRes.data ?? []).filter((store) => store.vendor_id === vendor.id).length,
      pendingProducts: (productsRes.data ?? []).filter((product) => product.vendor_id === vendor.id && product.approval_status === "PENDING").length,
      openReturns: (returnsRes.data ?? []).filter((item) => item.vendor_id === vendor.id && ["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status)).length,
    };
  });
}

export async function getAdminVendor(id: string): Promise<{
  vendor: VendorRow;
  stores: StoreRow[];
  members: VendorMemberRow[];
  profiles: { id: string; full_name: string | null; email: string | null }[];
  verification: VendorVerificationRow | null;
  payouts: VendorPayoutRow[];
  returns: VendorReturnRow[];
  productCounts: { total: number; pending: number; active: number };
  gmv: number;
  commission: number;
} | null> {
  const supabase = await createClient();
  const { data: vendor } = await supabase.from("vendors").select("*").eq("id", id).maybeSingle();
  if (!vendor) return null;

  const [storesRes, membersRes, verificationRes, payoutsRes, returnsRes, productsRes, allocationsRes] = await Promise.all([
    supabase.from("stores").select("*").eq("vendor_id", id).is("deleted_at", null).order("created_at"),
    supabase.from("vendor_members").select("*").eq("vendor_id", id).neq("status", "REMOVED"),
    supabase.from("vendor_verifications").select("*").eq("vendor_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("vendor_payouts").select("*").eq("vendor_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("vendor_returns").select("*").eq("vendor_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("products").select("id, approval_status, status").eq("vendor_id", id).is("deleted_at", null),
    supabase.from("vendor_order_allocations").select("subtotal, commission_amount").eq("vendor_id", id),
  ]);

  const members = (membersRes.data ?? []) as VendorMemberRow[];
  const { data: profiles } = members.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", members.map((member) => member.user_id))
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const products = productsRes.data ?? [];

  return {
    vendor: vendor as VendorRow,
    stores: (storesRes.data ?? []) as StoreRow[],
    members,
    profiles: profiles ?? [],
    verification: (verificationRes.data ?? null) as VendorVerificationRow | null,
    payouts: (payoutsRes.data ?? []) as VendorPayoutRow[],
    returns: (returnsRes.data ?? []) as VendorReturnRow[],
    productCounts: {
      total: products.length,
      pending: products.filter((product) => product.approval_status === "PENDING").length,
      active: products.filter((product) => product.status === "ACTIVE").length,
    },
    gmv: sum((allocationsRes.data ?? []).map((allocation) => allocation.subtotal)),
    commission: sum((allocationsRes.data ?? []).map((allocation) => allocation.commission_amount)),
  };
}

export async function listAdminMarketplaceProducts(approval?: string): Promise<AdminMarketplaceProduct[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .not("vendor_id", "is", null)
    .is("deleted_at", null);
  if (approval) query = query.eq("approval_status", approval as ProductRow["approval_status"]);
  const { data: products } = await query
    .order("approval_status", { ascending: true })
    .order("submitted_at", { ascending: true })
    .limit(400);
  const rows = (products ?? []) as ProductRow[];
  if (!rows.length) return [];

  const [vendorsRes, storesRes] = await Promise.all([
    supabase.from("vendors").select("id, display_name").in("id", [...new Set(rows.map((row) => row.vendor_id).filter((value): value is string => Boolean(value)))]),
    supabase.from("stores").select("id, name").in("id", [...new Set(rows.map((row) => row.store_id).filter((value): value is string => Boolean(value)))]),
  ]);
  const vendorMap = new Map((vendorsRes.data ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  const storeMap = new Map((storesRes.data ?? []).map((store) => [store.id, store.name]));

  return rows.map((product) => ({
    ...product,
    vendorName: product.vendor_id ? vendorMap.get(product.vendor_id) ?? null : null,
    storeName: product.store_id ? storeMap.get(product.store_id) ?? null : null,
  }));
}

export async function listAdminStores(status?: string): Promise<AdminStoreListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("stores").select("*").is("deleted_at", null);
  if (status) query = query.eq("status", status as StoreRow["status"]);
  const { data: stores } = await query.order("created_at", { ascending: false }).limit(300);
  const rows = (stores ?? []) as StoreRow[];
  const { data: vendors } = rows.length
    ? await supabase.from("vendors").select("id, display_name").in("id", [...new Set(rows.map((store) => store.vendor_id))])
    : { data: [] as { id: string; display_name: string }[] };
  const map = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  return rows.map((store) => ({ ...store, vendorName: map.get(store.vendor_id) ?? "Unknown vendor" }));
}

export async function listAdminPayouts(status?: string): Promise<AdminPayoutListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("vendor_payouts").select("*");
  if (status) query = query.eq("status", status as VendorPayoutRow["status"]);
  const { data: payouts } = await query.order("created_at", { ascending: false }).limit(300);
  const rows = (payouts ?? []) as VendorPayoutRow[];
  const { data: vendors } = rows.length
    ? await supabase.from("vendors").select("id, display_name").in("id", [...new Set(rows.map((payout) => payout.vendor_id))])
    : { data: [] as { id: string; display_name: string }[] };
  const map = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  return rows.map((payout) => ({ ...payout, vendorName: map.get(payout.vendor_id) ?? "Unknown vendor" }));
}

export async function listAdminReturns(status?: string): Promise<AdminReturnListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("vendor_returns").select("*");
  if (status) query = query.eq("status", status as VendorReturnRow["status"]);
  const { data: returns } = await query.order("created_at", { ascending: false }).limit(300);
  const rows = (returns ?? []) as VendorReturnRow[];
  if (!rows.length) return [];

  const [vendorsRes, ordersRes, profilesRes] = await Promise.all([
    supabase.from("vendors").select("id, display_name").in("id", [...new Set(rows.map((item) => item.vendor_id))]),
    supabase.from("orders").select("id, order_number, user_id").in("id", [...new Set(rows.map((item) => item.order_id))]),
    supabase.from("profiles").select("id, full_name").in("id", [...new Set(rows.map((item) => item.user_id).filter((value): value is string => Boolean(value)))]),
  ]);
  const vendorMap = new Map((vendorsRes.data ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  const orderMap = new Map((ordersRes.data ?? []).map((order) => [order.id, order]));
  const profileMap = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile.full_name]));

  return rows.map((item) => {
    const order = orderMap.get(item.order_id);
    return {
      ...item,
      vendorName: vendorMap.get(item.vendor_id) ?? "Unknown vendor",
      orderNumber: order?.order_number ?? null,
      customerName: (order?.user_id ? profileMap.get(order.user_id) : null) ?? null,
    };
  });
}

export async function listOwnershipProducts(search?: string): Promise<AdminMarketplaceProduct[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").is("deleted_at", null);
  const term = search?.trim();
  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,vendor_sku.ilike.%${term}%`);
  const { data: products } = await query.order("created_at", { ascending: false }).limit(300);
  const rows = (products ?? []) as ProductRow[];
  if (!rows.length) return [];

  const vendorIds = [...new Set(rows.map((row) => row.vendor_id).filter((value): value is string => Boolean(value)))];
  const storeIds = [...new Set(rows.map((row) => row.store_id).filter((value): value is string => Boolean(value)))];
  const [vendorsRes, storesRes] = await Promise.all([
    vendorIds.length
      ? supabase.from("vendors").select("id, display_name").in("id", vendorIds)
      : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
    storeIds.length
      ? supabase.from("stores").select("id, name").in("id", storeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const vendorMap = new Map((vendorsRes.data ?? []).map((vendor) => [vendor.id, vendor.display_name]));
  const storeMap = new Map((storesRes.data ?? []).map((store) => [store.id, store.name]));

  return rows.map((product) => ({
    ...product,
    vendorName: product.vendor_id ? vendorMap.get(product.vendor_id) ?? null : null,
    storeName: product.store_id ? storeMap.get(product.store_id) ?? null : null,
  }));
}

export async function listVendorStoreOptions() {
  const supabase = await createClient();
  const [vendorsRes, storesRes] = await Promise.all([
    supabase.from("vendors").select("id, display_name, commission_rate, status").is("deleted_at", null).order("display_name"),
    supabase.from("stores").select("id, name, vendor_id").is("deleted_at", null).order("name"),
  ]);
  return {
    vendors: vendorsRes.data ?? [],
    stores: storesRes.data ?? [],
  };
}

export async function getCommissionOverview() {
  const supabase = await createClient();
  const [vendorsRes, allocationsRes, productsRes] = await Promise.all([
    supabase.from("vendors").select("id, display_name, commission_rate, status, total_sales").is("deleted_at", null).order("total_sales", { ascending: false }).limit(100),
    supabase.from("vendor_order_allocations").select("vendor_id, subtotal, commission_amount, commission_rate, created_at"),
    supabase.from("products").select("vendor_id, commission_rate").not("vendor_id", "is", null).is("deleted_at", null),
  ]);
  const allocations = allocationsRes.data ?? [];
  const products = productsRes.data ?? [];
  const vendors = (vendorsRes.data ?? []) as Pick<VendorRow, "id" | "display_name" | "commission_rate" | "status" | "total_sales">[];

  return vendors.map((vendor) => {
    const vendorAllocations = allocations.filter((allocation) => allocation.vendor_id === vendor.id);
    const rates = products.filter((product) => product.vendor_id === vendor.id && product.commission_rate !== null).map((product) => Number(product.commission_rate));
    return {
      ...vendor,
      gmv: sum(vendorAllocations.map((allocation) => allocation.subtotal)),
      commission: sum(vendorAllocations.map((allocation) => allocation.commission_amount)),
      orders: vendorAllocations.length,
      averageRate: rates.length ? rates.reduce((total, rate) => total + rate, 0) / rates.length : vendor.commission_rate,
    };
  });
}
