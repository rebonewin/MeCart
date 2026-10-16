"use server";

import { requireStaff } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createCoupon as repoCreateCoupon,
  deleteCoupon as repoDeleteCoupon,
  toggleCoupon as repoToggleCoupon,
  validateCoupon as repoValidateCoupon,
} from "@/lib/repositories/coupons";

const schema = z.object({
  code: z.string().min(3),
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  expiresAt: z.string().optional().nullable(),
});

export async function createCoupon(input: unknown) {
  await requireStaff();
  const v = schema.parse(input);
  await repoCreateCoupon({
    code: v.code,
    discountPercent: v.discountPercent ?? null,
    discountAmount: v.discountAmount ?? null,
    minOrderValue: v.minOrderValue ?? null,
    usageLimit: v.usageLimit ?? null,
    expiresAt: v.expiresAt ?? null,
  });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await requireStaff();
  await repoDeleteCoupon(id);
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(id: string) {
  await requireStaff();
  await repoToggleCoupon(id);
  revalidatePath("/admin/coupons");
}

export async function validateCoupon(code: string, subtotal: number) {
  return repoValidateCoupon(code, subtotal);
}
