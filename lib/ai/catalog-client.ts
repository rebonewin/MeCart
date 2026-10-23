"use client";

import { getSupabase } from "@/lib/supabase/browser";
import type {
  AssistantCatalog,
  AssistantCategory,
  AssistantProduct,
} from "@/lib/ai/assistant";
import type { VisualCandidate } from "@/lib/ai/visual-search";

type CatalogRow = {
  id: string;
  name: string;
  slug: string;
  final_price: number | string;
  original_price: number | string | null;
  description: string | null;
  material: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  rating: number | null;
  review_count: number | null;
  stock: number | null;
  best_seller: boolean | null;
  new_arrival: boolean | null;
  category_id: string;
  product_images: { url: string; position: number }[] | null;
  categories: { name: string; slug: string } | null;
  brands: { name: string } | null;
  sub_categories: { name: string } | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

function imageOf(images: { url: string; position: number }[] | null) {
  return [...(images ?? [])].sort((a, b) => a.position - b.position)[0]?.url ?? null;
}

async function fetchCatalogRows(): Promise<CatalogRow[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, final_price, original_price, description, material, colors, sizes, rating, review_count, stock, best_seller, new_arrival, category_id, product_images(url, position), categories(name, slug), brands(name), sub_categories(name)",
    )
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("rating", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CatalogRow[];
}

function toAssistantProduct(row: CatalogRow): AssistantProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: Number(row.final_price),
    originalPrice: Number(row.original_price ?? row.final_price),
    image: imageOf(row.product_images),
    brandName: row.brands?.name ?? "MeCart atelier",
    categoryName: row.categories?.name ?? "Collection",
    subCategoryName: row.sub_categories?.name ?? "",
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

export async function fetchAssistantCatalog(): Promise<AssistantCatalog> {
  const supabase = await getSupabase();
  const [rows, categoriesResult] = await Promise.all([
    fetchCatalogRows(),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  const products = rows.map(toAssistantProduct);
  const categories = ((categoriesResult.data ?? []) as CategoryRow[]).map<AssistantCategory>(
    (category) => ({
      ...category,
      productCount: rows.filter((row) => row.category_id === category.id).length,
    }),
  );

  return { products, categories };
}

export async function fetchVisualCandidates(): Promise<VisualCandidate[]> {
  const rows = await fetchCatalogRows();
  return rows.map((row) => {
    const product = toAssistantProduct(row);
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
