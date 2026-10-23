import "server-only";
import { unstable_cache } from "next/cache";
import { countProducts, listProducts, type ProductView } from "@/lib/repositories/products";
import { listCategoriesWithCounts } from "@/lib/repositories/categories";
import { listBrandsWithMeta, type BrandWithMeta } from "@/lib/repositories/brands";
import { listAllReviews } from "@/lib/repositories/reviews";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import type { StorefrontReview, StorefrontStats } from "@/types/product";

export type StorefrontHomeData = {
  featured: ProductView[];
  bestSellers: ProductView[];
  newArrivals: ProductView[];
  flashSale: ProductView[];
  recommended: ProductView[];
  /** Full live catalogue pool used by the recommendation and assistant layers. */
  catalog: ProductView[];
  categories: Awaited<ReturnType<typeof listCategoriesWithCounts>>;
  brands: BrandWithMeta[];
  reviews: StorefrontReview[];
  stats: StorefrontStats;
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function newestFirst(a: ProductView, b: ProductView) {
  return b.createdAt.localeCompare(a.createdAt);
}

async function loadStorefrontHomeData(): Promise<StorefrontHomeData> {
  // One catalogue read plus one set of category/brand/review queries. The home
  // experience derives every edit and rail from this single ranked pool rather
  // than issuing a separate product query for each section.
  const supabase = getPublicSupabaseClient();
  const [catalogue, categories, brands, allReviews, counts] = await Promise.all([
    listProducts({ sort: "rating", limit: 100 }, supabase),
    listCategoriesWithCounts(supabase),
    listBrandsWithMeta(supabase),
    listAllReviews("APPROVED", supabase),
    countProducts(supabase),
  ]);

  const poolUnique = dedupeById(catalogue);

  const featured = [
    ...(poolUnique.filter((product) => product.featured).length
      ? poolUnique.filter((product) => product.featured)
      : poolUnique),
  ]
    .sort(newestFirst)
    .slice(0, 8);

  const bestSellers = [
    ...(poolUnique.filter((product) => product.bestSeller).length
      ? poolUnique.filter((product) => product.bestSeller)
      : poolUnique),
  ]
    .sort(newestFirst)
    .slice(0, 8);

  const newArrivals = [
    ...(poolUnique.filter((product) => product.newArrival).length
      ? poolUnique.filter((product) => product.newArrival)
      : poolUnique),
  ]
    .sort(newestFirst)
    .slice(0, 8);

  const flashSale = poolUnique
    .filter((product) => product.discountPercent > 0)
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, 4);

  // Rule-based "intelligence" ranking over live catalogue signals:
  // rating, review velocity, recency and stock movement — no mocked data.
  const featuredIds = new Set(featured.map((product) => product.id));
  const scored = poolUnique
    .map((product) => ({
      product,
      score:
        product.rating * 20 +
        Math.min(product.reviewCount, 120) * 0.35 +
        (product.newArrival ? 7 : 0) +
        (product.discountPercent > 0 ? 5 : 0) +
        Math.min(product.stock, 60) * 0.06,
    }))
    .sort((a, b) => b.score - a.score);

  const recommended = [
    ...scored.filter((entry) => !featuredIds.has(entry.product.id)),
    ...scored.filter((entry) => featuredIds.has(entry.product.id)),
  ]
    .slice(0, 4)
    .map((entry) => entry.product);

  const rated = poolUnique.filter((product) => product.rating > 0);
  const stats: StorefrontStats = {
    products: counts.active,
    categories: categories.filter((category) => category.productCount > 0).length,
    brands: brands.length,
    rating: rated.length
      ? rated.reduce((sum, product) => sum + product.rating, 0) / rated.length
      : 0,
  };

  const reviews: StorefrontReview[] = allReviews
    .slice()
    .sort((a, b) => b.rating - a.rating || b.created_at.localeCompare(a.created_at))
    .slice(0, 9)
    .map((review) => ({
      id: review.id,
      author: review.author,
      rating: review.rating,
      title: review.title,
      body: review.body,
      productName: review.productName,
      createdAt: review.created_at,
    }));

  return {
    featured,
    bestSellers,
    newArrivals,
    flashSale,
    recommended,
    catalog: poolUnique,
    categories,
    brands,
    reviews,
    stats,
  };
}

/**
 * The home page is merchandised from live inventory, but a small read-through
 * window keeps first paint from paying for every upstream round-trip. Admin
 * writes can invalidate the `storefront:home` tag immediately.
 */
export const getStorefrontHomeData = unstable_cache(loadStorefrontHomeData, ["storefront-home-v3"], {
  revalidate: 30,
  tags: ["storefront:home"],
});

export async function getCategoryPageData(slug: string) {
  const [products, categories] = await Promise.all([
    listProducts({ categorySlug: slug, limit: 100 }),
    listCategoriesWithCounts(),
  ]);
  return { products, categories, category: categories.find((c) => c.slug === slug) ?? null };
}

export async function getStorefrontSearchData(query: string) {
  return listProducts({ search: query, limit: 60 });
}
