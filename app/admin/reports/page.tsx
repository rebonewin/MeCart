import { getTopProducts } from "@/lib/repositories/analytics";
import { getCustomerStats } from "@/lib/repositories/customers";
import { getMonthlyRevenueSeries, getOrderStats } from "@/lib/repositories/orders";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default async function AdminReportsPage() {
  const [orderStats, monthly, topProducts, customerStats] = await Promise.all([
    getOrderStats(),
    getMonthlyRevenueSeries(12),
    getTopProducts(10),
    getCustomerStats(),
  ]);

  const periodRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
  const periodOrders = monthly.reduce((sum, m) => sum + m.orders, 0);

  const orderCards = [
    { label: "Total Orders", value: orderStats.totalOrders.toLocaleString("en-US") },
    { label: "Pending Orders", value: orderStats.pendingOrders.toLocaleString("en-US") },
    { label: "Paid Orders", value: orderStats.paidOrders.toLocaleString("en-US") },
    { label: "Total Revenue", value: formatMoney(orderStats.totalRevenue) },
    { label: "Average Order Value", value: formatMoney(orderStats.averageOrderValue) },
  ];

  const customerCards = [
    { label: "Total Customers", value: customerStats.total.toLocaleString("en-US") },
    { label: "Active", value: customerStats.active.toLocaleString("en-US") },
    { label: "Staff", value: customerStats.staff.toLocaleString("en-US") },
    { label: "New This Month", value: customerStats.newThisMonth.toLocaleString("en-US") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {orderCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Customer Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {customerCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Monthly Revenue - Last 12 Months</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
                <th className="p-3">Month</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((month) => (
                <tr key={month.label} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium">{month.label}</td>
                  <td className="p-3">{month.orders.toLocaleString("en-US")}</td>
                  <td className="p-3">{formatMoney(month.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="p-3">Total</td>
                <td className="p-3">{periodOrders.toLocaleString("en-US")}</td>
                <td className="p-3">{formatMoney(periodRevenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Top Products</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
                <th className="p-3">#</th>
                <th className="p-3">Product</th>
                <th className="p-3">Units Sold</th>
                <th className="p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.productId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3 text-gray-500">{index + 1}</td>
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3">{product.units.toLocaleString("en-US")}</td>
                  <td className="p-3">{formatMoney(product.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No product sales yet.
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
