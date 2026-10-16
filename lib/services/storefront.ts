import "server-only";
import { countProducts, listProducts, type ProductView } from "@/lib/repositories/products";
import { listCategoriesWithCounts } from "@/lib/repositories/categories";
import { listBrandsWithMeta, type BrandWithMeta } from "@/lib/repositories/brands";
import { listAllReviews } from "@/lib/repositories/reviews";
import type { StorefrontReview, StorefrontStats } from "@/types/product";

export type StorefrontHomeData = {
  featured: ProductView[];
  bestSellers: ProductView[];
  newArrivals: ProductView[];
  flashSale: ProductView[];
  recommended: ProductView[];
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

export async function getStorefrontHomeData(): Promise<StorefrontHomeData> {
  const [featuredRaw, bestSellersRaw, newArrivalsRaw, categories, brands, pool, allReviews, counts] =
    await Promise.all([
      listProducts({ featured: true, limit: 8 }),
      listProducts({ bestSeller: true, limit: 8 }),
      listProducts({ newArrival: true, limit: 8 }),
      listCategoriesWithCounts(),
      listBrandsWithMeta(),
      listProducts({ sort: "rating", limit: 36 }),
      listAllReviews("APPROVED"),
      countProducts(),
    ]);

  const poolUnique = dedupeById(pool);
  const featured = dedupeById(featuredRaw.length ? featuredRaw : poolUnique).slice(0, 8);
  const bestSellers = dedupeById(bestSellersRaw.length ? bestSellersRaw : poolUnique).slice(0, 8);
  const newArrivals = dedupeById(newArrivalsRaw.length ? newArrivalsRaw : poolUnique).slice(0, 8);

  const flashSale = dedupeById([...bestSellersRaw, ...poolUnique])
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
    categories: categories.length,
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
    categories,
    brands,
    reviews,
    stats,
  };
}

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
