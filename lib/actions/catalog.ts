"use server";

import { requireAdmin, requireStaff } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";
import { z } from "zod";
import {
  createCategory as repoCreateCategory,
  createSubCategory as repoCreateSubCategory,
  deleteCategory as repoDeleteCategory,
  deleteSubCategory as repoDeleteSubCategory,
  updateCategory as repoUpdateCategory,
  updateSubCategory as repoUpdateSubCategory,
} from "@/lib/repositories/categories";
import {
  createBrand as repoCreateBrand,
  deleteBrand as repoDeleteBrand,
  updateBrand as repoUpdateBrand,
} from "@/lib/repositories/brands";

const categorySchema = z.object({ name: z.string().min(2), slug: z.string().min(2) });
const subCategorySchema = z.object({ name: z.string().min(2), slug: z.string().min(2), categoryId: z.string().min(1) });
const brandSchema = z.object({ name: z.string().min(2), slug: z.string().min(2) });

export async function createCategory(input: unknown) {
  await requireStaff();
  const v = categorySchema.parse(input);
  await repoCreateCategory(v);
  await logAudit({ action: "CREATE", resource: "Category", newValue: v.name });
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function updateCategory(id: string, input: unknown) {
  await requireStaff();
  const v = categorySchema.parse(input);
  await repoUpdateCategory(id, v);
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireStaff();
  await repoDeleteCategory(id);
  revalidatePath("/admin/categories");
}

export async function createSubCategory(input: unknown) {
  await requireStaff();
  const v = subCategorySchema.parse(input);
  await repoCreateSubCategory(v);
  revalidatePath("/admin/categories");
}

export async function updateSubCategory(id: string, input: unknown) {
  await requireStaff();
  const v = subCategorySchema.parse(input);
  await repoUpdateSubCategory(id, v);
  revalidatePath("/admin/categories");
}

export async function deleteSubCategory(id: string) {
  await requireStaff();
  await repoDeleteSubCategory(id);
  revalidatePath("/admin/categories");
}

export async function createBrand(input: unknown) {
  await requireStaff();
  const v = brandSchema.parse(input);
  await repoCreateBrand(v);
  revalidatePath("/admin/brands");
  revalidatePath("/products");
}

export async function updateBrand(id: string, input: unknown) {
  await requireStaff();
  const v = brandSchema.parse(input);
  await repoUpdateBrand(id, v);
  revalidatePath("/admin/brands");
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  await repoDeleteBrand(id);
  revalidatePath("/admin/brands");
}
