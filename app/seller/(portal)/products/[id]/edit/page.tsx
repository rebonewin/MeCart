import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listBrands } from "@/lib/repositories/brands";
import { listCategories, listSubCategories } from "@/lib/repositories/categories";
import { getSellerProduct, listSellerStores } from "@/lib/repositories/seller";
import { SellerProductForm } from "@/components/seller/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Product | MeCart Seller" };

export default async function EditSellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireSellerContext();
  const [product, stores, categories, subCategories, brands] = await Promise.all([
    getSellerProduct(context.vendor.id, id),
    listSellerStores(context.vendor.id),
    listCategories(),
    listSubCategories(),
    listBrands(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/seller/products" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Edit product</h1>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">{product.approval_status}</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">Changes are recorded in your vendor audit trail.</p>
      </div>
      <SellerProductForm
        vendorId={context.vendor.id}
        stores={stores.map((store) => ({ id: store.id, name: store.name }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        subCategories={subCategories.map((category) => ({ id: category.id, name: category.name }))}
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
        initial={{
          productId: product.id,
          name: product.name,
          sku: product.sku,
          vendorSku: product.vendor_sku ?? "",
          description: product.description,
          material: product.material ?? "",
          country: product.country ?? "",
          weight: String(product.weight ?? 0),
          stock: String(product.stock),
          sizes: product.sizes.join(", "),
          colors: product.colors.join(", "),
          originalPrice: String(product.original_price),
          discountPercent: String(product.discount_percent),
          categoryId: product.category_id,
          subCategoryId: product.sub_category_id ?? "",
          brandId: product.brand_id ?? "",
          storeId: product.store_id ?? "",
          status: product.status,
          approvalStatus: product.approval_status,
          images: product.images.map((image) => image.url),
        }}
      />
    </div>
  );
}
