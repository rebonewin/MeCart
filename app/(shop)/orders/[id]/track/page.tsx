import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/actions/orders";
import { OrderTracking } from "@/components/shop/order-tracking";
import type { TrackingOrder } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const order = await getOrderById(id);
  if (!order) notFound();

  const isStaff = session.user.role === "admin" || session.user.role === "manager";
  if (order.userId !== session.user.id && !isStaff) notFound();

  const trackingOrder: TrackingOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    city: order.city,
    zip: order.zip,
    grandTotal: order.grandTotal,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discount: order.discount,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      price: item.price,
      total: item.total,
    })),
  };

  return <OrderTracking order={trackingOrder} />;
}
