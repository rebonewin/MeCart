import { RotateCcw } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerReturns } from "@/lib/repositories/seller";
import { dateLabel, money } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, SellerStat, sellerStatusTone } from "@/components/seller/ui";
import { SellerReturnActions } from "@/components/seller/return-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns | MeCart Seller" };

export default async function SellerReturnsPage() {
  const context = await requireSellerContext();
  const returns = await listSellerReturns(context.vendor.id);
  const open = returns.filter((item) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status));
  const refunded = returns.filter((item) => item.status === "REFUNDED");

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Aftercare"
        title="Returns"
        description="Review requests, receive goods and issue refunds. Commission is reversed in proportion to the refunded amount."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SellerStat label="Open requests" value={String(open.length)} icon={RotateCcw} tone={open.length ? "gold" : "default"} />
        <SellerStat label="Refunded cases" value={String(refunded.length)} icon={RotateCcw} />
        <SellerStat label="Refunded value" value={money(returns.reduce((sum, item) => sum + Number(item.refund_amount), 0))} tone="rose" />
      </div>

      {returns.length === 0 ? (
        <SellerEmpty title="No returns" description="Requests from buyers arrive here with the order, reason and item context." />
      ) : (
        <SellerCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">RMA</th>
                  <th className="px-3 py-3.5 font-medium">Order</th>
                  <th className="px-3 py-3.5 font-medium">Reason</th>
                  <th className="px-3 py-3.5 font-medium">Refund</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-3 py-3.5 font-medium">Requested</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((item) => (
                  <tr key={item.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-4"><p className="font-mono text-xs font-semibold text-white">{item.rma_number}</p><p className="mt-0.5 text-[10px] text-slate-600">{item.customerName}</p></td>
                    <td className="px-3 py-4 text-xs text-slate-400">{item.orderNumber}</td>
                    <td className="max-w-[260px] px-3 py-4"><p className="truncate text-xs text-slate-300">{item.reason}</p><p className="mt-0.5 text-[10px] text-slate-600">Qty {item.quantity}</p></td>
                    <td className="px-3 py-4 tabular-nums text-slate-200">{money(item.refund_amount)}</td>
                    <td className="px-3 py-4"><SellerBadge tone={sellerStatusTone(item.status)}>{item.status}</SellerBadge></td>
                    <td className="px-3 py-4 text-xs text-slate-500">{dateLabel(item.created_at)}</td>
                    <td className="px-5 py-4"><SellerReturnActions returnId={item.id} status={item.status} refundAmount={item.refund_amount} /></td>
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
