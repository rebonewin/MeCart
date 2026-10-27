import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  MessageSquare,
  Package,
  RotateCcw,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { getSellerDashboard, listSellerStores } from "@/lib/repositories/seller";
import { money, dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, SellerStat, sellerStatusTone } from "@/components/seller/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Seller Dashboard | MeCart" };

export default async function SellerDashboardPage() {
  const context = await requireSellerContext();
  const [dashboard, stores] = await Promise.all([
    getSellerDashboard(context.vendor.id),
    listSellerStores(context.vendor.id),
  ]);

  const peak = Math.max(...dashboard.revenueSeries.map((point) => point.revenue), 1);

  return (
    <div className="space-y-7">
      <SellerPageHeader
        eyebrow="Atelier overview"
        title={`Good to see you, ${context.user.name?.split(" ")[0] || "seller"}.`}
        description="A live view of revenue, fulfilment and the signals that need your attention today."
        actions={
          <>
            <Link href="/seller/products/new" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768]">
              <ShoppingBag className="h-3.5 w-3.5" /> New product
            </Link>
            <Link href="/seller/orders" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-5 text-xs font-semibold text-slate-200 transition hover:border-[#D4AF37]/40 hover:text-white">
              Open orders <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      {stores.length === 0 ? (
        <SellerEmpty
          title="Create your first store"
          description="A store gives customers a branded home for your products. You can own more than one."
          action={
            <Link href="/seller/stores" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F]">
              Set up a store <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SellerStat label="30-day revenue" value={money(dashboard.revenue30)} hint={`${dashboard.orders30} orders · ${dashboard.units} units`} icon={CircleDollarSign} tone="gold" />
        <SellerStat label="Available balance" value={money(dashboard.availableBalance)} hint={`${money(dashboard.pendingBalance)} pending release`} icon={TrendingUp} tone="green" />
        <SellerStat label="Needs fulfilment" value={String(dashboard.pendingFulfillment)} hint="Pending, processing or packed" icon={Package} tone={dashboard.pendingFulfillment > 0 ? "rose" : "default"} />
        <SellerStat label="Catalogue" value={String(dashboard.productCount)} hint={`${dashboard.pendingApproval} awaiting review · ${dashboard.lowStock} low stock`} icon={ShoppingBag} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SellerCard>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Revenue pulse</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Last 30 days</h3>
            </div>
            <SellerBadge tone="gold">{money(dashboard.revenue30)}</SellerBadge>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5" aria-label="Revenue by day for the last 30 days">
            {dashboard.revenueSeries.map((point) => (
              <div key={point.label} className="group relative flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-[#8f6b1e]/50 to-[#E6C768] transition group-hover:from-[#b98d36] group-hover:to-[#E6C768]"
                  style={{ height: `${Math.max(4, Math.round((point.revenue / peak) * 100))}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#1A1D24] px-2.5 py-1.5 text-[10px] text-white shadow-xl group-hover:block">
                  {point.label}: {money(point.revenue)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.14em] text-slate-600">
            <span>{dashboard.revenueSeries[0]?.label}</span>
            <span>Today</span>
          </div>
        </SellerCard>

        <SellerCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Attention queue</p>
              <h3 className="mt-1 text-lg font-semibold text-white">What needs you</h3>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
              <Star className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: "Orders to fulfil", value: dashboard.pendingFulfillment, href: "/seller/orders", icon: Package },
              { label: "Returns to review", value: dashboard.openReturns, href: "/seller/returns", icon: RotateCcw },
              { label: "Customer conversations", value: dashboard.unreadMessages, href: "/seller/messages", icon: MessageSquare },
              { label: "Unread notifications", value: dashboard.unreadNotifications, href: "/seller/notifications", icon: MessageSquare },
              { label: "Low-stock products", value: dashboard.lowStock, href: "/seller/inventory", icon: Boxes },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.04]">
                  <span className="flex items-center gap-3 text-sm text-slate-300">
                    <Icon className="h-4 w-4 text-slate-500" /> {item.label}
                  </span>
                  <span className={item.value > 0 ? "text-sm font-semibold text-[#E6C768]" : "text-sm text-slate-600"}>{item.value}</span>
                </Link>
              );
            })}
          </div>
        </SellerCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <SellerCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Recent orders</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Latest allocations</h3>
            </div>
            <Link href="/seller/orders" className="text-xs text-slate-400 transition hover:text-[#E6C768]">View all</Link>
          </div>
          {dashboard.recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">No orders yet.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-y border-white/[0.06] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium sm:px-6">Order</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Fulfilment</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrders.map(({ allocation, order }) => (
                    <tr key={allocation.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-5 py-3.5 sm:px-6">
                        <Link href={`/seller/orders/${order.id}`} className="font-medium text-white transition hover:text-[#E6C768]">{order.order_number}</Link>
                      </td>
                      <td className="px-3 py-3.5 text-slate-400">{order.customer_name}</td>
                      <td className="px-3 py-3.5 tabular-nums text-slate-200">{money(allocation.subtotal)}</td>
                      <td className="px-3 py-3.5"><SellerBadge tone={sellerStatusTone(allocation.fulfillment_status)}>{allocation.fulfillment_status}</SellerBadge></td>
                      <td className="px-3 py-3.5 text-xs text-slate-500">{dateLabel(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SellerCard>

        <SellerCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Top pieces</p>
          <h3 className="mt-1 text-lg font-semibold text-white">By 30-day revenue</h3>
          <div className="mt-5 space-y-4">
            {dashboard.topProducts.length ? dashboard.topProducts.map((product, index) => (
              <div key={product.name}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="font-mono text-[10px] text-slate-600">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{product.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{product.units} units</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-[#E6C768]">{money(product.revenue)}</span>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">Sales data appears here once orders arrive.</p>}
          </div>
        </SellerCard>
      </div>
    </div>
  );
}
