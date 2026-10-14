import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const [audit, activity] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { admin: true } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Admin Audit Logs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-2">Time</th>
                <th className="p-2">Admin</th>
                <th className="p-2">Action</th>
                <th className="p-2">Resource</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="p-2">{a.admin?.username ?? "-"}</td>
                  <td className="p-2">{a.action}</td>
                  <td className="p-2">{a.resource}</td>
                  <td className="p-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Customer Activity Logs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-2">Time</th>
                <th className="p-2">User</th>
                <th className="p-2">Action</th>
                <th className="p-2">Resource</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-2">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="p-2">{a.user?.username ?? "guest"}</td>
                  <td className="p-2">{a.action}</td>
                  <td className="p-2">{a.resource ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
