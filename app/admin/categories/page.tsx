import { CategoryManager } from "@/components/admin/category-manager";
import { listCategories, listSubCategories } from "@/lib/repositories/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, subCategories] = await Promise.all([listCategories(), listSubCategories()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories &amp; Subcategories</h1>
      <CategoryManager
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        subCategories={subCategories.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          categoryId: s.categoryId,
        }))}
      />
    </div>
  );
}
