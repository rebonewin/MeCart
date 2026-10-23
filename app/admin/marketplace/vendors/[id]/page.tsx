import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Mail, MapPin, ShieldCheck, Store } from "lucide-react";
import { getAdminVendor } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";
import {
  CommissionForm,
  PayoutActions,
  ReturnActions,
  StoreModerationControls,
  VendorReviewControls,
} from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminVendor(id);
  return { title: data ? `${data.vendor.display_name} | MeCart Admin` : "Vendor | MeCart Admin" };
}

function statusTone(status: string) {
  if (status === "APPROVED" || status === "ACTIVE" || status === "VERIFIED") return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
  if (status === "REJECTED" || status === "SUSPENDED") return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
  return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
}

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminVendor(id);
  if (!data) notFound();
  const { vendor, stores, members, profiles, verification, payouts, returns, productCounts, gmv, commission } = data;

  return (
    <div className="space-y-6">
      <Link href="/admin/marketplace/vendors" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> All vendors
      </Link>

      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/10 via-slate-900/60 to-cyan-500/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-xl font-bold text-cyan-200">
              {vendor.display_name.charAt(0).toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{vendor.display_name}</h1>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ${statusTone(vendor.status)}`}>{vendor.status.replaceAll("_", " ")}</span>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ${statusTone(vendor.verification_status)}`}>{vendor.verification_status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{vendor.legal_name}</p>
              <p className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {vendor.email}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {vendor.country}</span>
                <span>Joined {dateLabel(vendor.created_at)}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {vendor.status === "APPROVED" && (
              <Link href={`/vendors/${vendor.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-4 text-[11px] text-slate-300 hover:text-white">
                Public profile <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
            <CommissionForm vendorId={vendor.id} rate={vendor.commission_rate} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Stores", value: String(stores.length) },
            { label: "Products", value: `${productCounts.total} (${productCounts.pending} pending)` },
            { label: "Lifetime GMV", value: money(gmv) },
            { label: "Commission earned", value: money(commission) },
            { label: "Open returns", value: String(returns.filter((item) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(item.status)).length) },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-[9px] uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <h2 className="text-sm font-semibold text-white">Standing & review</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Approving a vendor activates its pending stores. Product approval remains a separate catalogue decision.</p>
            <div className="mt-4">
              <VendorReviewControls vendorId={vendor.id} status={vendor.status} />
            </div>
            {verification && (
              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-[11px] leading-5 text-slate-400">
                <p className="font-medium text-slate-300">Verification record</p>
                <p className="mt-1">Status: {verification.status} · {vendor.business_type || "Business type not supplied"}</p>
                {verification.rejection_reason && <p className="mt-1 text-rose-300">Reason: {verification.rejection_reason}</p>}
                {verification.notes && <p className="mt-1 text-slate-500">{verification.notes}</p>}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-300" />
                <h2 className="text-sm font-semibold text-white">Stores</h2>
              </div>
              <span className="text-[10px] text-slate-500">{stores.length} total</span>
            </div>
            {stores.length ? (
              <div className="divide-y divide-white/[0.05]">
                {stores.map((store) => (
                  <div key={store.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-xs font-medium text-white">{store.name}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">/{store.slug} · {store.product_count} products · {store.follower_count} followers</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {store.status === "ACTIVE" && <Link href={`/stores/${store.slug}`} target="_blank" className="text-[10px] text-blue-300 hover:text-white">View</Link>}
                      <StoreModerationControls storeId={store.id} status={store.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="px-5 py-10 text-center text-xs text-slate-500">No stores created.</p>}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Recent payouts</h2>
            </div>
            {payouts.length ? (
              <div className="divide-y divide-white/[0.05]">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div>
                      <p className="text-xs font-medium text-white">{payout.payout_number}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{dateLabel(payout.period_start)} – {dateLabel(payout.period_end)} · {payout.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold tabular-nums text-slate-200">{money(payout.net_amount)}</span>
                      <PayoutActions payoutId={payout.id} status={payout.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="px-5 py-10 text-center text-xs text-slate-500">No payouts requested.</p>}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-sm font-semibold text-white">Team & access</h2>
            <div className="mt-4 space-y-3">
              {members.map((member) => {
                const profile = profiles.find((item) => item.id === member.user_id);
                return (
                  <div key={member.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-200">{profile?.full_name || profile?.email || member.user_id}</p>
                      <p className="truncate text-[10px] text-slate-600">{profile?.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] text-slate-300">{member.role}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-sm font-semibold text-white">Support & policy</h2>
            <dl className="mt-3 space-y-3 text-xs">
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Support email</dt><dd className="mt-0.5 text-slate-300">{vendor.support_email || vendor.email}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Payout cycle</dt><dd className="mt-0.5 text-slate-300">{vendor.payout_cycle}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Return policy</dt><dd className="mt-0.5 line-clamp-4 text-slate-400">{vendor.return_policy || "Not set"}</dd></div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Recent returns</h2>
            </div>
            {returns.length ? (
              <div className="divide-y divide-white/[0.05]">
                {returns.slice(0, 6).map((item) => (
                  <div key={item.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-white">{item.rma_number}</p>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-slate-400">{item.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-600">{item.reason}</p>
                    <div className="mt-2"><ReturnActions returnId={item.id} status={item.status} refundAmount={item.refund_amount} /></div>
                  </div>
                ))}
              </div>
            ) : <p className="px-5 py-8 text-center text-xs text-slate-500">No returns.</p>}
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-[11px] text-emerald-200">
            <BadgeCheck className="h-4 w-4" /> Changes are written to the staff audit log.
          </div>
        </aside>
      </div>
    </div>
  );
}
