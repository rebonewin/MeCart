import { ProductsManager, type AdminProduct } from "@/components/admin/products-manager";
import { listProductsForAdmin } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp?.q ?? "";
  const status = sp?.status ?? "";
  const page = Math.max(1, Number(sp?.page ?? 1));
  const pageSize = 20;

  let all = await listProductsForAdmin({ search: q || undefined });
  if (status) all = all.filter((p) => p.status === status);

  const total = all.length;
  const skip = (page - 1) * pageSize;

  const products: AdminProduct[] = all.slice(skip, skip + pageSize).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    stock: p.stock,
    status: p.status,
    finalPrice: p.finalPrice,
    category: p.categoryName ? { name: p.categoryName } : null,
    brand: p.brandName ? { name: p.brandName } : null,
    images: (p.coverImage ? [p.coverImage] : p.images.slice(0, 1)).map((url) => ({ url })),
  }));

  return (
    <ProductsManager
      products={products}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      status={status}
    />
  );
}
