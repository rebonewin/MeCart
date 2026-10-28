import "server-only";

import { getPublicSupabaseClient } from "@/lib/supabase/public";
import {
  CATALOG_PRODUCT_SELECT,
  toAssistantProduct,
  type CatalogCategoryRow,
  type CatalogProductRow,
} from "@/lib/ai/catalog-types";
import type {
  AssistantCatalog,
  AssistantCategory,
} from "@/lib/ai/types";

const PRODUCT_LIMIT = 120;
const CACHE_TTL_MS = process.env.NODE_ENV === "development" ? 10_000 : 60_000;

type CatalogCache = {
  data: AssistantCatalog;
  expiresAt: number;
};

let cache: CatalogCache | null = null;
let inFlight: Promise<AssistantCatalog> | null = null;

async function loadCatalog(): Promise<AssistantCatalog> {
  const supabase = getPublicSupabaseClient();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(CATALOG_PRODUCT_SELECT)
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(PRODUCT_LIMIT),
    supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error("The assistant catalogue could not be loaded.");
  }
  if (categoriesResult.error) {
    throw new Error("The assistant categories could not be loaded.");
  }

  const rows = (productsResult.data ?? []) as unknown as CatalogProductRow[];
  const products = rows.map(toAssistantProduct);

  const categories = ((categoriesResult.data ?? []) as CatalogCategoryRow[]).map<
    AssistantCategory
  >((category) => ({
    ...category,
    productCount: products.filter(
      (product) => product.categorySlug === category.slug,
    ).length,
  }));

  return { products, categories };
}

/**
 * Cached live catalogue for MECO.
 *
 * The cache is intentionally short-lived and per server instance: product
 * edits and stock changes should surface quickly, while bursty conversations
 * should not hit Supabase on every token. If a refresh fails, the last good
 * snapshot is served rather than breaking the conversation.
 */
export async function getAssistantCatalog(): Promise<AssistantCatalog> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) return cache.data;
  if (inFlight) return inFlight;

  inFlight = loadCatalog()
    .then((data) => {
      cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    })
    .catch((error: unknown) => {
      if (cache) return cache.data;
      throw error;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
