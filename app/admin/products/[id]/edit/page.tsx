import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { listBrands } from "@/lib/repositories/brands";
import { listCategories, listSubCategories } from "@/lib/repositories/categories";
import { getProductById } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, brands, subCategories] = await Promise.all([
    getProductById(id),
    listCategories(),
    listBrands(),
    listSubCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <ProductForm
        mode="edit"
        product={{ ...product, images: product.images.map((url) => ({ url })) }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        subCategories={subCategories.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId }))}
      />
    </div>
  );
}
