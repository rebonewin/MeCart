import { ProductDetailClient } from "@/components/shop/product-detail-client";
import { getProductBySlug, getRelatedProducts, listProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Product not found.</div>;
  }

  const [related, catalog] = await Promise.all([
    getRelatedProducts(product, 8),
    listProducts({ sort: "rating", limit: 36 }),
  ]);

  return <ProductDetailClient product={product} related={related} catalog={catalog} />;
}
