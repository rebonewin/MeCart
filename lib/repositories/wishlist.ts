import type { DB } from "@/lib/repositories/utils";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { Product } from "@/types/product";

export type WishlistItemView = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

export async function listWishlist(supabase: DB, userId: string): Promise<WishlistItemView[]> {
  const rows = unwrapList(
    await supabase.from("wishlists").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  );
  if (!rows.length) return [];

  const productIds = rows.map((r) => r.product_id);

  const { data: products } = await supabase.from("products").select("*").in("id", productIds);
  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", productIds)
    .order("position");

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const imageMap = new Map<string, string>();
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img.url);
  }

  return rows
    .map((row) => {
      const product = productMap.get(row.product_id);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.final_price),
        image: imageMap.get(product.id) ?? "",
      };
    })
    .filter((x): x is WishlistItemView => x !== null);
}

export async function addToWishlist(supabase: DB, userId: string, productId: string): Promise<void> {
  unwrapVoid(
    await supabase
      .from("wishlists")
      .upsert({ user_id: userId, product_id: productId }, { onConflict: "user_id,product_id" }),
  );
}

export async function removeFromWishlist(supabase: DB, userId: string, productId: string): Promise<void> {
  unwrapVoid(
    await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId),
  );
}

export function wishlistProductToView(product: Product): WishlistItemView {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    price: product.finalPrice,
    image: product.coverImage,
  };
}
