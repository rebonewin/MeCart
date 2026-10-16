"use server";

import { auth, requireStaff } from "@/lib/auth";
import { toNumber, unwrapList } from "@/lib/repositories/utils";
import { revalidatePath } from "next/cache";
import { logAudit, logActivity } from "@/lib/security/audit";
import { checkout, type CheckoutInput } from "@/lib/services/checkout";
import {
  getOrderDetails,
  listOrdersForUser,
  updateOrderStatus as repoUpdateOrderStatus,
  updatePaymentStatus as repoUpdatePaymentStatus,
  type OrderWithDetails,
} from "@/lib/repositories/orders";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types/database";

/**
 * Checkout — prices and stock are validated inside the `place_order`
 * database function; the client cart is only a list of product IDs.
 */
export async function createOrder(input: CheckoutInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Please sign in to place an order");

  if (input.paymentMethod === "CARD") {
    if (!/^\d{16}$/.test(input.cardNumber ?? "")) throw new Error("Invalid card number");
    if (!input.cardHolder || input.cardHolder.length < 2) throw new Error("Invalid card holder");
    if (!/^\d{3}$/.test(input.cvv ?? "")) throw new Error("Invalid CVV");
    if (!/^\d{2}$/.test(input.expiryMonth ?? "") || !/^\d{2,4}$/.test(input.expiryYear ?? ""))
      throw new Error("Invalid expiry");
  }
  if (input.paymentMethod === "UPI") {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(input.upiId ?? "")) throw new Error("Invalid UPI ID");
  }
  if (input.paymentMethod === "NETBANKING") {
    if (!input.bank) throw new Error("Select a bank");
  }

  const result = await checkout(input);

  await logActivity({
    action: "ORDER_CREATED",
    resource: result.order_id,
    metadata: {
      orderNumber: result.order_number,
      paymentStatus: result.payment_status,
      orderStatus: result.order_status,
      grandTotal: result.grand_total,
    },
  });

  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");

  return {
    orderId: result.order_id,
    orderNumber: result.order_number,
    invoiceNumber: result.invoice_number,
    paymentId: result.payment_id,
    transactionId: result.transaction_id,
    paymentStatus: result.payment_status,
    orderStatus: result.order_status,
    grandTotal: toNumber(result.grand_total),
    estimatedDelivery: result.estimatedDelivery,
  };
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await requireStaff();
  await repoUpdateOrderStatus(id, status);
  await logAudit({ action: "UPDATE_ORDER_STATUS", resource: `Order:${id}`, newValue: status });
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  await requireStaff();
  await repoUpdatePaymentStatus(id, status);
  await logAudit({ action: "UPDATE_PAYMENT_STATUS", resource: `Order:${id}`, newValue: status });
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  await updateOrderStatus(id, status);
}

export async function updatePaymentStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as PaymentStatus;
  await updatePaymentStatus(id, status);
}

export async function getOrderById(id: string): Promise<LegacyOrder | null> {
  const details = await getOrderDetails(id);
  return details ? toLegacyOrder(details) : null;
}

export async function listUserOrders(userId?: string | null): Promise<LegacyOrder[]> {
  if (!userId) return [];
  const orders = await listOrdersForUser(userId);
  return orders.map(toLegacyOrder);
}

export type LegacyOrder = {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  billingAddress: string | null;
  city: string;
  zip: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  grandTotal: number;
  userId: string | null;
  items: {
    id: string;
    productId: string | null;
    name: string;
    sku: string;
    quantity: number;
    size: string | null;
    color: string | null;
    price: number;
    total: number;
  }[];
  payments: {
    id: string;
    method: string;
    status: PaymentStatus;
    transactionId: string | null;
    paymentId: string | null;
    amount: number;
  }[];
  user: { name: string | null; email: string | null } | null;
};

function toLegacyOrder(details: OrderWithDetails): LegacyOrder {
  const { order } = details;
  return {
    id: order.id,
    orderNumber: order.order_number,
    invoiceNumber: order.invoice_number,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    status: order.status,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    city: order.city,
    zip: order.zip,
    subtotal: toNumber(order.subtotal),
    shippingCost: toNumber(order.shipping_cost),
    tax: toNumber(order.tax),
    discount: toNumber(order.discount),
    grandTotal: toNumber(order.grand_total),
    userId: order.user_id,
    items: details.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: toNumber(item.price),
      total: toNumber(item.total),
    })),
    payments: details.payments.map((payment) => ({
      id: payment.id,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transaction_id,
      paymentId: payment.payment_id,
      amount: toNumber(payment.amount),
    })),
    user: details.customerName
      ? { name: details.customerName, email: details.customerEmail }
      : null,
  };
}

/** Distinct product IDs that the signed-in user has already ordered (for review gating). */
export async function listUserPurchasedProductIds(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const supabase = await createClient();
  const orders = unwrapList(
    await supabase.from("orders").select("id").eq("user_id", session.user.id).is("deleted_at", null),
  );
  if (!orders.length) return [];

  const items = unwrapList(
    await supabase
      .from("order_items")
      .select("product_id")
      .in("order_id", orders.map((o) => o.id)),
  );

  return [...new Set(items.map((i) => i.product_id).filter((x): x is string => Boolean(x)))];
}
