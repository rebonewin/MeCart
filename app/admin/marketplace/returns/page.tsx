import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { listAdminReturns } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";
import { ReturnActions } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Returns | MeCart Admin" };

const tabs = ["", "REQUESTED", "APPROVED", "RECEIVED", "REFUNDED", "REJECTED", "CLOSED"];

function tone(status: string) {
  if (status === "REFUNDED" || status === "CLOSED") return "bg-emerald-400/10 text-emerald-300";
  if (status === "REJECTED") return "bg-rose-400/10 text-rose-300";
  if (status === "RECEIVED") return "bg-blue-400/10 text-blue-300";
  return "bg-amber-400/10 text-amber-300";
}

export default async function AdminReturnsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const returns = await listAdminReturns(params.status);
  const open = returns.filter((item) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Aftercare</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Returns & refunds</h1>
          <p className="mt-1 text-sm text-slate-400">Support can resolve a case on behalf of either party. Refunds reverse commission proportionally.</p>
        </div>
        <div className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-xs text-amber-200">{open.length} open cases</div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link key={tab || "ALL"} href={`/admin/marketplace/returns${tab ? `?status=${tab}` : ""}`} className={`rounded-full px-3.5 py-2 text-[11px] font-medium transition ${(params.status ?? "") === tab ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
            {tab || "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">RMA</th>
                <th className="px-3 py-3.5 font-medium">Vendor</th>
                <th className="px-3 py-3.5 font-medium">Order</th>
                <th className="px-3 py-3.5 font-medium">Customer</th>
                <th className="px-3 py-3.5 font-medium">Reason</th>
                <th className="px-3 py-3.5 font-medium">Refund</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Resolution</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <p className="font-mono text-[11px] font-semibold text-white">{item.rma_number}</p>
                    <p className="mt-0.5 text-[9px] text-slate-600">{dateLabel(item.created_at)}</p>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-300">{item.vendorName}</td>
                  <td className="px-3 py-4 text-[10px] text-slate-500">{item.orderNumber || "—"}</td>
                  <td className="px-3 py-4 text-xs text-slate-400">{item.customerName || "Customer"}</td>
                  <td className="px-3 py-4"><p className="line-clamp-2 max-w-[240px] text-[11px] text-slate-400">{item.reason}</p><p className="mt-0.5 text-[9px] text-slate-600">Qty {item.quantity}</p></td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-200">{money(item.refund_amount)}</td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${tone(item.status)}`}>{item.status}</span></td>
                  <td className="px-5 py-4"><ReturnActions returnId={item.id} status={item.status} refundAmount={item.refund_amount} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {returns.length === 0 && <div className="px-5 py-14 text-center"><RotateCcw className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No returns in this view.</p></div>}
      </div>
    </div>
  );
}
