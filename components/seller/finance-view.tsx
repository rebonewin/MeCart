import { CreditCard, Landmark, Receipt, Wallet } from "lucide-react";
import type { SellerFinance } from "@/lib/repositories/seller";
import { dateLabel, money } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerPageHeader, SellerStat, sellerStatusTone } from "@/components/seller/ui";
import { SellerPayoutAccountForm, SellerPayoutRequest } from "@/components/seller/finance-controls";

export function SellerFinanceView({
  finance,
  commission,
  focus = "all",
}: {
  finance: SellerFinance;
  commission: number;
  focus?: "all" | "payouts";
}) {
  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Money"
        title={focus === "payouts" ? "Payouts" : "Finance"}
        description={
          focus === "payouts"
            ? "Request withdrawals, review payout history and manage verified destinations."
            : "An append-only ledger of sales, commission, refunds and payouts. Balances only move through recorded entries."
        }
        actions={<SellerPayoutRequest available={finance.available} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SellerStat label="Available" value={money(finance.available)} hint="Cleared and ready for payout" icon={Wallet} tone="green" />
        <SellerStat label="Pending release" value={money(finance.pending)} hint="Held by the marketplace window" icon={Receipt} tone="gold" />
        <SellerStat label="Lifetime sales" value={money(finance.lifetime)} hint={`${commission}% current commission`} icon={Landmark} />
        <SellerStat label="Payout methods" value={String(finance.accounts.length)} hint={finance.accounts.find((account) => account.is_default)?.account_name || "Add a destination"} icon={CreditCard} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {focus === "all" && (
          <SellerCard className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Ledger</p>
                <h3 className="mt-0.5 text-sm font-semibold text-white">Recent entries</h3>
              </div>
              <span className="text-[10px] text-slate-600">{finance.ledger.length} entries</span>
            </div>
            {finance.ledger.length ? (
              <div className="max-h-[540px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#1A1D24] text-[9px] uppercase tracking-[0.16em] text-slate-600">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Type</th>
                      <th className="px-3 py-2.5 font-medium">Description</th>
                      <th className="px-3 py-2.5 font-medium">Available</th>
                      <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.ledger.map((entry) => (
                      <tr key={entry.id} className="border-t border-white/[0.04]">
                        <td className="px-5 py-3"><SellerBadge tone={entry.type === "SALE" ? "success" : entry.type === "COMMISSION" ? "warning" : "neutral"}>{entry.type}</SellerBadge></td>
                        <td className="px-3 py-3 text-slate-400">{entry.description || "—"}</td>
                        <td className="px-3 py-3 text-slate-500">{dateLabel(entry.available_at)}</td>
                        <td className={`px-5 py-3 text-right tabular-nums ${Number(entry.amount) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          {Number(entry.amount) >= 0 ? "+" : ""}{money(entry.amount, entry.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No ledger activity yet.</p>
            )}
          </SellerCard>
        )}

        <div className={focus === "payouts" ? "xl:col-span-2 space-y-5" : "space-y-5"}>
          <SellerCard className="overflow-hidden p-0">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Withdrawals</p>
              <h3 className="mt-0.5 text-sm font-semibold text-white">Payout history</h3>
            </div>
            {finance.payouts.length ? (
              <div className="divide-y divide-white/[0.05]">
                {finance.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-xs font-medium text-white">{payout.payout_number}</p>
                      <p className="mt-0.5 text-[10px] text-slate-600">{dateLabel(payout.period_start)} – {dateLabel(payout.period_end)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs tabular-nums text-slate-200">{money(payout.net_amount)}</p>
                      <SellerBadge tone={sellerStatusTone(payout.status)}>{payout.status}</SellerBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-xs text-slate-500">No payouts requested yet.</p>
            )}
          </SellerCard>

          <SellerCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Destinations</p>
                <h3 className="mt-0.5 text-sm font-semibold text-white">Payout methods</h3>
              </div>
              <SellerPayoutAccountForm />
            </div>
            <div className="mt-4 space-y-2">
              {finance.accounts.length ? finance.accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{account.account_name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{account.provider}{account.account_last4 ? ` · ****${account.account_last4}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.is_default && <SellerBadge tone="gold">Default</SellerBadge>}
                    <SellerBadge tone={sellerStatusTone(account.status)}>{account.status}</SellerBadge>
                  </div>
                </div>
              )) : <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-500">Add a destination to receive payouts.</p>}
            </div>
          </SellerCard>
        </div>
      </div>
    </div>
  );
}
