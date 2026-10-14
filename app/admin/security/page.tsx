import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SecurityDashboardPage() {
  const [auditCount, activityCount, failedLogins, usersCount, recentAudit, recentActivity, recentOrders] = await Promise.all([
    prisma.auditLog.count(),
    prisma.activityLog.count(),
    prisma.activityLog.count({ where: { action: { contains: "LOGIN_FAILED" } } }),
    prisma.user.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { admin: true } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Security Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Audit Logs", auditCount],
          ["Activity Logs", activityCount],
          ["Failed Logins", failedLogins],
          ["Users", usersCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold">Recent Admin Audit Logs</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {recentAudit.map((l) => (
              <li key={l.id} className="border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="font-medium">{l.action}</span> on {l.resource} by {l.admin?.username ?? "system"} at {new Date(l.createdAt).toLocaleString()} [{l.status}]
              </li>
            ))}
            {recentAudit.length === 0 && <li className="text-gray-500">No audit logs.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold">Recent Customer Activity</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {recentActivity.map((a) => (
              <li key={a.id} className="border-b border-gray-100 dark:border-gray-800 pb-2">
                {a.action} {a.resource ?? ""} by {a.user?.username ?? "guest"} at {new Date(a.createdAt).toLocaleString()}
              </li>
            ))}
            {recentActivity.length === 0 && <li className="text-gray-500">No activity.</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {recentOrders.map((o) => (
            <li key={o.id} className="flex justify-between">
              <span>{o.orderNumber}</span>
              <span>${o.grandTotal.toFixed(2)} - {o.status}</span>
            </li>
          ))}
          {recentOrders.length === 0 && <li className="text-gray-500">No orders.</li>}
        </ul>
      </div>
    </div>
  );
}
