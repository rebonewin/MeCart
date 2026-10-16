"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { deleteMedia } from "@/lib/repositories/media";

export async function deleteMediaAction(id: string) {
  await requireStaff();
  await deleteMedia(id);
  revalidatePath("/admin/media");
}
