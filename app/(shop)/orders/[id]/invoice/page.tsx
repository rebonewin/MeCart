import Link from "next/link";
import { getOrderById } from "@/lib/actions/orders";
import { PrintButton } from "@/components/shop/print-button";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">MeCart</h1>
          <div className="text-right text-xs text-gray-500">
            <p>Invoice #{order.invoiceNumber}</p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="mt-6 text-sm">
          <p className="font-medium">Bill To:</p>
          <p>{order.customerName}</p>
          <p>{order.customerEmail}</p>
          <p>{order.shippingAddress}, {order.city} {order.zip}</p>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2">{i.name}</td>
                <td className="py-2">{i.quantity}</td>
                <td className="py-2">${i.price.toFixed(2)}</td>
                <td className="py-2 text-right">${i.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>${order.shippingCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold border-t pt-1"><span>Grand Total</span><span>${order.grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p><span className="font-medium">Payment Method:</span> {order.payments?.[0]?.method}</p>
          <p><span className="font-medium">Transaction ID:</span> {order.payments?.[0]?.transactionId}</p>
          <p><span className="font-medium">Payment Status:</span> {order.paymentStatus}</p>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <PrintButton />
          <Link href="/orders" className="rounded-md border px-4 py-2">Back</Link>
        </div>
      </div>
    </div>
  );
}

