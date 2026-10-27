import Link from "next/link";
import { BarChart3, CircleDollarSign, Package, RotateCcw, TrendingUp } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { getSellerAnalytics } from "@/lib/repositories/seller";
import { money } from "@/lib/marketplace/format";
import { SellerCard, SellerPageHeader, SellerStat } from "@/components/seller/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics | MeCart Seller" };

export default async function SellerAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const days = params.range === "30" ? 30 : params.range === "365" ? 365 : 90;
  const context = await requireSellerContext();
  const analytics = await getSellerAnalytics(context.vendor.id, days);
  const peak = Math.max(...analytics.series.map((point) => point.revenue), 1);
  const net = analytics.revenue - analytics.commission - analytics.refunds;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Signals"
        title="Analytics"
        description="Your own sales, commission and catalogue performance — not platform-wide data."
        actions={
          <div className="flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
            {[30, 90, 365].map((range) => (
              <Link key={range} href={`/seller/analytics?range=${range}`} className={`rounded-xl px-3 py-1.5 text-xs ${days === range ? "bg-[#D4AF37] font-semibold text-[#0B0B0F]" : "text-slate-400 hover:text-white"}`}>
                {range === 365 ? "1Y" : `${range}D`}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SellerStat label="Gross sales" value={money(analytics.revenue)} hint={`${analytics.orders} orders`} icon={CircleDollarSign} tone="gold" />
        <SellerStat label="Net after fees" value={money(net)} hint={`${money(analytics.commission)} commission`} icon={TrendingUp} tone="green" />
        <SellerStat label="Units sold" value={analytics.units.toLocaleString("en-US")} hint={`${money(analytics.averageOrder)} average order`} icon={Package} />
        <SellerStat label="Refunds" value={money(analytics.refunds)} tone={analytics.refunds ? "rose" : "default"} icon={RotateCcw} />
      </div>

      <SellerCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Revenue by period</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{days}-day performance</h3>
          </div>
          <p className="text-xs text-slate-500">Gross merchandise value from your allocations</p>
        </div>
        <div className="mt-7 flex h-56 items-end gap-3">
          {analytics.series.map((point) => (
            <div key={point.label} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t-xl bg-gradient-to-t from-[#6d5119]/50 to-[#E6C768] transition group-hover:to-[#E6C768]" style={{ height: `${Math.max(4, Math.round((point.revenue / peak) * 100))}%` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#1A1D24] px-2.5 py-1.5 text-[10px] text-white shadow-xl group-hover:block">
                {money(point.revenue)} · {point.orders} orders
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-slate-600">{point.label}</span>
            </div>
          ))}
        </div>
        <div className="h-7" />
      </SellerCard>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SellerCard className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4">
            <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-white">Best-selling pieces</h3>
          </div>
          {analytics.topProducts.length ? (
            <div className="divide-y divide-white/[0.05]">
              {analytics.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-600">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{product.name}</p>
                      <p className="text-[10px] text-slate-600">{product.units} units</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-[#E6C768]">{money(product.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No sales in this period.</p>
          )}
        </SellerCard>

        <SellerCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Fulfilment mix</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Allocation status</h3>
          <div className="mt-5 space-y-4">
            {Object.entries(analytics.fulfilment).length ? Object.entries(analytics.fulfilment).map(([status, count]) => {
              const total = Math.max(1, Object.values(analytics.fulfilment).reduce((sum, value) => sum + value, 0));
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{status.replaceAll("_", " ")}</span>
                    <span className="text-slate-300">{count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${Math.round((count / total) * 100)}%` }} />
                  </div>
                </div>
              );
            }) : <p className="text-sm text-slate-500">No allocations yet.</p>}
          </div>
          <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">Commission rate</p>
            <p className="mt-1 text-2xl font-semibold text-[#E6C768]">{context.vendor.commission_rate}%</p>
            <p className="mt-1 text-[11px] text-slate-500">Applied per item at the time of sale.</p>
          </div>
        </SellerCard>
      </div>
    </div>
  );
}
