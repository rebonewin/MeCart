import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList } from "@/lib/repositories/utils";
import type { InventoryLogRow } from "@/types/database";

export type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  location: string | null;
  price: number;
  updatedAt: string;
};

export async function listInventory(): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const [inventoryRes, productsRes] = await Promise.all([
    supabase.from("inventory").select("*").is("variant_id", null).order("updated_at", { ascending: false }),
    supabase.from("products").select("id, name, sku, final_price, deleted_at, stock"),
  ]);

  const productMap = new Map(
    (productsRes.data ?? []).filter((p) => !p.deleted_at).map((p) => [p.id, p]),
  );

  return (inventoryRes.data ?? [])
    .map((row) => {
      const product = productMap.get(row.product_id);
      if (!product) return null;
      return {
        id: row.id,
        productId: row.product_id,
        productName: product.name,
        sku: product.sku,
        quantity: row.quantity,
        reservedQuantity: row.reserved_quantity,
        lowStockThreshold: row.low_stock_threshold,
        location: row.location,
        price: Number(product.final_price),
        updatedAt: row.updated_at,
      };
    })
    .filter((x): x is InventoryItem => x !== null);
}

export async function listInventoryLogs(limit = 100): Promise<(InventoryLogRow & { productName: string })[]> {
  const supabase = await createClient();
  const logs = unwrapList(
    await supabase.from("inventory_logs").select("*").order("created_at", { ascending: false }).limit(limit),
  );
  if (!logs.length) return [];

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", [...new Set(logs.map((l) => l.product_id))]);
  const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));

  return logs.map((log) => ({ ...log, productName: productMap.get(log.product_id) ?? "Product" }));
}

export async function getInventoryStats(): Promise<{ totalItems: number; lowStock: number; outOfStock: number; totalValue: number }> {
  const items = await listInventory();
  return {
    totalItems: items.length,
    lowStock: items.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length,
    outOfStock: items.filter((i) => i.quantity === 0).length,
    totalValue: items.reduce((sum, i) => sum + i.quantity * i.price, 0),
  };
}
