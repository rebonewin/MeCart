import { listPaymentsWithOrders } from "@/lib/repositories/orders";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await listPaymentsWithOrders();
  const count = (status: string) => payments.filter((p) => p.status === status).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Total", payments.length],
          ["Pending", count("PENDING")],
          ["Paid", count("PAID")],
          ["Failed", count("FAILED")],
          ["Refunded", count("REFUNDED")],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Payment ID</th>
              <th className="p-3">Order</th>
              <th className="p-3">Method</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Transaction</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{p.payment_id}</td>
                <td className="p-3">{p.orderNumber}</td>
                <td className="p-3">{p.method}</td>
                <td className="p-3">${Number(p.amount).toFixed(2)}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.transaction_id ?? "-"}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-500">No payments</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
