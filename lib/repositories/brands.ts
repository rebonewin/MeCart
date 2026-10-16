import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapVoid } from "@/lib/repositories/utils";
import type { Brand } from "@/types/product";

export type BrandWithMeta = Brand & { logoUrl: string | null; productCount: number; description: string | null };

export async function listBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("brands")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("name");
  return (data ?? []).map((row) => ({ id: row.id, name: row.name, slug: row.slug }));
}

export async function listBrandsWithMeta(): Promise<BrandWithMeta[]> {
  const supabase = await createClient();
  const [brandsRes, productsRes] = await Promise.all([
    supabase.from("brands").select("*").is("deleted_at", null).order("name"),
    supabase.from("products").select("brand_id").is("deleted_at", null),
  ]);
  const products = productsRes.data ?? [];
  return (brandsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    description: row.description,
    productCount: products.filter((p) => p.brand_id === row.id).length,
  }));
}

export async function createBrand(input: { name: string; slug: string; logo_url?: string | null; description?: string | null }) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("brands")
      .insert({
        name: input.name,
        slug: input.slug,
        logo_url: input.logo_url ?? null,
        description: input.description ?? null,
      })
      .select("*")
      .single(),
  );
}

export async function updateBrand(id: string, input: { name?: string; slug?: string; logo_url?: string | null; description?: string | null; is_active?: boolean }) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("brands").update(input).eq("id", id));
}

export async function deleteBrand(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("brands").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}
