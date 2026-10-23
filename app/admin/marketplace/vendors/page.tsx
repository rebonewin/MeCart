import Link from "next/link";
import { Search, Store, Users } from "lucide-react";
import { listAdminVendors } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendors | MeCart Admin" };

const statuses = ["", "PENDING", "UNDER_REVIEW", "APPROVED", "SUSPENDED", "REJECTED"];

function tone(status: string) {
  if (status === "APPROVED") return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
  if (status === "SUSPENDED" || status === "REJECTED") return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
  return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const vendors = await listAdminVendors({ status: params.status, search: params.q });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Marketplace</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Vendors</h1>
          <p className="mt-1 text-sm text-slate-400">Review applications, inspect stores and manage seller standing.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-slate-400">
          <span className="font-semibold text-white">{vendors.length}</span> vendors shown
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((status) => (
            <Link
              key={status || "ALL"}
              href={`/admin/marketplace/vendors${status ? `?status=${status}` : ""}`}
              className={`rounded-full px-3.5 py-2 text-[11px] font-medium transition ${(params.status ?? "") === status ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
            >
              {status ? status.replaceAll("_", " ") : "All"}
            </Link>
          ))}
        </div>
        <form className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          {params.status && <input type="hidden" name="status" value={params.status} />}
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search name or email" className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Vendor</th>
                <th className="px-3 py-3.5 font-medium">Owner</th>
                <th className="px-3 py-3.5 font-medium">Stores</th>
                <th className="px-3 py-3.5 font-medium">Products</th>
                <th className="px-3 py-3.5 font-medium">GMV</th>
                <th className="px-3 py-3.5 font-medium">Commission</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <Link href={`/admin/marketplace/vendors/${vendor.id}`} className="group flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 text-xs font-bold text-cyan-200">
                        {vendor.display_name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-white group-hover:text-cyan-200">{vendor.display_name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{vendor.email} · {vendor.country}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-xs text-slate-300">{vendor.ownerName || "—"}</p>
                    <p className="text-[10px] text-slate-600">{vendor.ownerEmail}</p>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-300"><span className="inline-flex items-center gap-1"><Store className="h-3 w-3 text-slate-600" /> {vendor.storeCount}</span></td>
                  <td className="px-3 py-4 text-xs text-slate-300">
                    {vendor.product_count}
                    {vendor.pendingProducts > 0 && <span className="ml-1.5 rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-300">{vendor.pendingProducts} pending</span>}
                  </td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-300">{money(vendor.total_sales)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-cyan-200">{vendor.commission_rate}%</td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ${tone(vendor.status)}`}>{vendor.status.replaceAll("_", " ")}</span></td>
                  <td className="px-5 py-4 text-right text-[10px] text-slate-500">{dateLabel(vendor.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendors.length === 0 && (
          <div className="px-5 py-14 text-center">
            <Users className="mx-auto h-7 w-7 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No vendors match this view.</p>
          </div>
        )}
      </div>
    </div>
  );
}
