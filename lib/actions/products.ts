"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators/product";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

function toProductData(values: ReturnType<typeof productSchema.parse>) {
  const sizes = values.sizes.split(",").map((s) => s.trim()).filter(Boolean);
  const colors = values.colors.split(",").map((s) => s.trim()).filter(Boolean);
  const discount = values.discountPercent ?? 0;
  const finalPrice = Math.round((values.originalPrice * (100 - discount)) / 100 * 100) / 100;
  return {
    name: values.name,
    slug: `${values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`,
    sku: values.sku,
    description: values.description,
    material: values.material || null,
    country: values.country || null,
    weight: values.weight ?? null,
    stock: values.stock,
    sizes,
    colors,
    rating: values.rating ?? 0,
    reviewCount: values.reviewCount ?? 0,
    originalPrice: values.originalPrice,
    discountPercent: discount,
    finalPrice,
    status: values.status,
    featured: values.featured ?? false,
    bestSeller: values.bestSeller ?? false,
    newArrival: values.newArrival ?? false,
    category: { connect: { id: values.categoryId } },
    subCategory: values.subCategoryId ? { connect: { id: values.subCategoryId } } : undefined,
    brand: values.brandId ? { connect: { id: values.brandId } } : undefined,
  };
}

export async function createProduct(input: unknown) {
  await requireAdmin();
  const values = productSchema.parse(input);
  const data = toProductData(values);

  const product = await prisma.product.create({
    data: {
      ...data,
      images: {
        create: values.images.map((url, index) => ({ url, position: index })),
      },
    },
  });

  await logAudit({ action: "CREATE", resource: `Product:${product.id}`, newValue: product.name });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return product.id;
}

export async function updateProduct(id: string, input: unknown) {
  await requireAdmin();
  const values = productSchema.parse(input);
  const data = toProductData(values);

  await prisma.product.update({
    where: { id },
    data: {
      ...data,
      images: {
        deleteMany: {},
        create: values.images.map((url, index) => ({ url, position: index })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${data.slug}`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const old = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logAudit({ action: "DELETE", resource: `Product:${id}`, oldValue: old?.name ?? null });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function restoreProduct(id: string) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
  });
  revalidatePath("/admin/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  await requireAdmin();
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date() },
  });
  await logAudit({ action: "BULK_DELETE", resource: "Product", newValue: ids.join(",") });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function bulkUpdateProducts(ids: string[], patch: { status?: "ACTIVE" | "DRAFT" | "HIDDEN"; featured?: boolean; bestSeller?: boolean; newArrival?: boolean; stock?: number }) {
  await requireAdmin();
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: patch,
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function adjustStock(id: string, delta: number) {
  await requireAdmin();
  await prisma.product.update({
    where: { id },
    data: { stock: { increment: delta } },
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}
