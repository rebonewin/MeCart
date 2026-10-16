import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { SeoRow } from "@/types/database";

export async function getSeoRecord(entityType: SeoRow["entity_type"], entityId: string | null): Promise<SeoRow | null> {
  const supabase = await createClient();
  let query = supabase.from("seo").select("*").eq("entity_type", entityType);
  query = entityId ? query.eq("entity_id", entityId) : query.is("entity_id", null);
  const { data } = await query.maybeSingle();
  return data;
}

export async function listSeoRecords(): Promise<SeoRow[]> {
  const supabase = await createClient();
  return unwrapList(await supabase.from("seo").select("*").order("entity_type").order("created_at"));
}

export async function upsertSeoRecord(input: {
  entityType: SeoRow["entity_type"];
  entityId: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
}) {
  const supabase = await createClient();

  const payload = {
    entity_type: input.entityType,
    entity_id: input.entityId,
    meta_title: input.metaTitle ?? null,
    meta_description: input.metaDescription ?? null,
    keywords: input.keywords ?? [],
    canonical_url: input.canonicalUrl ?? null,
    og_title: input.ogTitle ?? null,
    og_description: input.ogDescription ?? null,
    og_image: input.ogImage ?? null,
    no_index: input.noIndex ?? false,
  };

  let query = supabase.from("seo").select("id").eq("entity_type", input.entityType);
  query = input.entityId ? query.eq("entity_id", input.entityId) : query.is("entity_id", null);
  const { data: existing } = await query.maybeSingle();

  if (existing) {
    unwrapVoid(await supabase.from("seo").update(payload).eq("id", existing.id));
    return;
  }
  unwrapVoid(await supabase.from("seo").insert(payload));
}
