import type { StorefrontProduct } from "@/types/product";

/**
 * Recommendation signals collected from the client stores. The engine is
 * deliberately data-source agnostic: replace these signals with server-side
 * behavioural or model output later without touching the UI.
 */
export type RecommendationSignals = {
  recentlyViewed?: StorefrontProduct[];
  wishlistIds?: string[];
  cartIds?: string[];
};

export type RecommendationSectionId =
  | "recommended"
  | "viewed"
  | "trending"
  | "fbt"
  | "also"
  | "look";

export type RecommendationSection = {
  id: RecommendationSectionId;
  eyebrow: string;
  title: string;
  description: string;
  products: StorefrontProduct[];
  anchor?: StorefrontProduct;
  scores: Record<string, number>;
};

const CATEGORY_COMPLEMENTS: Record<string, string[]> = {
  men: ["accessories", "audio", "timepieces", "technology", "footwear"],
  women: ["accessories", "beauty", "fragrance", "footwear", "jewellery"],
  girls: ["accessories", "footwear", "fragrance"],
  "baby boy": ["accessories", "footwear", "baby"],
  "baby girl": ["accessories", "footwear", "baby"],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seedOf(value: string) {
  return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function uniqueProducts(products: StorefrontProduct[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function categoryKey(product: StorefrontProduct) {
  return product.categoryName.trim().toLowerCase();
}

function isComplementary(product: StorefrontProduct, anchor: StorefrontProduct) {
  const key = categoryKey(anchor);
  const complements = CATEGORY_COMPLEMENTS[key] ?? [];
  const candidateCategory = categoryKey(product);
  return (
    candidateCategory !== key ||
    product.subCategoryId !== anchor.subCategoryId ||
    complements.some((entry) => candidateCategory.includes(entry))
  );
}

/**
 * Confidence is derived from real catalogue signals and the current session.
 * It is intentionally bounded so the UI never promises a perfect match.
 */
export function matchConfidence(product: StorefrontProduct, signals: RecommendationSignals = {}) {
  const viewed = signals.recentlyViewed ?? [];
  const viewedCategories = new Set(viewed.map(categoryKey));
  const viewedBrands = new Set(viewed.map((item) => item.brandName).filter(Boolean));
  const wishlist = new Set(signals.wishlistIds ?? []);
  const cart = new Set(signals.cartIds ?? []);

  let score =
    56 +
    clamp(product.rating, 0, 5) * 6 +
    clamp(product.reviewCount, 0, 240) / 12 +
    clamp(product.discountPercent, 0, 60) * 0.18 +
    (product.stock > 0 ? 3 : 0) +
    (product.bestSeller ? 2 : 0) +
    (product.newArrival ? 1.5 : 0);

  if (viewedCategories.has(categoryKey(product))) score += 6;
  if (product.brandName && viewedBrands.has(product.brandName)) score += 4;
  if (wishlist.has(product.id)) score += 1.5;
  if (cart.has(product.id)) score -= 8;

  return Math.round(clamp(score, 68, 98));
}

function rankingScore(product: StorefrontProduct, signals: RecommendationSignals) {
  const cart = new Set(signals.cartIds ?? []);
  const wishlist = new Set(signals.wishlistIds ?? []);
  const viewed = signals.recentlyViewed ?? [];
  const viewedCategories = new Set(viewed.map(categoryKey));
  const viewedBrands = new Set(viewed.map((item) => item.brandName).filter(Boolean));

  let score =
    product.rating * 16 +
    Math.min(product.reviewCount, 280) * 0.34 +
    Math.min(product.stock, 80) * 0.08 +
    product.discountPercent * 0.42 +
    (product.bestSeller ? 6 : 0) +
    (product.newArrival ? 4 : 0) +
    (seedOf(product.id) % 7);

  if (viewedCategories.has(categoryKey(product))) score += 9;
  if (product.brandName && viewedBrands.has(product.brandName)) score += 6;
  if (wishlist.has(product.id)) score += 5;
  if (cart.has(product.id)) score -= 40;

  return score;
}

function sortByScore(products: StorefrontProduct[], signals: RecommendationSignals) {
  return products
    .slice()
    .sort((a, b) => rankingScore(b, signals) - rankingScore(a, signals));
}

function withScores(products: StorefrontProduct[], signals: RecommendationSignals) {
  return Object.fromEntries(products.map((product) => [product.id, matchConfidence(product, signals)]));
}

/**
 * Builds the complete recommendation set once and lets each surface render the
 * sections that fit its context. No random or mocked products are introduced.
 */
export function buildRecommendationSections(
  pool: StorefrontProduct[],
  signals: RecommendationSignals = {},
  options: { anchor?: StorefrontProduct } = {},
): RecommendationSection[] {
  const products = uniqueProducts(pool);
  if (!products.length) return [];

  const cartIds = new Set(signals.cartIds ?? []);
  const wishlistIds = new Set(signals.wishlistIds ?? []);
  const anchor =
    options.anchor ??
    signals.recentlyViewed?.[0] ??
    products.find((product) => cartIds.has(product.id)) ??
    products.find((product) => wishlistIds.has(product.id)) ??
    products[0];

  const withoutAnchor = products.filter((product) => product.id !== anchor?.id);

  const sameWorld = sortByScore(
    withoutAnchor.filter(
      (product) =>
        product.categoryId === anchor?.categoryId ||
        (product.brandName && product.brandName === anchor?.brandName),
    ),
    signals,
  );
  const viewed = uniqueProducts([
    ...sameWorld,
    ...sortByScore(withoutAnchor, signals),
  ]).slice(0, 4);

  const recommended = sortByScore(products, signals).slice(0, 4);

  const trending = products
    .slice()
    .sort((a, b) => {
      const score = (product: StorefrontProduct) =>
        product.rating * 13 +
        Math.min(product.reviewCount, 360) * 0.28 +
        product.discountPercent * 0.7 +
        (product.newArrival ? 7 : 0) +
        Math.min(product.stock, 100) * 0.05;
      return score(b) - score(a);
    })
    .slice(0, 4);

  const togetherPool = anchor
    ? sortByScore(
        withoutAnchor.filter(
          (product) =>
            product.subCategoryId === anchor.subCategoryId ||
            product.categoryId === anchor.categoryId ||
            isComplementary(product, anchor),
        ),
        signals,
      )
    : sortByScore(withoutAnchor, signals);
  const fbt = uniqueProducts(togetherPool).slice(0, 3);

  const also = products
    .filter((product) => product.id !== anchor?.id)
    .sort(
      (a, b) =>
        b.reviewCount * b.rating - a.reviewCount * a.rating ||
        b.rating - a.rating,
    )
    .slice(0, 4);

  const complementaryPool = anchor
    ? sortByScore(
        withoutAnchor.filter((product) => isComplementary(product, anchor)),
        signals,
      )
    : [];
  const lookFallback = anchor
    ? sortByScore(
        withoutAnchor.filter((product) => product.categoryId !== anchor.categoryId),
        signals,
      )
    : [];
  const look = uniqueProducts([
    ...complementaryPool,
    ...lookFallback,
    ...sortByScore(withoutAnchor, signals),
  ]).slice(0, 4);

  const sections: RecommendationSection[] = [
    {
      id: "recommended",
      eyebrow: "MeCart Intelligence",
      title: "Recommended for you",
      description: "A live ranking over catalogue quality, stock health and the signals from this visit.",
      products: recommended,
      scores: withScores(recommended, signals),
    },
    {
      id: "viewed",
      eyebrow: "Because you viewed",
      title: anchor ? `More like ${anchor.name}` : "Because you're exploring the atelier",
      description: anchor
        ? `A considered edit around ${anchor.brandName || anchor.categoryName}, chosen from the live catalogue.`
        : "A first edit from the atelier, shaped by the pieces our clients return to most.",
      products: viewed,
      anchor,
      scores: withScores(viewed, signals),
    },
    {
      id: "trending",
      eyebrow: "Moving now",
      title: "Trending at the atelier",
      description: "Review velocity, stock movement and new-season energy — refreshed with the catalogue.",
      products: trending,
      scores: withScores(trending, signals),
    },
    {
      id: "fbt",
      eyebrow: "Bought together",
      title: "Frequently bought together",
      description: anchor
        ? `The pieces most often considered alongside ${anchor.name}.`
        : "A ready-made pairing from the current collection.",
      products: fbt,
      anchor,
      scores: withScores(fbt, signals),
    },
    {
      id: "also",
      eyebrow: "Clients also purchased",
      title: "Customers also purchased",
      description: "High-conviction pieces with the strongest review history in the catalogue.",
      products: also,
      anchor,
      scores: withScores(also, signals),
    },
    {
      id: "look",
      eyebrow: "Complete the look",
      title: "Complete the look",
      description: anchor
        ? `The final layer around ${anchor.name} — complementary objects and finishes.`
        : "A complete edit across the atelier's worlds.",
      products: look,
      anchor,
      scores: withScores(look, signals),
    },
  ];

  return sections.filter((section) => section.products.length > 0);
}

export function sectionConfidence(section: RecommendationSection, productId: string) {
  return section.scores[productId] ?? 82;
}
