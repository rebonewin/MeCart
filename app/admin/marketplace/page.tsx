import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Package,
  RotateCcw,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { getMarketplaceAdminOverview } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Overview | MeCart Admin" };

export default async function AdminMarketplacePage() {
  const data = await getMarketplaceAdminOverview();

  const stats = [
    { label: "Active sellers", value: data.vendors.approved.toLocaleString("en-US"), hint: `${data.vendors.pending} awaiting review`, icon: BadgeCheck, tone: "text-emerald-300" },
    { label: "Live stores", value: data.stores.active.toLocaleString("en-US"), hint: `${data.stores.pending} pending approval`, icon: Store, tone: "text-blue-300" },
    { label: "Marketplace products", value: data.products.total.toLocaleString("en-US"), hint: `${data.products.pending} pending review`, icon: ShoppingBag, tone: "text-cyan-300" },
    { label: "30-day GMV", value: money(data.gmv30), hint: `${money(data.commission30)} commission`, icon: CircleDollarSign, tone: "text-amber-300" },
    { label: "Pending payouts", value: money(data.payoutsPendingValue), hint: `${data.payoutsPending} requests`, icon: Wallet, tone: "text-violet-300" },
    { label: "Open returns", value: String(data.returnsOpen), hint: "Seller and support queue", icon: RotateCcw, tone: "text-rose-300" },
  ];

  return (
    <div className="space-y-7">
      <header className="rounded-3xl border border-blue-400/15 bg-gradient-to-br from-blue-600/15 via-slate-900/50 to-cyan-500/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">Marketplace command</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Multi-vendor operations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Seller approvals, catalogue moderation, storefront status, commission, payouts and returns — all from one surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/marketplace/vendors?status=PENDING" className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-semibold text-white">
              Review vendors <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/admin/marketplace/products?approval=PENDING" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium text-slate-300 hover:text-white">
              Product queue
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.tone}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{stat.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Seller pipeline</p>
              <h2 className="mt-0.5 text-sm font-semibold text-white">Recent applications</h2>
            </div>
            <Link href="/admin/marketplace/vendors" className="text-[11px] text-blue-300 hover:text-white">View all</Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {data.recentVendors.length ? data.recentVendors.map((vendor) => (
              <Link key={vendor.id} href={`/admin/marketplace/vendors/${vendor.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{vendor.display_name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{vendor.email} · {vendor.country}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold ${vendor.status === "APPROVED" ? "bg-emerald-400/10 text-emerald-300" : vendor.status === "REJECTED" || vendor.status === "SUSPENDED" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-300"}`}>
                  {vendor.status.replaceAll("_", " ")}
                </span>
              </Link>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">No vendor applications yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Catalogue</p>
              <h2 className="mt-0.5 text-sm font-semibold text-white">Products awaiting review</h2>
            </div>
            <Link href="/admin/marketplace/products?approval=PENDING" className="text-[11px] text-blue-300 hover:text-white">Open queue</Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {data.pendingProducts.length ? data.pendingProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{product.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{product.sku} · {product.vendor_sku || "no vendor SKU"}</p>
                </div>
                <span className="shrink-0 text-[9px] text-slate-500">{product.submitted_at ? dateLabel(product.submitted_at) : "—"}</span>
              </div>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">The product queue is clear.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Finance</p>
              <h2 className="mt-0.5 text-sm font-semibold text-white">Payout requests</h2>
            </div>
            <Link href="/admin/marketplace/payouts" className="text-[11px] text-blue-300 hover:text-white">Manage payouts</Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {data.pendingPayouts.length ? data.pendingPayouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-xs font-medium text-white">{payout.payout_number}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{dateLabel(payout.period_start)} – {dateLabel(payout.period_end)}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-amber-300">{money(payout.net_amount)}</span>
              </div>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">No payouts waiting.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Aftercare</p>
              <h2 className="mt-0.5 text-sm font-semibold text-white">Open returns</h2>
            </div>
            <Link href="/admin/marketplace/returns" className="text-[11px] text-blue-300 hover:text-white">Review returns</Link>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {data.openReturns.length ? data.openReturns.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{item.rma_number}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.reason}</p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-400/10 px-2 py-1 text-[9px] text-rose-300">{item.status}</span>
              </div>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">No open returns.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/marketplace/ownership", icon: Package, title: "Ownership control", body: "Assign platform products to a vendor or store." },
          { href: "/admin/marketplace/commissions", icon: Users, title: "Commission policy", body: "Review rates and adjust per-seller economics." },
          { href: "/admin/marketplace/stores", icon: Store, title: "Storefront status", body: "Activate, pause or close marketplace stores." },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-blue-400/30 hover:bg-blue-500/[0.05]">
            <item.icon className="h-5 w-5 text-blue-300" />
            <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
