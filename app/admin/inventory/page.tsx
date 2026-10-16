import { InventoryTable } from "@/components/admin/inventory-table";
import { getInventoryStats, listInventory, listInventoryLogs } from "@/lib/repositories/inventory";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const [stats, items, logs] = await Promise.all([
    getInventoryStats(),
    listInventory(),
    listInventoryLogs(50),
  ]);

  const cards = [
    { label: "Total Items", value: stats.totalItems.toLocaleString("en-US") },
    { label: "Low Stock", value: stats.lowStock.toLocaleString("en-US") },
    { label: "Out of Stock", value: stats.outOfStock.toLocaleString("en-US") },
    {
      label: "Total Value",
      value: "$" + stats.totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Inventory Levels</h2>
        <InventoryTable items={items} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Recent Stock Movements</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
                <th className="p-3">Product</th>
                <th className="p-3">Change</th>
                <th className="p-3">After</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium">{log.productName}</td>
                  <td
                    className={`p-3 font-medium ${
                      log.change >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {log.change > 0 ? "+" : ""}
                    {log.change}
                  </td>
                  <td className="p-3">{log.quantity_after}</td>
                  <td className="p-3">{log.reason.replaceAll("_", " ")}</td>
                  <td className="p-3">{log.reference ?? "-"}</td>
                  <td className="p-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
