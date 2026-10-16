import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { CategoryRow, SubCategoryRow } from "@/types/database";
import type { Category, SubCategory } from "@/types/product";

export type CategoryWithCount = Category & {
  productCount: number;
  imageUrl: string | null;
  description: string | null;
};

export type SubCategoryFull = SubCategory & { categoryId: string; categoryName: string };

function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, slug: row.slug };
}

function toSubCategory(row: SubCategoryRow, categorySlug: string): SubCategory {
  return { id: row.id, name: row.name, slug: row.slug, categorySlug };
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []).map(toCategory);
}

export async function listCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .is("deleted_at", null)
      .order("position", { ascending: true }),
    supabase.from("products").select("category_id").is("deleted_at", null).eq("status", "ACTIVE"),
  ]);

  const categories = categoriesRes.data ?? [];
  const products = productsRes.data ?? [];

  return categories.map((row) => ({
    ...toCategory(row),
    productCount: products.filter((p) => p.category_id === row.id).length,
    imageUrl: row.image_url,
    description: row.description,
  }));
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function listSubCategories(): Promise<SubCategoryFull[]> {
  const supabase = await createClient();
  const [subsRes, catsRes] = await Promise.all([
    supabase.from("sub_categories").select("*").is("deleted_at", null).order("position"),
    supabase.from("categories").select("id, slug").is("deleted_at", null),
  ]);

  const cats = new Map((catsRes.data ?? []).map((c) => [c.id, c.slug]));
  return (subsRes.data ?? []).map((row) => ({
    ...toSubCategory(row, cats.get(row.category_id) ?? ""),
    categoryId: row.category_id,
    categoryName: "",
  }));
}

export async function listSubCategoriesByCategory(categoryId: string): Promise<SubCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sub_categories")
    .select("*")
    .eq("category_id", categoryId)
    .is("deleted_at", null)
    .order("position");
  return (data ?? []).map((row) => toSubCategory(row, ""));
}

export async function createCategory(input: { name: string; slug: string; description?: string | null; image_url?: string | null }) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("categories")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        image_url: input.image_url ?? null,
      })
      .select("*")
      .single(),
  );
}

export async function updateCategory(id: string, input: { name?: string; slug?: string; description?: string | null; image_url?: string | null; is_active?: boolean }) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("categories").update(input).eq("id", id));
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("categories").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}

export async function createSubCategory(input: { name: string; slug: string; categoryId: string }) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("sub_categories")
      .insert({ name: input.name, slug: input.slug, category_id: input.categoryId })
      .select("*")
      .single(),
  );
}

export async function updateSubCategory(id: string, input: { name?: string; slug?: string; category_id?: string }) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("sub_categories").update(input).eq("id", id));
}

export async function deleteSubCategory(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("sub_categories").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}

export async function countProductsByCategory(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const rows = unwrapList(
    await supabase.from("products").select("category_id").is("deleted_at", null),
  );
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}
