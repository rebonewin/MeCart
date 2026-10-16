"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { deleteCmsPage, upsertCmsPage } from "@/lib/repositories/cms";
import type { CmsStatus, Json } from "@/types/database";

export async function saveCmsPageAction(input: {
  slug: string;
  title: string;
  excerpt?: string | null;
  content: Json;
  status: CmsStatus;
  template?: string;
  coverImage?: string | null;
}): Promise<{ id: string }> {
  await requireStaff();

  if (!input || typeof input.slug !== "string" || !input.slug.trim()) {
    throw new Error("A page slug is required");
  }
  if (typeof input.title !== "string" || !input.title.trim()) {
    throw new Error("A page title is required");
  }

  const slug = input.slug.startsWith("/") ? input.slug.trim() : `/${input.slug.trim()}`;
  const status: CmsStatus =
    input.status === "PUBLISHED" || input.status === "ARCHIVED" || input.status === "DRAFT"
      ? input.status
      : "DRAFT";

  const id = await upsertCmsPage({
    slug,
    title: input.title.trim(),
    excerpt: input.excerpt ?? null,
    content: input.content ?? {},
    status,
    template: input.template,
    coverImage: input.coverImage ?? null,
  });

  revalidatePath("/admin/cms");
  revalidatePath(slug);
  return { id };
}

export async function deleteCmsPageAction(id: string): Promise<void> {
  await requireStaff();

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("A page id is required");
  }

  await deleteCmsPage(id);
  revalidatePath("/admin/cms");
}
