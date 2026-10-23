import Link from "next/link";
import { CreditCard, Wallet } from "lucide-react";
import { listAdminPayouts } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";
import { PayoutActions } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Payouts | MeCart Admin" };

const tabs = ["", "PENDING", "APPROVED", "PROCESSING", "PAID", "REJECTED"];

function tone(status: string) {
  if (status === "PAID") return "bg-emerald-400/10 text-emerald-300";
  if (status === "REJECTED" || status === "CANCELLED") return "bg-rose-400/10 text-rose-300";
  if (status === "PROCESSING") return "bg-blue-400/10 text-blue-300";
  return "bg-amber-400/10 text-amber-300";
}

export default async function AdminPayoutsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const payouts = await listAdminPayouts(params.status);
  const pending = payouts.filter((payout) => payout.status === "PENDING");
  const paid = payouts.filter((payout) => payout.status === "PAID");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Finance</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Vendor payouts</h1>
        <p className="mt-1 text-sm text-slate-400">Approve withdrawals, record settlement references and keep the ledger reconciled.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Requests in view", value: String(payouts.length), icon: CreditCard },
          { label: "Pending value", value: money(pending.reduce((sum, payout) => sum + Number(payout.net_amount), 0)), icon: Wallet },
          { label: "Paid in view", value: money(paid.reduce((sum, payout) => sum + Number(payout.net_amount), 0)), icon: Wallet },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p><stat.icon className="h-4 w-4 text-cyan-300" /></div>
            <p className="mt-3 text-xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link key={tab || "ALL"} href={`/admin/marketplace/payouts${tab ? `?status=${tab}` : ""}`} className={`rounded-full px-3.5 py-2 text-[11px] font-medium transition ${(params.status ?? "") === tab ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
            {tab || "All"}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Payout</th>
                <th className="px-3 py-3.5 font-medium">Vendor</th>
                <th className="px-3 py-3.5 font-medium">Period</th>
                <th className="px-3 py-3.5 font-medium">Gross</th>
                <th className="px-3 py-3.5 font-medium">Fees / refunds</th>
                <th className="px-3 py-3.5 font-medium">Net</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <p className="font-mono text-[11px] font-semibold text-white">{payout.payout_number}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{payout.method} · {payout.reference || "No reference"}</p>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-300">{payout.vendorName}</td>
                  <td className="px-3 py-4 text-[10px] text-slate-500">{dateLabel(payout.period_start)} – {dateLabel(payout.period_end)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-300">{money(payout.gross_sales)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-500">−{money(Number(payout.commissions) + Number(payout.refunds))}</td>
                  <td className="px-3 py-4 text-xs font-semibold tabular-nums text-cyan-200">{money(payout.net_amount)}</td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${tone(payout.status)}`}>{payout.status}</span></td>
                  <td className="px-5 py-4"><PayoutActions payoutId={payout.id} status={payout.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payouts.length === 0 && <div className="px-5 py-14 text-center"><Wallet className="mx-auto h-7 w-7 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No payouts in this view.</p></div>}
      </div>
    </div>
  );
}
