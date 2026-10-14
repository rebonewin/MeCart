"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");
}

const categorySchema = z.object({ name: z.string().min(2), slug: z.string().min(2) });
const subCategorySchema = z.object({ name: z.string().min(2), slug: z.string().min(2), categoryId: z.string().min(1) });
const brandSchema = z.object({ name: z.string().min(2), slug: z.string().min(2) });

export async function createCategory(input: unknown) {
  await requireAdmin();
  const v = categorySchema.parse(input);
  await prisma.category.create({ data: v });
  await logAudit({ action: "CREATE", resource: "Category", newValue: v.name });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function updateCategory(id: string, input: unknown) {
  await requireAdmin();
  const v = categorySchema.parse(input);
  await prisma.category.update({ where: { id }, data: v });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/categories");
}

export async function createSubCategory(input: unknown) {
  await requireAdmin();
  const v = subCategorySchema.parse(input);
  await prisma.subCategory.create({ data: v });
  revalidatePath("/admin/categories");
}

export async function updateSubCategory(id: string, input: unknown) {
  await requireAdmin();
  const v = subCategorySchema.parse(input);
  await prisma.subCategory.update({ where: { id }, data: v });
  revalidatePath("/admin/categories");
}

export async function deleteSubCategory(id: string) {
  await requireAdmin();
  await prisma.subCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/categories");
}

export async function createBrand(input: unknown) {
  await requireAdmin();
  const v = brandSchema.parse(input);
  await prisma.brand.create({ data: v });
  revalidatePath("/admin/brands");
  revalidatePath("/products");
}

export async function updateBrand(id: string, input: unknown) {
  await requireAdmin();
  const v = brandSchema.parse(input);
  await prisma.brand.update({ where: { id }, data: v });
  revalidatePath("/admin/brands");
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  await prisma.brand.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/brands");
}
