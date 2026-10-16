import { ProductForm } from "@/components/admin/product-form";
import { listBrands } from "@/lib/repositories/brands";
import { listCategories, listSubCategories } from "@/lib/repositories/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands, subCategories] = await Promise.all([
    listCategories(),
    listBrands(),
    listSubCategories(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Product</h1>
      <ProductForm
        mode="create"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        subCategories={subCategories.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId }))}
      />
    </div>
  );
}
