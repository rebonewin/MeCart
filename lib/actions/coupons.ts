"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const s = await auth();
  if (!s?.user || s.user.role !== "ADMIN") throw new Error("Unauthorized");
}

const schema = z.object({
  code: z.string().min(3),
  discountPercent: z.number().int().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
});

export async function createCoupon(input: unknown) {
  await requireAdmin();
  const v = schema.parse(input);
  await prisma.coupon.create({
    data: {
      code: v.code.toUpperCase(),
      discountPercent: v.discountPercent,
      discountAmount: v.discountAmount,
      minOrderValue: v.minOrderValue,
      usageLimit: v.usageLimit,
    },
  });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(id: string) {
  await requireAdmin();
  const c = await prisma.coupon.findUnique({ where: { id } });
  if (!c) throw new Error("Not found");
  await prisma.coupon.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin/coupons");
}

export async function validateCoupon(code: string, subtotal: number) {
  const c = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!c || !c.active || c.deletedAt) throw new Error("Invalid coupon");
  if (c.expiresAt && c.expiresAt < new Date()) throw new Error("Coupon expired");
  if (c.usageLimit && c.usedCount >= c.usageLimit) throw new Error("Coupon limit reached");
  if (c.minOrderValue && subtotal < c.minOrderValue) throw new Error("Minimum order value not met");

  let discount = 0;
  if (c.discountPercent) discount += subtotal * (c.discountPercent / 100);
  if (c.discountAmount) discount += c.discountAmount;
  if (discount > subtotal) discount = subtotal;

  return { code: c.code, discount: Math.round(discount * 100) / 100, couponId: c.id };
}
