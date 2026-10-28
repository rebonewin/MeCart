"use client";

import { getSupabase } from "@/lib/supabase/browser";
import {
  CATALOG_PRODUCT_SELECT,
  toAssistantProduct,
  type CatalogProductRow,
} from "@/lib/ai/catalog-types";
import type {
  AssistantCatalogPayload,
  AssistantProduct,
} from "@/lib/ai/types";
import type { VisualCandidate } from "@/lib/ai/visual-search";

const CLIENT_CACHE_TTL_MS = 45_000;

let catalogCache:
  | { data: AssistantCatalogPayload; expiresAt: number }
  | null = null;
let catalogInFlight: Promise<AssistantCatalogPayload> | null = null;

async function fetchCatalogRows(): Promise<CatalogProductRow[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("rating", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CatalogProductRow[];
}

/**
 * Catalogue for the assistant, fetched once per browser session window.
 *
 * The endpoint is server-cached, so opening the chat does not query Supabase
 * directly from every client and the hosted chat route reuses the same
 * snapshot on warm instances.
 */
export async function fetchAssistantCatalog(): Promise<AssistantCatalogPayload> {
  const now = Date.now();
  if (catalogCache && now < catalogCache.expiresAt) return catalogCache.data;
  if (catalogInFlight) return catalogInFlight;

  catalogInFlight = fetch("/api/ai/catalog", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("The atelier catalogue is unavailable.");
      }
      const payload = (await response.json()) as AssistantCatalogPayload;
      if (!Array.isArray(payload.products) || !Array.isArray(payload.categories)) {
        throw new Error("The atelier catalogue response was invalid.");
      }
      catalogCache = {
        data: payload,
        expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
      };
      return payload;
    })
    .finally(() => {
      catalogInFlight = null;
    });

  return catalogInFlight;
}

export async function fetchVisualCandidates(): Promise<VisualCandidate[]> {
  const rows = await fetchCatalogRows();
  return rows.map((row) => {
    const product: AssistantProduct = toAssistantProduct(row);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      categoryName: product.categoryName,
      brandName: product.brandName,
      subCategoryName: product.subCategoryName,
      colors: product.colors,
      rating: product.rating,
      reviewCount: product.reviewCount,
    };
  });
}
