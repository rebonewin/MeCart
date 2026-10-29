import type {
  AssistantCatalog,
  AssistantCategory,
  AssistantProduct,
} from "./types";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "looking", "want",
  "need", "some", "something", "please", "show", "find", "about", "into", "your",
  "you", "can", "could", "would", "help", "me", "my", "a", "an", "to", "of", "in",
  "on", "is", "are", "best", "good", "nice", "new", "under", "below", "over",
  "above", "less", "than", "more", "max", "maximum", "budget", "of", "i", "im",
  "i'm", "we", "our", "us", "it", "its", "do", "does", "what", "which", "who",
  "how", "when", "where", "why", "any", "anything", "all", "up", "out", "at",
  "by", "be", "been", "being",
]);

/** Lowercase, strip punctuation and collapse whitespace for loose matching. */
export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstName(name?: string | null) {
  const clean = name?.trim();
  if (!clean) return null;
  return clean.split(/\s+/)[0] ?? null;
}

function tokensOf(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function productText(product: AssistantProduct) {
  return normalize(
    [
      product.name,
      product.brandName,
      product.categoryName,
      product.categorySlug,
      product.subCategoryName,
      product.description,
      product.material,
      ...product.colors,
      ...product.sizes,
    ].join(" "),
  );
}

function parseMoney(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Extract an explicit price ceiling/floor from a shopper message.
 * Handles "under $1,500", "up to 500", "within $500" and "between X and Y".
 */
export function priceLimit(message: string) {
  const range = message.match(
    /\bbetween\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*([\d,]+(?:\.\d+)?)/i,
  );
  if (range) {
    const first = parseMoney(range[1]);
    const second = parseMoney(range[2]);
    if (first !== undefined && second !== undefined) {
      return { max: Math.max(first, second), min: Math.min(first, second) };
    }
  }

  const under = message.match(
    /(?:under|below|less than|up to|within|max(?:imum)?|budget(?: of)?)\s*\$?\s*([\d,]+(?:\.\d+)?)/i,
  );
  const over = message.match(
    /(?:over|above|more than|from)\s*\$?\s*([\d,]+(?:\.\d+)?)/i,
  );
  return {
    max: parseMoney(under?.[1]),
    min: parseMoney(over?.[1]),
  };
}

export type MatchProductsOptions = {
  limit?: number;
  categorySlug?: string;
};

/**
 * Rank live catalogue products against a shopper's message.
 *
 * The ranker is intentionally lexical: it never invents a product and it
 * returns an empty list when the query has words that match nothing. Callers
 * that want a curated fallback should use `topProducts`.
 */
export function matchProducts(
  message: string,
  catalog: AssistantCatalog,
  options: MatchProductsOptions = {},
) {
  const queryTokens = tokensOf(message);
  const normalized = normalize(message);
  const limits = priceLimit(message);
  const categoryHit = catalog.categories.find(
    (category) =>
      normalized.includes(normalize(category.name)) ||
      normalized.includes(normalize(category.slug)),
  );
  const categorySlug = options.categorySlug ?? categoryHit?.slug;
  const hasFilter = Boolean(categorySlug || limits.max !== undefined || limits.min !== undefined);

  const scored = catalog.products
    .filter((product) => !limits.max || product.price <= limits.max)
    .filter((product) => !limits.min || product.price >= limits.min)
    .filter(
      (product) =>
        !categorySlug ||
        product.categorySlug === categorySlug ||
        normalize(product.categoryName) === normalize(categoryHit?.name ?? ""),
    )
    .map((product) => {
      const text = productText(product);
      let lexical = 0;

      for (const token of queryTokens) {
        if (text.includes(token)) lexical += 12;
      }
      if (normalized.includes(normalize(product.name))) lexical += 30;
      if (product.brandName && normalized.includes(normalize(product.brandName))) {
        lexical += 18;
      }
      if (
        product.categoryName &&
        normalized.includes(normalize(product.categoryName))
      ) {
        lexical += 10;
      }
      if (
        product.subCategoryName &&
        normalized.includes(normalize(product.subCategoryName))
      ) {
        lexical += 8;
      }
      for (const color of product.colors) {
        if (normalized.includes(normalize(color))) lexical += 10;
      }

      const base =
        product.rating * 7 +
        Math.min(product.reviewCount, 200) * 0.12 +
        (product.bestSeller ? 4 : 0) +
        (product.newArrival ? 2 : 0) +
        (product.stock > 0 ? 1 : 0);

      return { product, lexical, score: base + lexical };
    })
    .filter((entry) => {
      if (queryTokens.length === 0 || hasFilter) return true;
      return entry.lexical > 0;
    })
    .sort((a, b) => b.score - a.score);

  return scored
    .slice(0, options.limit ?? 4)
    .map((entry) => entry.product);
}

export function categorySuggestions(catalog: AssistantCatalog, limit = 4) {
  return catalog.categories
    .filter((category) => category.productCount > 0)
    .slice()
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);
}

export function topProducts(catalog: AssistantCatalog, limit = 4) {
  return catalog.products
    .slice()
    .sort((a, b) => {
      const score = (product: AssistantProduct) =>
        product.rating * 20 +
        Math.min(product.reviewCount, 200) * 0.25 +
        (product.bestSeller ? 8 : 0) +
        (product.newArrival ? 4 : 0) +
        (product.stock > 0 ? 4 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);
}

/**
 * Find catalogue pieces the model actually named. This is what keeps product
 * cards aligned with the written answer instead of showing unrelated picks.
 */
export function mentionedProducts(
  text: string,
  catalog: AssistantCatalog,
  limit = 4,
) {
  const normalizedText = normalize(text);
  if (!normalizedText) return [] as AssistantProduct[];
  const textTokens = new Set(tokensOf(text));

  return catalog.products
    .map((product) => {
      const name = normalize(product.name);
      if (!name) return { product, score: 0 };

      if (normalizedText.includes(name)) {
        return { product, score: 100 };
      }

      const nameTokens = tokensOf(product.name);
      if (!nameTokens.length) return { product, score: 0 };
      const hits = nameTokens.filter((token) => textTokens.has(token)).length;
      const coverage = hits / nameTokens.length;

      if (hits >= 2 && coverage >= 0.6) {
        return { product, score: 40 + coverage * 30 };
      }

      return { product, score: 0 };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

export function dedupeProducts(products: (AssistantProduct | undefined)[]) {
  const seen = new Set<string>();
  const result: AssistantProduct[] = [];
  for (const product of products) {
    if (!product || seen.has(product.id)) continue;
    seen.add(product.id);
    result.push(product);
  }
  return result;
}

export function dedupeCategories(categories: (AssistantCategory | undefined)[]) {
  const seen = new Set<string>();
  const result: AssistantCategory[] = [];
  for (const category of categories) {
    if (!category || seen.has(category.id)) continue;
    seen.add(category.id);
    result.push(category);
  }
  return result;
}
