import { Crown, Search, Users } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerCustomers } from "@/lib/repositories/seller";
import { money, dateLabel } from "@/lib/marketplace/format";
import { SellerCard, SellerEmpty, SellerPageHeader, SellerStat } from "@/components/seller/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers | MeCart Seller" };

export default async function SellerCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const context = await requireSellerContext();
  const customers = await listSellerCustomers(context.vendor.id);
  const needle = params.q?.toLowerCase().trim();
  const filtered = needle
    ? customers.filter((customer) => customer.name.toLowerCase().includes(needle) || customer.email.toLowerCase().includes(needle))
    : customers;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Relationships"
        title="Customers"
        description="People who have bought from your stores. Data is limited to your own allocations."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SellerStat label="Customers" value={String(customers.length)} icon={Users} />
        <SellerStat label="Repeat buyers" value={String(customers.filter((customer) => customer.orders > 1).length)} icon={Crown} tone="gold" />
        <SellerStat label="Customer value" value={money(customers.reduce((sum, customer) => sum + customer.total, 0))} tone="green" />
      </div>

      <form className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input name="q" defaultValue={params.q ?? ""} placeholder="Search name or email" className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-4 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40" />
      </form>

      {filtered.length === 0 ? (
        <SellerEmpty title="No customers yet" description="Customer records appear after your first completed allocation." />
      ) : (
        <SellerCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-3 py-3.5 font-medium">Orders</th>
                  <th className="px-3 py-3.5 font-medium">Spend</th>
                  <th className="px-5 py-3.5 font-medium">Last order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8b45a]/20 bg-[#d8b45a]/10 text-xs font-semibold text-[#f5dfa2]">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-white">{customer.name}</p>
                          <p className="text-[11px] text-slate-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-slate-300">{customer.orders}</td>
                    <td className="px-3 py-4 tabular-nums text-[#f5dfa2]">{money(customer.total)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{dateLabel(customer.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SellerCard>
      )}
    </div>
  );
}
