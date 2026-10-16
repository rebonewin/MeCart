import { auth } from "@/lib/auth";
import { getCustomerStats, listCustomers } from "@/lib/repositories/customers";
import { CustomersTable } from "@/components/admin/customers-table";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [session, customers, stats] = await Promise.all([auth(), listCustomers(), getCustomerStats()]);

  const cards = [
    { label: "Total Customers", value: stats.total.toLocaleString("en-US") },
    { label: "Active", value: stats.active.toLocaleString("en-US") },
    { label: "Staff", value: stats.staff.toLocaleString("en-US") },
    { label: "New This Month", value: stats.newThisMonth.toLocaleString("en-US") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-gray-500">Manage customer accounts, roles, and loyalty.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </section>

      <CustomersTable customers={customers} currentUserId={session?.user.id ?? null} />
    </div>
  );
}
