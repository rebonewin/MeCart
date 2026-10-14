import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/lib/actions/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true, user: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Order Status</th>
              <th className="p-3">Payment Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{o.orderNumber}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">${o.grandTotal.toFixed(2)}</td>
                <td className="p-3">
                  <form action={updateOrderStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status} className="rounded border px-2 py-1 text-xs dark:bg-gray-800">
                      <option>PENDING</option>
                      <option>CONFIRMED</option>
                      <option>PROCESSING</option>
                      <option>PACKED</option>
                      <option>SHIPPED</option>
                      <option>DELIVERED</option>
                      <option>CANCELLED</option>
                      <option>RETURNED</option>
                    </select>
                    <button className="rounded border px-2 py-1 text-xs">Save</button>
                  </form>
                </td>
                <td className="p-3">
                  <form action={updatePaymentStatusAction} className="flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.paymentStatus} className="rounded border px-2 py-1 text-xs dark:bg-gray-800">
                      <option>PENDING</option>
                      <option>PAID</option>
                      <option>FAILED</option>
                      <option>REFUNDED</option>
                    </select>
                    <button className="rounded border px-2 py-1 text-xs">Save</button>
                  </form>
                </td>
                <td className="p-3 flex gap-2">
                  <a href={`/admin/orders/${o.id}`} className="text-indigo-600 hover:underline">View</a>
                  <a href={`/orders/${o.id}/invoice`} className="text-indigo-600 hover:underline">Invoice</a>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No orders</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
