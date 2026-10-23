import "server-only";

import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { unwrapList, toNumber } from "@/lib/repositories/utils";
import { listProducts, type ProductView } from "@/lib/repositories/products";
import type { PublicVendorProfileRow, StoreRow } from "@/types/database";

export type PublicStore = StoreRow & {
  vendorName: string;
  vendorSlug: string;
  vendorLogo: string | null;
};

async function attachVendors(stores: StoreRow[]): Promise<PublicStore[]> {
  if (!stores.length) return [];
  const supabase = getPublicSupabaseClient();
  const { data: vendors } = await supabase
    .from("public_vendor_profiles")
    .select("*")
    .in("id", [...new Set(stores.map((store) => store.vendor_id))]);
  const map = new Map((vendors ?? []).map((vendor) => [vendor.id, vendor]));

  return stores.map((store) => {
    const vendor = map.get(store.vendor_id);
    return {
      ...store,
      vendorName: vendor?.display_name ?? "Marketplace seller",
      vendorSlug: vendor?.slug ?? "",
      vendorLogo: vendor?.logo_url ?? null,
    };
  });
}

export async function listPublicStores(options: {
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<PublicStore[]> {
  const supabase = getPublicSupabaseClient();
  let query = supabase
    .from("stores")
    .select("*")
    .eq("status", "ACTIVE")
    .is("deleted_at", null);

  if (options.search) query = query.ilike("name", `%${options.search}%`);
  if (options.featured) query = query.eq("is_featured", true);

  const limit = Math.min(options.limit ?? 24, 100);
  const offset = options.offset ?? 0;
  const { data } = await query
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false })
    .range(offset, offset + limit - 1);

  return attachVendors((data ?? []) as StoreRow[]);
}

export async function getPublicStore(slug: string): Promise<{
  store: PublicStore;
  vendor: PublicVendorProfileRow | null;
} | null> {
  const supabase = getPublicSupabaseClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();
  if (!store) return null;

  const [withVendor] = await attachVendors([store as StoreRow]);
  const { data: vendor } = await supabase
    .from("public_vendor_profiles")
    .select("*")
    .eq("id", store.vendor_id)
    .maybeSingle();

  return { store: withVendor, vendor: vendor ?? null };
}

export async function getPublicStoreById(id: string): Promise<PublicStore | null> {
  const supabase = getPublicSupabaseClient();
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const [store] = await attachVendors([data as StoreRow]);
  return store ?? null;
}

export async function getPublicVendor(
  slug: string,
): Promise<{ vendor: PublicVendorProfileRow; stores: PublicStore[] } | null> {
  const supabase = getPublicSupabaseClient();
  const { data: vendor } = await supabase
    .from("public_vendor_profiles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!vendor) return null;

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("vendor_id", vendor.id)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("created_at");

  return { vendor, stores: await attachVendors((stores ?? []) as StoreRow[]) };
}

export async function getStoreProducts(storeId: string, limit = 60): Promise<ProductView[]> {
  return listProducts({ storeId, limit, sort: "newest" });
}

export type MarketplaceSearchResults = {
  products: ProductView[];
  stores: PublicStore[];
  vendors: PublicVendorProfileRow[];
};

export async function searchMarketplace(query: string): Promise<MarketplaceSearchResults> {
  const clean = query.trim();
  if (!clean) return { products: [], stores: [], vendors: [] };

  const supabase = getPublicSupabaseClient();
  const [products, stores, vendorRes] = await Promise.all([
    listProducts({ search: clean, limit: 36 }),
    listPublicStores({ search: clean, limit: 12 }),
    supabase
      .from("public_vendor_profiles")
      .select("*")
      .or(`display_name.ilike.%${clean}%,description.ilike.%${clean}%`)
      .order("rating", { ascending: false })
      .limit(12),
  ]);

  return {
    products,
    stores,
    vendors: (vendorRes.data ?? []) as PublicVendorProfileRow[],
  };
}

export async function getMarketplaceStats(): Promise<{
  vendors: number;
  stores: number;
  products: number;
  rating: number;
}> {
  const supabase = getPublicSupabaseClient();
  const [vendorCount, storeCount, productCount, ratingRows] = await Promise.all([
    supabase.from("public_vendor_profiles").select("*", { count: "exact", head: true }),
    supabase.from("stores").select("*", { count: "exact", head: true }).eq("status", "ACTIVE").is("deleted_at", null),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")
      .eq("approval_status", "APPROVED")
      .is("deleted_at", null),
    supabase
      .from("public_vendor_profiles")
      .select("rating, review_count")
      .gt("review_count", 0),
  ]);

  const ratings = ratingRows.data ?? [];
  const weighted = ratings.reduce(
    (accumulator, row) => {
      accumulator.total += toNumber(row.rating) * row.review_count;
      accumulator.count += row.review_count;
      return accumulator;
    },
    { total: 0, count: 0 },
  );

  return {
    vendors: vendorCount.count ?? 0,
    stores: storeCount.count ?? 0,
    products: productCount.count ?? 0,
    rating: weighted.count ? weighted.total / weighted.count : 0,
  };
}

export async function listStoresForVendorSlug(slug: string): Promise<PublicStore[]> {
  const vendor = await getPublicVendor(slug);
  return vendor?.stores ?? [];
}

export async function getStoreOrderAttribution(storeId: string | null): Promise<{
  store: PublicStore | null;
  vendor: PublicVendorProfileRow | null;
}> {
  if (!storeId) return { store: null, vendor: null };
  const supabase = getPublicSupabaseClient();
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return { store: null, vendor: null };
  const [withVendor] = await attachVendors([store as StoreRow]);
  const { data: vendor } = await supabase
    .from("public_vendor_profiles")
    .select("*")
    .eq("id", store.vendor_id)
    .maybeSingle();
  return { store: withVendor ?? null, vendor: vendor ?? null };
}

export async function listPublicStoreSlugs(limit = 100): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = getPublicSupabaseClient();
  return unwrapList(
    await supabase
      .from("stores")
      .select("slug, updated_at")
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .limit(limit),
  );
}
