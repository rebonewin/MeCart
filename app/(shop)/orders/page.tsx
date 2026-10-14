import { auth } from "@/lib/auth";
import { listUserOrders } from "@/lib/actions/orders";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const orders = await listUserOrders(session?.user?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">My Orders</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-gray-500">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Order</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium">{o.orderNumber}</td>
                  <td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">${o.grandTotal.toFixed(2)}</td>
                  <td className="p-3">{o.status}</td>
                  <td className="p-3">{o.paymentStatus}</td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/orders/${o.id}`} className="text-indigo-600 hover:underline">View</Link>
                    <Link href={`/orders/${o.id}/invoice`} className="text-indigo-600 hover:underline">Invoice</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
