import Link from "next/link";
import { ArrowUpRight, BarChart3, Percent, Wallet } from "lucide-react";
import { getCommissionOverview } from "@/lib/repositories/admin-marketplace";
import { money, percent } from "@/lib/marketplace/format";
import { CommissionForm } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Commissions | MeCart Admin" };

export default async function AdminCommissionsPage() {
  const vendors = await getCommissionOverview();
  const totalGmv = vendors.reduce((sum, vendor) => sum + vendor.gmv, 0);
  const totalCommission = vendors.reduce((sum, vendor) => sum + vendor.commission, 0);
  const effectiveRate = totalGmv > 0 ? (totalCommission / totalGmv) * 100 : 0;
  const configured = vendors.filter((vendor) => vendor.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Economics</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Commission policy</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            Vendor defaults apply to new listings. Each product can carry its own rate, and every order item stores the
            rate used at the moment of sale so historical payouts never drift.
          </p>
        </div>
        <Link href="/admin/marketplace/vendors" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium text-slate-300 hover:text-white">
          Manage vendors <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Marketplace GMV", value: money(totalGmv), hint: "All allocated sales", icon: BarChart3 },
          { label: "Commission earned", value: money(totalCommission), hint: "Before refunds", icon: Wallet },
          { label: "Effective take rate", value: percent(effectiveRate), hint: `${configured} approved vendors`, icon: Percent },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-cyan-300" />
            </div>
            <p className="mt-3 text-xl font-semibold tabular-nums text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] text-slate-600">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Vendor rates</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Changing a default never rewrites historical orders or existing product overrides.</p>
          </div>
          <span className="text-[10px] text-slate-500">Up to 100 sellers by GMV</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Vendor</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-3 py-3.5 font-medium">Orders</th>
                <th className="px-3 py-3.5 font-medium">GMV</th>
                <th className="px-3 py-3.5 font-medium">Commission</th>
                <th className="px-3 py-3.5 font-medium">Effective</th>
                <th className="px-5 py-3.5 text-right font-medium">Default rate</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/marketplace/vendors/${vendor.id}`} className="font-medium text-white hover:text-cyan-200">
                      {vendor.display_name}
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${vendor.status === "APPROVED" ? "bg-emerald-400/10 text-emerald-300" : vendor.status === "SUSPENDED" || vendor.status === "REJECTED" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-300"}`}>
                      {vendor.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-400">{vendor.orders}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-200">{money(vendor.gmv)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-cyan-200">{money(vendor.commission)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-400">
                    {vendor.gmv > 0 ? percent((vendor.commission / vendor.gmv) * 100) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <CommissionForm vendorId={vendor.id} rate={vendor.commission_rate} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendors.length === 0 && (
          <div className="px-5 py-14 text-center">
            <Percent className="mx-auto h-7 w-7 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No vendors to configure yet.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <h3 className="text-sm font-semibold text-white">Snapshot integrity</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            <code className="text-cyan-200">order_items.commission_rate</code> is copied at checkout and
            <code className="ml-1 text-cyan-200">vendor_order_allocations</code> stores the resulting commission. Finance
            reports read snapshots, not live defaults.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <h3 className="text-sm font-semibold text-white">Override precedence</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Product override → vendor default → platform default. Staff can assign a product-level rate from the ownership
            editor or the seller can set one within the permitted range.
          </p>
        </div>
      </div>
    </div>
  );
}
