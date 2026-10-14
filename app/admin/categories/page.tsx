import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const [categories, subCategories] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories & Subcategories</h1>
      <CategoryManager categories={categories as unknown as { id: string; name: string; slug: string }[]} subCategories={subCategories as unknown as { id: string; name: string; slug: string; categoryId: string }[]} />
    </div>
  );
}
