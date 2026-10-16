"use server";

import { requireStaff } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";
import { deleteReview, updateReviewStatus } from "@/lib/repositories/reviews";
import type { ReviewStatus } from "@/types/database";

export async function updateReviewStatusAction(id: string, status: ReviewStatus) {
  await requireStaff();
  await updateReviewStatus(id, status);
  await logAudit({ action: "UPDATE_REVIEW_STATUS", resource: `Review:${id}`, newValue: status });
  revalidatePath("/admin/reviews");
}

export async function deleteReviewAction(id: string) {
  await requireStaff();
  await deleteReview(id);
  await logAudit({ action: "DELETE_REVIEW", resource: `Review:${id}` });
  revalidatePath("/admin/reviews");
}
