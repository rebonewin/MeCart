import { ProductsClient } from "@/components/shop/products-client";
import { listProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts({ limit: 300 });
  const brands = [...new Set(products.map((p) => p.brandName).filter(Boolean))].sort();

  return <ProductsClient products={products} brands={brands} />;
}
