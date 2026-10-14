import { getOrderById } from "@/lib/actions/orders";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p><span className="font-medium">Status:</span> {order.status}</p>
        <p><span className="font-medium">Payment:</span> {order.paymentStatus}</p>
        <p><span className="font-medium">Customer:</span> {order.customerName} ({order.customerEmail})</p>
        <p><span className="font-medium">Shipping:</span> {order.shippingAddress}, {order.city} {order.zip}</p>
        <p><span className="font-medium">Total:</span> ${order.grandTotal.toFixed(2)}</p>
        {order.payments?.[0]?.transactionId && <p><span className="font-medium">Transaction:</span> {order.payments[0].transactionId}</p>}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between">
              <span>{i.name} ({i.size}/{i.color}) x{i.quantity}</span>
              <span>${i.total.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex gap-3">
        <Link href={`/orders/${order.id}/invoice`} className="rounded-md bg-indigo-600 px-4 py-2 text-white">View Invoice</Link>
        <Link href="/orders" className="rounded-md border px-4 py-2">Back</Link>
      </div>
    </div>
  );
}
