import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listBrands } from "@/lib/repositories/brands";
import { listCategories, listSubCategories } from "@/lib/repositories/categories";
import { listSellerStores } from "@/lib/repositories/seller";
import { SellerProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Product | MeCart Seller" };

export default async function NewSellerProductPage() {
  const context = await requireSellerContext();
  const [stores, categories, subCategories, brands] = await Promise.all([
    listSellerStores(context.vendor.id),
    listCategories(),
    listSubCategories(),
    listBrands(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">New product</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Build the listing, choose its store and save it as a draft. Submit it for review from the catalogue when it is ready.
        </p>
      </div>
      <SellerProductForm
        vendorId={context.vendor.id}
        stores={stores.map((store) => ({ id: store.id, name: store.name }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        subCategories={subCategories.map((category) => ({ id: category.id, name: category.name }))}
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
      />
    </div>
  );
}
