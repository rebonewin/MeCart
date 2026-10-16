"use server";

import { requireStaff } from "@/lib/auth";
import { productSchema } from "@/lib/validators/product";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";
import {
  adjustStock as repoAdjustStock,
  bulkDeleteProducts as repoBulkDelete,
  bulkUpdateProducts as repoBulkUpdate,
  createProduct as repoCreateProduct,
  deleteProduct as repoDeleteProduct,
  restoreProduct as repoRestoreProduct,
  updateProduct as repoUpdateProduct,
  type ProductInput,
} from "@/lib/repositories/products";
import type { ProductStatus } from "@/types/database";

function toProductInput(values: ReturnType<typeof productSchema.parse>): ProductInput {
  const sizes = values.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  const colors = values.colors.split(",").map((s) => s.trim()).filter(Boolean);
  const discount = values.discountPercent ?? 0;
  const finalPrice = Math.round(((values.originalPrice * (100 - discount)) / 100) * 100) / 100;

  return {
    name: values.name,
    sku: values.sku,
    description: values.description,
    material: values.material || null,
    country: values.country || null,
    weight: values.weight ?? null,
    stock: values.stock,
    sizes,
    colors,
    originalPrice: values.originalPrice,
    discountPercent: discount,
    finalPrice,
    status: values.status as ProductStatus,
    featured: values.featured ?? false,
    bestSeller: values.bestSeller ?? false,
    newArrival: values.newArrival ?? false,
    categoryId: values.categoryId,
    subCategoryId: values.subCategoryId || null,
    brandId: values.brandId || null,
    images: values.images,
  };
}

export async function createProduct(input: unknown) {
  await requireStaff();
  const values = productSchema.parse(input);
  const id = await repoCreateProduct(toProductInput(values));

  await logAudit({ action: "CREATE", resource: `Product:${id}`, newValue: values.name });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return id;
}

export async function updateProduct(id: string, input: unknown) {
  await requireStaff();
  const values = productSchema.parse(input);
  await repoUpdateProduct(id, toProductInput(values));

  await logAudit({ action: "UPDATE", resource: `Product:${id}`, newValue: values.name });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  await requireStaff();
  await repoDeleteProduct(id);
  await logAudit({ action: "DELETE", resource: `Product:${id}` });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function restoreProduct(id: string) {
  await requireStaff();
  await repoRestoreProduct(id);
  revalidatePath("/admin/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  await requireStaff();
  await repoBulkDelete(ids);
  await logAudit({ action: "BULK_DELETE", resource: "Product", newValue: ids.join(",") });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function bulkUpdateProducts(
  ids: string[],
  patch: { status?: ProductStatus; featured?: boolean; best_seller?: boolean; new_arrival?: boolean; stock?: number },
) {
  await requireStaff();
  const { stock, ...rest } = patch;
  if (Object.keys(rest).length) await repoBulkUpdate(ids, rest);
  if (stock !== undefined) {
    for (const id of ids) {
      const { getProductById } = await import("@/lib/repositories/products");
      const product = await getProductById(id);
      if (product) await repoAdjustStock(id, stock - product.stock, "bulk_update");
    }
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function adjustStock(id: string, delta: number) {
  await requireStaff();
  await repoAdjustStock(id, delta, "manual", `admin:${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/products");
}
