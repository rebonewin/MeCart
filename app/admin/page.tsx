import { SalesChart } from "@/components/admin/sales-chart";
import { getDashboardStats, getTopProducts } from "@/lib/repositories/analytics";
import { listInventory } from "@/lib/repositories/inventory";
import { getMonthlyRevenueSeries, listAllOrders } from "@/lib/repositories/orders";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, revenueSeries, orders, inventory, topSelling] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenueSeries(6),
    listAllOrders(),
    listInventory(),
    getTopProducts(5),
  ]);

  const pctLabel = (value: number) => `${value >= 0 ? "+" : ""}${value}%`;

  const kpis: { label: string; value: string; change: string | null; up: boolean }[] = [
    {
      label: "Revenue",
      value: `$${Math.round(stats.revenue).toLocaleString("en-US")}`,
      change: pctLabel(stats.revenueChangePct),
      up: stats.revenueChangePct >= 0,
    },
    {
      label: "Orders",
      value: stats.orders.toLocaleString("en-US"),
      change: pctLabel(stats.ordersChangePct),
      up: stats.ordersChangePct >= 0,
    },
    { label: "Customers", value: stats.customers.toLocaleString("en-US"), change: null, up: true },
    { label: "Products", value: stats.products.toLocaleString("en-US"), change: null, up: true },
  ];

  const recentOrders = orders.slice(0, 4);

  const lowStock = inventory
    .filter((item) => item.quantity <= item.lowStockThreshold)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold">{k.value}</p>
            {k.change && (
              <p className={`mt-1 text-xs ${k.up ? "text-emerald-600" : "text-rose-500"}`}>{k.change}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold">Sales Overview</h2>
        <SalesChart data={revenueSeries.map((point) => ({ label: point.label, revenue: point.revenue }))} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(({ order, customerName, customerEmail }) => (
                <tr key={order.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">{order.order_number}</td>
                  <td className="py-2">{customerName ?? customerEmail ?? "Guest"}</td>
                  <td className="py-2">${Number(order.grand_total).toFixed(2)}</td>
                  <td className="py-2"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{order.status}</span></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">No data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold">Low Stock</h2>
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.productName}</span>
                  <span className="text-rose-500">{p.quantity}</span>
                </li>
              ))}
              {lowStock.length === 0 && <li className="text-gray-500">No data yet</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold">Top Selling</h2>
            <ul className="space-y-2 text-sm">
              {topSelling.map((p) => (
                <li key={p.productId} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-indigo-600">{p.units}</span>
                </li>
              ))}
              {topSelling.length === 0 && <li className="text-gray-500">No data yet</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
