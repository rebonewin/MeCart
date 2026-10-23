import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrap, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProductRow, ProductStatus } from "@/types/database";
import type { Product } from "@/types/product";

type Supabase = SupabaseClient<Database>;

export type ProductView = Product & {
  status: ProductStatus;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  category_id: string;
  sub_category_id: string | null;
  brand_id: string | null;
  vendorId: string | null;
  storeId: string | null;
  storeName?: string;
  storeSlug?: string;
};

export type ProductQuery = {
  search?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating" | "popular";
  limit?: number;
  offset?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  vendorId?: string;
  storeId?: string;
};

type LookupData = {
  categories: Map<string, { name: string; slug: string }>;
  subCategories: Map<string, { name: string; slug: string }>;
  brands: Map<string, { name: string; slug: string }>;
  images: Map<string, string[]>;
};

async function loadLookups(productIds: string[], supabase: Supabase): Promise<LookupData> {
  const [categoriesRes, subCategoriesRes, brandsRes, imagesRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug"),
    supabase.from("sub_categories").select("id, name, slug"),
    supabase.from("brands").select("id, name, slug"),
    productIds.length
      ? supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", productIds)
          .order("position")
      : Promise.resolve({ data: [] as { product_id: string; url: string; position: number }[], error: null }),
  ]);

  const images = new Map<string, string[]>();
  for (const img of imagesRes.data ?? []) {
    const list = images.get(img.product_id) ?? [];
    list.push(img.url);
    images.set(img.product_id, list);
  }

  return {
    categories: new Map((categoriesRes.data ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }])),
    subCategories: new Map((subCategoriesRes.data ?? []).map((c) => [c.id, { name: c.name, slug: c.slug }])),
    brands: new Map((brandsRes.data ?? []).map((b) => [b.id, { name: b.name, slug: b.slug }])),
    images,
  };
}

export function toProductView(row: ProductRow, lookups: LookupData): ProductView {
  const category = lookups.categories.get(row.category_id);
  const subCategory = row.sub_category_id ? lookups.subCategories.get(row.sub_category_id) : undefined;
  const brand = row.brand_id ? lookups.brands.get(row.brand_id) : undefined;
  const images = lookups.images.get(row.id) ?? [];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    material: row.material ?? "",
    country: row.country ?? "",
    weight: toNumber(row.weight),
    stock: row.stock,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    rating: toNumber(row.rating),
    reviewCount: row.review_count,
    originalPrice: toNumber(row.original_price),
    discountPercent: row.discount_percent,
    finalPrice: toNumber(row.final_price),
    categoryId: row.category_id,
    categorySlug: category?.slug ?? "",
    categoryName: category?.name ?? "",
    subCategoryId: row.sub_category_id ?? "",
    subCategorySlug: subCategory?.slug ?? "",
    subCategoryName: subCategory?.name ?? "",
    brandId: row.brand_id ?? "",
    brandName: brand?.name ?? "",
    coverImage: images[0] ?? "",
    images,
    createdAt: row.created_at,
    status: row.status,
    featured: row.featured,
    bestSeller: row.best_seller,
    newArrival: row.new_arrival,
    category_id: row.category_id,
    sub_category_id: row.sub_category_id,
    brand_id: row.brand_id,
    vendorId: row.vendor_id,
    storeId: row.store_id,
  };
}

async function queryProducts(
  query: ProductQuery,
  includeInactive = false,
  injected?: Supabase,
): Promise<{ rows: ProductRow[]; lookups: LookupData }> {
  const supabase = injected ?? (await createClient());

  let categoryId: string | undefined;
  let subCategoryId: string | undefined;
  let brandId: string | undefined;

  if (query.categorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", query.categorySlug)
      .maybeSingle();
    if (!data) return { rows: [] as ProductRow[], lookups: await loadLookups([], supabase) };
    categoryId = data.id;
  }

  if (query.subCategorySlug && categoryId) {
    const { data } = await supabase
      .from("sub_categories")
      .select("id")
      .eq("slug", query.subCategorySlug)
      .eq("category_id", categoryId)
      .maybeSingle();
    if (!data) return { rows: [] as ProductRow[], lookups: await loadLookups([], supabase) };
    subCategoryId = data.id;
  }

  if (query.brandSlug) {
    const { data } = await supabase.from("brands").select("id").eq("slug", query.brandSlug).maybeSingle();
    if (!data) return { rows: [] as ProductRow[], lookups: await loadLookups([], supabase) };
    brandId = data.id;
  }

  let builder = supabase.from("products").select("*").is("deleted_at", null);

  if (!includeInactive) builder = builder.eq("status", "ACTIVE");
  if (categoryId) builder = builder.eq("category_id", categoryId);
  if (subCategoryId) builder = builder.eq("sub_category_id", subCategoryId);
  if (brandId) builder = builder.eq("brand_id", brandId);
  if (query.featured) builder = builder.eq("featured", true);
  if (query.bestSeller) builder = builder.eq("best_seller", true);
  if (query.newArrival) builder = builder.eq("new_arrival", true);
  if (query.vendorId) builder = builder.eq("vendor_id", query.vendorId);
  if (query.storeId) builder = builder.eq("store_id", query.storeId);
  if (query.minPrice !== undefined) builder = builder.gte("final_price", query.minPrice);
  if (query.maxPrice !== undefined) builder = builder.lte("final_price", query.maxPrice);
  if (query.search) builder = builder.ilike("name", `%${query.search}%`);

  switch (query.sort) {
    case "price-asc":
      builder = builder.order("final_price", { ascending: true });
      break;
    case "price-desc":
      builder = builder.order("final_price", { ascending: false });
      break;
    case "rating":
      builder = builder.order("rating", { ascending: false });
      break;
    case "popular":
      builder = builder.order("review_count", { ascending: false });
      break;
    default:
      builder = builder.order("created_at", { ascending: false });
  }

  const limit = query.limit ?? 60;
  const offset = query.offset ?? 0;
  builder = builder.range(offset, offset + limit - 1);

  const rows = unwrapList(await builder);
  const lookups = await loadLookups(rows.map((r) => r.id), supabase);
  return { rows, lookups };
}

export async function listProducts(query: ProductQuery = {}, supabase?: Supabase): Promise<ProductView[]> {
  const { rows, lookups } = await queryProducts(query, false, supabase);
  return rows.map((row) => toProductView(row, lookups));
}

export async function listProductsForAdmin(query: ProductQuery = {}): Promise<ProductView[]> {
  const { rows, lookups } = await queryProducts({ sort: "newest", limit: 500, ...query }, true);
  return rows.map((row) => toProductView(row, lookups));
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const lookups = await loadLookups([data.id], supabase);
  const view = toProductView(data, lookups);
  if (data.store_id) {
    const { data: store } = await supabase
      .from("stores")
      .select("name, slug")
      .eq("id", data.store_id)
      .maybeSingle();
    if (store) {
      view.storeName = store.name;
      view.storeSlug = store.slug;
    }
  }
  return view;
}

export async function getProductById(id: string): Promise<ProductView | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const lookups = await loadLookups([data.id], supabase);
  return toProductView(data, lookups);
}

export async function getRelatedProducts(product: ProductView, limit = 4): Promise<ProductView[]> {
  const supabase = await createClient();
  const rows = unwrapList(
    await supabase
      .from("products")
      .select("*")
      .eq("category_id", product.categoryId)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .neq("id", product.id)
      .limit(limit),
  );
  const lookups = await loadLookups(rows.map((r) => r.id), supabase);
  return rows.map((row) => toProductView(row, lookups));
}

export type ProductInput = {
  name: string;
  sku: string;
  description: string;
  material?: string | null;
  country?: string | null;
  weight?: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  status: ProductStatus;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  categoryId: string;
  subCategoryId?: string | null;
  brandId?: string | null;
  images: string[];
};

export async function createProduct(input: ProductInput): Promise<string> {
  const supabase = await createClient();
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;

  const row = unwrap(
    await supabase
      .from("products")
      .insert({
        name: input.name,
        slug,
        sku: input.sku,
        description: input.description,
        material: input.material ?? null,
        country: input.country ?? null,
        weight: input.weight ?? null,
        stock: input.stock,
        sizes: input.sizes,
        colors: input.colors,
        original_price: input.originalPrice,
        discount_percent: input.discountPercent,
        final_price: input.finalPrice,
        status: input.status,
        featured: input.featured,
        best_seller: input.bestSeller,
        new_arrival: input.newArrival,
        category_id: input.categoryId,
        sub_category_id: input.subCategoryId ?? null,
        brand_id: input.brandId ?? null,
      })
      .select("*")
      .single(),
  );

  if (input.images.length) {
    unwrapVoid(
      await supabase.from("product_images").insert(
        input.images.map((url, index) => ({ product_id: row.id, url, position: index })),
      ),
    );
  }

  return row.id;
}

export async function updateProduct(id: string, input: ProductInput) {
  const supabase = await createClient();

  unwrapVoid(
    await supabase
      .from("products")
      .update({
        name: input.name,
        sku: input.sku,
        description: input.description,
        material: input.material ?? null,
        country: input.country ?? null,
        weight: input.weight ?? null,
        stock: input.stock,
        sizes: input.sizes,
        colors: input.colors,
        original_price: input.originalPrice,
        discount_percent: input.discountPercent,
        final_price: input.finalPrice,
        status: input.status,
        featured: input.featured,
        best_seller: input.bestSeller,
        new_arrival: input.newArrival,
        category_id: input.categoryId,
        sub_category_id: input.subCategoryId ?? null,
        brand_id: input.brandId ?? null,
      })
      .eq("id", id),
  );

  unwrapVoid(await supabase.from("product_images").delete().eq("product_id", id));
  if (input.images.length) {
    unwrapVoid(
      await supabase.from("product_images").insert(
        input.images.map((url, index) => ({ product_id: id, url, position: index })),
      ),
    );
  }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}

export async function restoreProduct(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("products").update({ deleted_at: null }).eq("id", id));
}

export async function bulkDeleteProducts(ids: string[]) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase.from("products").update({ deleted_at: new Date().toISOString() }).in("id", ids),
  );
}

export async function bulkUpdateProducts(
  ids: string[],
  patch: { status?: ProductStatus; featured?: boolean; best_seller?: boolean; new_arrival?: boolean },
) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("products").update(patch).in("id", ids));
}

export async function adjustStock(id: string, delta: number, reason = "adjustment", reference?: string) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("stock, name")
    .eq("id", id)
    .maybeSingle();
  if (!product) throw new Error("Product not found");

  const next = Math.max(0, product.stock + delta);

  unwrapVoid(await supabase.from("products").update({ stock: next }).eq("id", id));

  // keep the inventory row in sync (trigger syncs products.stock from inventory)
  const { data: inventory } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", id)
    .is("variant_id", null)
    .maybeSingle();

  if (inventory) {
    unwrapVoid(await supabase.from("inventory").update({ quantity: next }).eq("id", inventory.id));
  } else {
    unwrapVoid(await supabase.from("inventory").insert({ product_id: id, quantity: next }));
  }

  const { data: currentInventory } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", id)
    .is("variant_id", null)
    .maybeSingle();

  unwrapVoid(
    await supabase.from("inventory_logs").insert({
      inventory_id: currentInventory?.id ?? null,
      product_id: id,
      change: delta,
      quantity_after: next,
      reason,
      reference: reference ?? null,
    }),
  );
}

export async function countProducts(supabase?: Supabase): Promise<{ total: number; active: number; lowStock: number; drafts: number }> {
  const client = supabase ?? (await createClient());
  const rows = unwrapList(
    await client.from("products").select("status, stock").is("deleted_at", null),
  );
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "ACTIVE").length,
    lowStock: rows.filter((r) => r.stock <= 10).length,
    drafts: rows.filter((r) => r.status !== "ACTIVE").length,
  };
}
