import Link from "next/link";
import { ArrowUpRight, Store, Users } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerStores } from "@/lib/repositories/seller";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, sellerStatusTone } from "@/components/seller/ui";
import { SellerStoreForm } from "@/components/seller/store-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stores | MeCart Seller" };

export default async function SellerStoresPage() {
  const context = await requireSellerContext();
  const stores = await listSellerStores(context.vendor.id);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Brand"
        title="Stores"
        description="A vendor can operate multiple stores. Each store gets its own public page, identity and policy set."
        actions={<SellerStoreForm />}
      />

      {stores.length === 0 ? (
        <SellerEmpty title="No stores yet" description="Create your first storefront to publish products under a distinct brand." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {stores.map((store) => (
            <SellerCard key={store.id} className="overflow-hidden p-0">
              <div className="relative h-28 bg-gradient-to-br from-[#2b2414] via-[#181b22] to-[#0c0f15]">
                {store.banner_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.banner_url} alt="" className="h-full w-full object-cover opacity-70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D24] to-transparent" />
              </div>
              <div className="relative px-5 pb-5">
                <div className="-mt-7 flex items-end justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D24] text-[#D4AF37]">
                    {store.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : <Store className="h-6 w-6" />}
                  </div>
                  <SellerBadge tone={sellerStatusTone(store.status)}>{store.status.replaceAll("_", " ")}</SellerBadge>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{store.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{store.tagline || store.description || "No storefront description yet."}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {store.status === "ACTIVE" && (
                      <Link href={`/stores/${store.slug}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:text-white" aria-label="View public store">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                    <Link href={`/seller/stores/${store.id}`} className="inline-flex h-8 items-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 text-[10px] font-semibold text-[#E6C768]">
                      Manage
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
                  <span>{store.product_count} products</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {store.follower_count}</span>
                  <span>{store.rating ? `${Number(store.rating).toFixed(1)} rating` : "New store"}</span>
                </div>
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
