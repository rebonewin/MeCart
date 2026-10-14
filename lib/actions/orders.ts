"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators/checkout";
import { revalidatePath } from "next/cache";
import { logAudit, logActivity } from "@/lib/security/audit";
import { validateCoupon } from "@/lib/actions/coupons";

export async function createOrder(input: unknown) {
  const values = checkoutSchema.parse(input);

  if (values.paymentMethod === "CARD") {
    if (!/^\d{16}$/.test(values.cardNumber ?? "")) throw new Error("Invalid card number");
    if (!values.cardHolder || values.cardHolder.length < 2) throw new Error("Invalid card holder");
    if (!/^\d{3}$/.test(values.cvv ?? "")) throw new Error("Invalid CVV");
    if (!/^\d{2}$/.test(values.expiryMonth ?? "") || !/^\d{2,4}$/.test(values.expiryYear ?? "")) throw new Error("Invalid expiry");
  }
  if (values.paymentMethod === "UPI") {
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/.test(values.upiId ?? "")) throw new Error("Invalid UPI ID");
  }
  if (values.paymentMethod === "NETBANKING") {
    if (!values.bank) throw new Error("Select a bank");
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const dbProducts = await prisma.product.findMany({
    where: { id: { in: values.items.map((i) => i.productId) }, deletedAt: null },
  });
  if (dbProducts.length !== values.items.length) {
    throw new Error("Invalid product");
  }

  for (const item of values.items) {
    const db = dbProducts.find((p) => p.id === item.productId);
    if (!db || db.status !== "ACTIVE") throw new Error("Product unavailable");
    if (db.stock < item.quantity) throw new Error("Insufficient stock");
    if (Math.abs(db.finalPrice - item.price) > 0.01) throw new Error("Price mismatch detected");
  }

  const subtotal = values.items.reduce((sum, i) => {
    const db = dbProducts.find((p) => p.id === i.productId)!;
    return sum + db.finalPrice * i.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const shipping = subtotal > 0 ? 49 : 0;

  let discount = 0;
  let couponId: string | null = null;
  if (values.couponCode) {
    const c = await validateCoupon(values.couponCode, subtotal);
    discount = c.discount;
    couponId = c.couponId;
  }

  const grandTotal = Math.round((subtotal + tax + shipping - discount) * 100) / 100;

  const success = process.env.DEMO_PAYMENT_ALWAYS_SUCCESS === "true" ? true : Math.random() > 0.3;
  const paymentStatus = success ? "PAID" : "FAILED";
  const orderStatus = values.paymentMethod === "COD" ? "PENDING" : (success ? "CONFIRMED" : "PENDING");

  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const orderNumber = `ORD-${Date.now()}`;
  const invoiceNumber = `INV-${Date.now()}`;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        invoiceNumber,
        userId,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        shippingAddress: values.shippingAddress,
        billingAddress: values.billingAddress || null,
        city: values.city,
        zip: values.zip,
        subtotal,
        shippingCost: shipping,
        tax,
        discount,
        grandTotal,
        status: orderStatus,
        paymentStatus,
        items: {
          create: values.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: `SKU-${i.productId}`,
            quantity: i.quantity,
            size: i.size || null,
            color: i.color || null,
            price: i.price,
            total: i.price * i.quantity,
          })),
        },
        payments: {
          create: {
            method: values.paymentMethod,
            amount: grandTotal,
            status: paymentStatus,
            transactionId,
            paymentId,
          },
        },
      },
      include: { payments: true, items: true },
    });

    if (success) {
      for (const i of values.items) {
        await tx.product.updateMany({
          where: { id: i.productId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
      }
    }

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return created;
  });

  await logActivity({ action: "ORDER_CREATED", resource: order.id, metadata: { paymentStatus, orderStatus, total: grandTotal } });
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    invoiceNumber: order.invoiceNumber,
    paymentId,
    transactionId,
    paymentStatus,
    orderStatus,
    grandTotal,
    estimatedDelivery: "3-5 business days",
  };
}

export async function updateOrderStatus(id: string, status: "PENDING"|"CONFIRMED"|"PROCESSING"|"PACKED"|"SHIPPED"|"DELIVERED"|"CANCELLED"|"RETURNED") {
  await (await import("@/lib/auth")).auth().then((s) => {
    if (!s?.user || s.user.role !== "ADMIN") throw new Error("Unauthorized");
  });
  await prisma.order.update({ where: { id }, data: { status } });
  await logAudit({ action: "UPDATE_ORDER_STATUS", resource: `Order:${id}`, newValue: status });
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
export async function updatePaymentStatus(id: string, status: "PENDING"|"PAID"|"FAILED"|"REFUNDED") {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");
  await prisma.order.update({ where: { id }, data: { paymentStatus: status } });
  // update payment records too
  await prisma.payment.updateMany({ where: { orderId: id }, data: { status } });
  await logAudit({ action: "UPDATE_PAYMENT_STATUS", resource: `Order:${id}`, newValue: status });
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
}
export async function updateOrderStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as Parameters<typeof updateOrderStatus>[1];
  await updateOrderStatus(id, status);
}

export async function updatePaymentStatusAction(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as Parameters<typeof updatePaymentStatus>[1];
  await updatePaymentStatus(id, status);
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } }, payments: true, user: true },
  });
}

export async function listUserOrders(userId?: string | null) {
  if (!userId) return [];
  return prisma.order.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true },
  });
}
