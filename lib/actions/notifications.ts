"use server";

import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/repositories/notifications";
import { revalidatePath } from "next/cache";

export async function markReadAction(id: string) {
  if (!id) throw new Error("Missing notification id");
  await requireUser();
  await markNotificationRead(id);
  revalidatePath("/admin/notifications");
}

export async function markAllReadAction() {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/admin/notifications");
}
