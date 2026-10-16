import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { CmsPageRow, CmsStatus, Json } from "@/types/database";

export async function listCmsPages(): Promise<CmsPageRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("cms_pages")
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
  );
}

export async function getCmsPageBySlug(slug: string): Promise<CmsPageRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function upsertCmsPage(input: {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: Json;
  status: CmsStatus;
  template?: string;
  coverImage?: string | null;
}) {
  const supabase = await createClient();
  const publishedAt = input.status === "PUBLISHED" ? new Date().toISOString() : null;

  const { data: existing } = await supabase
    .from("cms_pages")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (existing) {
    unwrapVoid(
      await supabase
        .from("cms_pages")
        .update({
          title: input.title,
          excerpt: input.excerpt ?? null,
          content: input.content,
          status: input.status,
          template: input.template ?? "default",
          cover_image: input.coverImage ?? null,
          published_at: publishedAt,
        })
        .eq("id", existing.id),
    );
    return existing.id;
  }

  const page = unwrap(
    await supabase
      .from("cms_pages")
      .insert({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        content: input.content,
        status: input.status,
        template: input.template ?? "default",
        cover_image: input.coverImage ?? null,
        published_at: publishedAt,
      })
      .select("*")
      .single(),
  );

  return page.id;
}

export async function deleteCmsPage(id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("cms_pages").update({ deleted_at: new Date().toISOString() }).eq("id", id));
}
