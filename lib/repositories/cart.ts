import type { DB } from "@/lib/repositories/utils";
import { nullableEq, unwrap, unwrapVoid } from "@/lib/repositories/utils";
import type { CartItemRow } from "@/types/database";

export type CartItemView = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
};

export async function getOrCreateActiveCart(supabase: DB, userId: string): Promise<string> {
  const { data: existing, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (existing) return existing.id;

  const cart = unwrap(
    await supabase.from("carts").insert({ user_id: userId }).select("id").single(),
  );
  return cart.id;
}

export async function listCartItems(supabase: DB, userId: string): Promise<CartItemView[]> {
  const { data: cart, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!cart) return [];

  const items = unwrap(
    await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id)
      .order("created_at"),
  ) as CartItemRow[];

  if (!items.length) return [];

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", [...new Set(items.map((i) => i.product_id))]);

  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", [...new Set(items.map((i) => i.product_id))])
    .order("position");

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const imageMap = new Map<string, string>();
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img.url);
  }

  return items.map((item) => {
    const product = productMap.get(item.product_id);
    return {
      id: item.id,
      productId: item.product_id,
      name: product?.name ?? "Product",
      slug: product?.slug ?? "",
      price: Number(product?.final_price ?? item.unit_price),
      image: imageMap.get(item.product_id) ?? "",
      quantity: item.quantity,
      size: item.size ?? undefined,
      color: item.color ?? undefined,
    };
  });
}

export async function addCartItem(
  supabase: DB,
  userId: string,
  item: { productId: string; quantity: number; size?: string; color?: string },
): Promise<void> {
  const cartId = await getOrCreateActiveCart(supabase, userId);

  const { data: product } = await supabase
    .from("products")
    .select("final_price")
    .eq("id", item.productId)
    .maybeSingle();

  const { data: existing } = await nullableEq(
    nullableEq(
      supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", item.productId),
      "size",
      item.size,
    ),
    "color",
    item.color,
  ).maybeSingle();

  if (existing) {
    unwrapVoid(
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + item.quantity })
        .eq("id", existing.id),
    );
    return;
  }

  unwrapVoid(
    await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: item.productId,
      quantity: item.quantity,
      size: item.size ?? null,
      color: item.color ?? null,
      unit_price: Number(product?.final_price ?? 0),
    }),
  );
}

export async function updateCartItemQuantity(
  supabase: DB,
  userId: string,
  productId: string,
  quantity: number,
  size?: string,
  color?: string,
): Promise<void> {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!cart) return;

  if (quantity <= 0) {
    const delBase = supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId);
    unwrapVoid(await nullableEq(nullableEq(delBase, "size", size), "color", color));
    return;
  }

  const base = supabase
    .from("cart_items")
    .update({ quantity })
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  unwrapVoid(await nullableEq(nullableEq(base, "size", size), "color", color));
}

export async function removeCartItem(
  supabase: DB,
  userId: string,
  productId: string,
  size?: string,
  color?: string,
): Promise<void> {
  return updateCartItemQuantity(supabase, userId, productId, 0, size, color);
}

export async function clearCart(supabase: DB, userId: string): Promise<void> {
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!cart) return;
  unwrapVoid(await supabase.from("cart_items").delete().eq("cart_id", cart.id));
}

export async function countCartItems(supabase: DB, userId: string): Promise<number> {
  const items = await listCartItems(supabase, userId);
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
