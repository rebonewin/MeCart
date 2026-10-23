import Link from "next/link";
import { ArrowUpRight, Star, Store, Users } from "lucide-react";
import { listAdminStores } from "@/lib/repositories/admin-marketplace";
import { dateLabel } from "@/lib/marketplace/format";
import { StoreModerationControls } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Stores | MeCart Admin" };

const tabs = ["", "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "DRAFT", "CLOSED"];

export default async function AdminStoresPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const stores = await listAdminStores(params.status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Marketplace</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Stores</h1>
          <p className="mt-1 text-sm text-slate-400">Each seller can operate multiple storefronts. Approved stores appear on the public marketplace.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-slate-400"><span className="font-semibold text-white">{stores.length}</span> stores shown</span>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link key={tab || "ALL"} href={`/admin/marketplace/stores${tab ? `?status=${tab}` : ""}`} className={`rounded-full px-3.5 py-2 text-[11px] font-medium transition ${(params.status ?? "") === tab ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}>
            {tab ? tab.replaceAll("_", " ") : "All"}
          </Link>
        ))}
      </div>

      {stores.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <article key={store.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <div className="relative h-20 bg-gradient-to-br from-blue-600/20 via-slate-900 to-cyan-500/10">
                {store.banner_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.banner_url} alt="" className="h-full w-full object-cover opacity-60" />
                )}
              </div>
              <div className="p-5 pt-0">
                <div className="-mt-6 flex items-end justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950 text-sm font-bold text-cyan-200">
                    {store.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : store.name.charAt(0)}
                  </span>
                  <StoreModerationControls storeId={store.id} status={store.status} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/marketplace/vendors/${store.vendor_id}`} className="truncate text-sm font-semibold text-white hover:text-cyan-200">{store.name}</Link>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">by {store.vendorName} · {store.country}</p>
                  </div>
                  {store.status === "ACTIVE" && (
                    <Link href={`/stores/${store.slug}`} target="_blank" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-500 hover:text-white" aria-label="View store">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 min-h-9 text-xs leading-5 text-slate-400">{store.tagline || store.description || "No storefront description."}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Store className="h-3 w-3" /> {store.product_count}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {store.follower_count}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {store.rating ? Number(store.rating).toFixed(1) : "New"}</span>
                </div>
                <p className="mt-2 text-[9px] text-slate-600">Created {dateLabel(store.created_at)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] py-16 text-center">
          <Store className="mx-auto h-7 w-7 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">No stores in this view.</p>
        </div>
      )}
    </div>
  );
}
