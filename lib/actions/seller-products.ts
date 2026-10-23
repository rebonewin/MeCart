"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/marketplace/context";
import { VENDOR_PERMISSIONS } from "@/lib/marketplace/permissions";
import { productSchema } from "@/lib/validators/product";
import { logAudit } from "@/lib/security/audit";
import type { Json, ProductStatus } from "@/types/database";

const sellerProductSchema = productSchema.extend({
  storeId: z.string().min(1, "Select a store"),
  vendorSku: z.string().max(80).optional().or(z.literal("")),
});

export type SellerProductInput = z.input<typeof sellerProductSchema>;

function normalize(values: z.output<typeof sellerProductSchema>) {
  const sizes = values.sizes.split(",").map((value) => value.trim()).filter(Boolean);
  const colors = values.colors.split(",").map((value) => value.trim()).filter(Boolean);
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
    original_price: values.originalPrice,
    discount_percent: discount,
    final_price: finalPrice,
    category_id: values.categoryId,
    sub_category_id: values.subCategoryId || null,
    brand_id: values.brandId || null,
    store_id: values.storeId,
    vendor_sku: values.vendorSku || values.sku,
    images: values.images,
  };
}

export async function createSellerProduct(input: SellerProductInput) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.productsManage)) throw new Error("Permission denied");
  if (!context.stores.some((store) => store.id === input.storeId)) throw new Error("Store not found");

  const values = sellerProductSchema.parse(input);
  const normalized = normalize(values);
  const supabase = await createClient();
  const slug = `${values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: normalized.name,
      slug,
      sku: normalized.sku,
      description: normalized.description,
      material: normalized.material,
      country: normalized.country,
      weight: normalized.weight,
      stock: normalized.stock,
      sizes: normalized.sizes,
      colors: normalized.colors,
      original_price: normalized.original_price,
      discount_percent: normalized.discount_percent,
      final_price: normalized.final_price,
      category_id: normalized.category_id,
      sub_category_id: normalized.sub_category_id,
      brand_id: normalized.brand_id,
      status: "DRAFT",
      approval_status: "PENDING",
      submitted_at: new Date().toISOString(),
      vendor_id: context.vendor.id,
      store_id: normalized.store_id,
      vendor_sku: normalized.vendor_sku,
      marketplace_metadata: { source: "seller_portal" } as Json,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (normalized.images.length) {
    const { error: imageError } = await supabase.from("product_images").insert(
      normalized.images.map((url, index) => ({
        product_id: product.id,
        url,
        position: index,
        alt: normalized.name,
      })),
    );
    if (imageError) throw new Error(imageError.message);
  }

  const { error: inventoryError } = await supabase.from("inventory").insert({
    product_id: product.id,
    quantity: normalized.stock,
    location: context.stores.find((store) => store.id === normalized.store_id)?.name ?? "vendor",
  });
  if (inventoryError) throw new Error(inventoryError.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "PRODUCT_CREATED",
    p_resource: product.id,
    p_metadata: { name: normalized.name, sku: normalized.sku } as Json,
  });
  await logAudit({ action: "CREATE", resource: `MarketplaceProduct:${product.id}`, newValue: normalized.name });

  revalidatePath("/seller/products");
  revalidatePath("/admin/marketplace/products");
  return { productId: product.id };
}

export async function updateSellerProduct(productId: string, input: SellerProductInput) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.productsManage)) throw new Error("Permission denied");
  if (!context.stores.some((store) => store.id === input.storeId)) throw new Error("Store not found");

  const values = sellerProductSchema.parse(input);
  const normalized = normalize(values);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("id, vendor_id, approval_status, status")
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) throw new Error("Product not found");

  const nextStatus: ProductStatus =
    existing.approval_status === "APPROVED" ? (values.status as ProductStatus) : "DRAFT";

  const { error } = await supabase
    .from("products")
    .update({
      name: normalized.name,
      sku: normalized.sku,
      description: normalized.description,
      material: normalized.material,
      country: normalized.country,
      weight: normalized.weight,
      stock: normalized.stock,
      sizes: normalized.sizes,
      colors: normalized.colors,
      original_price: normalized.original_price,
      discount_percent: normalized.discount_percent,
      final_price: normalized.final_price,
      category_id: normalized.category_id,
      sub_category_id: normalized.sub_category_id,
      brand_id: normalized.brand_id,
      store_id: normalized.store_id,
      vendor_sku: normalized.vendor_sku,
      status: nextStatus,
    })
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.from("product_images").delete().eq("product_id", productId);
  if (normalized.images.length) {
    const { error: imageError } = await supabase.from("product_images").insert(
      normalized.images.map((url, index) => ({
        product_id: productId,
        url,
        position: index,
        alt: normalized.name,
      })),
    );
    if (imageError) throw new Error(imageError.message);
  }

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "PRODUCT_UPDATED",
    p_resource: productId,
    p_metadata: { name: normalized.name } as Json,
  });

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
  return { productId };
}

export async function submitSellerProduct(productId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.productsManage)) throw new Error("Permission denied");
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      status: "HIDDEN",
      approval_status: "PENDING",
      submitted_at: new Date().toISOString(),
      approval_notes: null,
    })
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "PRODUCT_SUBMITTED",
    p_resource: productId,
    p_metadata: {} as Json,
  });

  revalidatePath("/seller/products");
  revalidatePath("/admin/marketplace/products");
  return { ok: true };
}

export async function deleteSellerProduct(productId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.productsManage)) throw new Error("Permission denied");
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status: "HIDDEN" })
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "PRODUCT_ARCHIVED",
    p_resource: productId,
    p_metadata: {} as Json,
  });
  revalidatePath("/seller/products");
  return { ok: true };
}

export async function adjustSellerStock(productId: string, quantity: number, reason = "seller_adjustment") {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.inventoryManage)) throw new Error("Permission denied");
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Invalid stock quantity");
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, stock, name")
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!product) throw new Error("Product not found");

  const delta = quantity - product.stock;
  if (delta === 0) return { ok: true };

  const { data: inventory } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", productId)
    .is("variant_id", null)
    .maybeSingle();

  if (inventory) {
    const { error } = await supabase
      .from("inventory")
      .update({ quantity })
      .eq("id", inventory.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("inventory")
      .insert({ product_id: productId, quantity });
    if (error) throw new Error(error.message);
  }

  const { error } = await supabase
    .from("products")
    .update({ stock: quantity })
    .eq("id", productId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.from("inventory_logs").insert({
    inventory_id: inventory?.id ?? null,
    product_id: productId,
    change: delta,
    quantity_after: quantity,
    reason,
    reference: `seller:${context.user.id}`,
  });

  revalidatePath("/seller/inventory");
  revalidatePath("/seller/products");
  return { ok: true };
}
