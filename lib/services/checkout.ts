import "server-only";
import { createClient } from "@/lib/supabase/server";
import { placeOrder, type CheckoutPayload, type PlaceOrderResult } from "@/lib/repositories/orders";
import type { PaymentMethod } from "@/types/database";

export type CheckoutInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress?: string | null;
  city: string;
  zip: string;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardHolder?: string;
  cvv?: string;
  expiryMonth?: string;
  expiryYear?: string;
  upiId?: string;
  bank?: string;
  notes?: string | null;
};

export async function checkout(input: CheckoutInput): Promise<PlaceOrderResult & { estimatedDelivery: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to place an order");

  // load cart from the database — server-side authority, never trust client lines
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!cart) throw new Error("Your cart is empty");

  const { data: cartItems } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id);

  if (!cartItems?.length) throw new Error("Your cart is empty");

  const payload: CheckoutPayload = {
    items: cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    shipping_address: input.shippingAddress,
    billing_address: input.billingAddress ?? null,
    city: input.city,
    zip: input.zip,
    coupon_code: input.couponCode ?? null,
    payment_method: input.paymentMethod,
    notes: input.notes ?? null,
  };

  const result = await placeOrder(payload);

  // cart is consumed — mark converted and clear items
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  await supabase.from("carts").update({ status: "CONVERTED" }).eq("id", cart.id);

  return { ...result, estimatedDelivery: "3-5 business days" };
}
