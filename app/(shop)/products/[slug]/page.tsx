import { products } from "@/lib/mock-data";
import { ProductDetailClient } from "@/components/shop/product-detail-client";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center">Product not found.</div>;
  }
  return <ProductDetailClient product={product} />;
}
