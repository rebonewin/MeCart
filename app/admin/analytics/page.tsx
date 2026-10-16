import { AnalyticsTrafficChart } from "@/components/admin/analytics-charts";
import {
  getDashboardStats,
  getTopProducts,
  getTrafficSeries,
  listRecentEvents,
} from "@/lib/repositories/analytics";

export const dynamic = "force-dynamic";

function formatMoney(value: number) {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default async function AdminAnalyticsPage() {
  const [stats, traffic, topProducts, events] = await Promise.all([
    getDashboardStats(),
    getTrafficSeries(14),
    getTopProducts(10),
    listRecentEvents(20),
  ]);

  const cards: { label: string; value: string; trend?: number }[] = [
    { label: "Revenue", value: formatMoney(stats.revenue), trend: stats.revenueChangePct },
    { label: "Orders", value: stats.orders.toLocaleString("en-US"), trend: stats.ordersChangePct },
    { label: "Customers", value: stats.customers.toLocaleString("en-US") },
    { label: "Products", value: stats.products.toLocaleString("en-US") },
    { label: "Pending Orders", value: stats.pendingOrders.toLocaleString("en-US") },
    { label: "Low Stock", value: stats.lowStock.toLocaleString("en-US") },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            {card.trend !== undefined && (
              <p
                className={`mt-1 text-xs font-medium ${
                  card.trend >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {card.trend >= 0 ? "+" : ""}
                {card.trend}% vs last month
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Traffic - Last 14 Days</h2>
        <p className="text-sm text-gray-500">Analytics events compared to orders per day.</p>
        <div className="mt-4">
          <AnalyticsTrafficChart data={traffic} />
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

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Recent Events</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
                <th className="p-3">Event</th>
                <th className="p-3">Path</th>
                <th className="p-3">User</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3 font-medium">{event.name}</td>
                  <td className="p-3">{event.path ?? "-"}</td>
                  <td className="p-3">{event.user_id ? event.user_id.slice(0, 8) : "Guest"}</td>
                  <td className="p-3 text-gray-500">{new Date(event.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No analytics events recorded yet.
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
