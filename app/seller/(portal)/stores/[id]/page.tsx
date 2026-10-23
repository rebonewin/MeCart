import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerStores } from "@/lib/repositories/seller";
import { SellerBadge, SellerPageHeader } from "@/components/seller/ui";
import { SellerStoreForm } from "@/components/seller/store-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Settings | MeCart Seller" };

export default async function SellerStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireSellerContext();
  const stores = await listSellerStores(context.vendor.id);
  const store = stores.find((item) => item.id === id);
  if (!store) notFound();

  return (
    <div className="space-y-6">
      <Link href="/seller/stores" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to stores
      </Link>
      <SellerPageHeader
        eyebrow="Storefront identity"
        title={store.name}
        description="Brand, policies and SEO for this store. Changes revalidate the public store page."
        actions={
          <div className="flex items-center gap-2">
            <SellerBadge tone={store.status === "ACTIVE" ? "success" : "warning"}>{store.status.replaceAll("_", " ")}</SellerBadge>
            {store.status === "ACTIVE" && (
              <Link href={`/stores/${store.slug}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-slate-300 hover:text-white">
                View store <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        }
      />
      <SellerStoreForm store={store} />
    </div>
  );
}
