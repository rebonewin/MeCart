import type { AssistantProduct } from "./types";

/**
 * The shape returned by the public catalogue select. Supabase may return the
 * joined relations as an object or a single-element array depending on the
 * generated relationship metadata, so the mapper accepts both.
 */
export type CatalogRelation<T> = T | T[] | null;

export type CatalogProductRow = {
  id: string;
  name: string;
  slug: string;
  final_price: number | string;
  original_price: number | string | null;
  description: string | null;
  material: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  rating: number | string | null;
  review_count: number | null;
  stock: number | null;
  best_seller: boolean | null;
  new_arrival: boolean | null;
  category_id: string;
  product_images: { url: string; position: number }[] | null;
  categories: CatalogRelation<{ name: string; slug: string }>;
  brands: CatalogRelation<{ name: string }>;
  sub_categories: CatalogRelation<{ name: string }>;
};

export type CatalogCategoryRow = {
  id: string;
  name: string;
  slug: string;
};

function relationOf<T>(value: CatalogRelation<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function imageOf(images: { url: string; position: number }[] | null) {
  return (
    [...(images ?? [])].sort((a, b) => a.position - b.position)[0]?.url ?? null
  );
}

export function toAssistantProduct(row: CatalogProductRow): AssistantProduct {
  const category = relationOf(row.categories);
  const brand = relationOf(row.brands);
  const subCategory = relationOf(row.sub_categories);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.final_price),
    originalPrice: Number(row.original_price ?? row.final_price),
    image: imageOf(row.product_images),
    brandName: brand?.name ?? "MeCart atelier",
    categoryName: category?.name ?? "Collection",
    categorySlug: category?.slug ?? "",
    subCategoryName: subCategory?.name ?? "",
    description: row.description ?? "",
    material: row.material ?? "",
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    stock: Number(row.stock ?? 0),
    bestSeller: Boolean(row.best_seller),
    newArrival: Boolean(row.new_arrival),
  };
}

export const CATALOG_PRODUCT_SELECT = [
  "id",
  "name",
  "slug",
  "final_price",
  "original_price",
  "description",
  "material",
  "colors",
  "sizes",
  "rating",
  "review_count",
  "stock",
  "best_seller",
  "new_arrival",
  "category_id",
  "product_images(url, position)",
  "categories(name, slug)",
  "brands(name)",
  "sub_categories(name)",
].join(", ");
