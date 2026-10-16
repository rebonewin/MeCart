import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { MediaLibraryRow } from "@/types/database";
import { STORAGE_BUCKETS, type StorageBucket } from "@/lib/storage-buckets";

export { STORAGE_BUCKETS };
export type { StorageBucket };

export type MediaItem = MediaLibraryRow;

export async function listMedia(filters: { bucket?: string; folder?: string; search?: string } = {}): Promise<MediaItem[]> {
  const supabase = await createClient();
  let query = supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(500);
  if (filters.bucket) query = query.eq("bucket", filters.bucket);
  if (filters.folder) query = query.eq("folder", filters.folder);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  return unwrapList(await query);
}

export async function registerMedia(input: {
  bucket: string;
  path: string;
  url: string;
  name?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  folder?: string | null;
  uploadedBy: string | null;
}) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase.from("media_library").upsert(
      {
        bucket: input.bucket,
        path: input.path,
        url: input.url,
        name: input.name ?? null,
        mime_type: input.mimeType ?? null,
        size_bytes: input.sizeBytes ?? null,
        folder: input.folder ?? null,
        uploaded_by: input.uploadedBy,
      },
      { onConflict: "bucket,path" },
    ),
  );
}

export async function deleteMedia(id: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("media_library")
    .select("bucket, path")
    .eq("id", id)
    .maybeSingle();
  if (!item) throw new Error("Not found");

  await supabase.storage.from(item.bucket).remove([item.path]);
  unwrapVoid(await supabase.from("media_library").delete().eq("id", id));
}

export async function getMediaStats(): Promise<{ total: number; images: number; documents: number; storageBytes: number }> {
  const items = await listMedia();
  return {
    total: items.length,
    images: items.filter((i) => i.mime_type?.startsWith("image/")).length,
    documents: items.filter((i) => !i.mime_type?.startsWith("image/")).length,
    storageBytes: items.reduce((sum, i) => sum + Number(i.size_bytes ?? 0), 0),
  };
}
