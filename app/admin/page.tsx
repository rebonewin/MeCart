import { SalesChart } from "@/components/admin/sales-chart";

const kpis = [
  { label: "Revenue", value: "$128,430", change: "+12.5%", color: "indigo" },
  { label: "Orders", value: "1,284", change: "+8.2%", color: "emerald" },
  { label: "Customers", value: "3,912", change: "+5.1%", color: "blue" },
  { label: "Products", value: "540", change: "+2.3%", color: "amber" },
];

const recentOrders = [
  { id: "ORD-1042", customer: "Alice Johnson", total: "$182.40", status: "Delivered" },
  { id: "ORD-1041", customer: "Bob Smith", total: "$94.00", status: "Processing" },
  { id: "ORD-1040", customer: "Cara Lee", total: "$231.10", status: "Shipped" },
  { id: "ORD-1039", customer: "David Kim", total: "$67.50", status: "Pending" },
];

const lowStock = [
  { name: "Nike Sneakers 2", stock: 5 },
  { name: "Levi's Jeans 4", stock: 8 },
  { name: "Puma Jacket 1", stock: 3 },
];

const topSelling = [
  { name: "Adidas T-Shirt 3", sold: 124 },
  { name: "Zara Dress 7", sold: 98 },
  { name: "H&M Top 2", sold: 87 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className="mt-2 text-2xl font-bold">{k.value}</p>
            <p className="mt-1 text-xs text-emerald-600">{k.change}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold">Sales Overview</h2>
        <SalesChart />
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
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2 font-medium">{o.id}</td>
                  <td className="py-2">{o.customer}</td>
                  <td className="py-2">{o.total}</td>
                  <td className="py-2"><span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold">Low Stock</h2>
            <ul className="space-y-2 text-sm">
              {lowStock.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-rose-500">{p.stock}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold">Top Selling</h2>
            <ul className="space-y-2 text-sm">
              {topSelling.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-indigo-600">{p.sold}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
