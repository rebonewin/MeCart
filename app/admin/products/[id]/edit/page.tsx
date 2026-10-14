import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands, subCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.subCategory.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <ProductForm mode="edit" product={product as unknown as Record<string, unknown>} categories={categories as unknown as { id: string; name: string }[]} brands={brands as unknown as { id: string; name: string }[]} subCategories={subCategories as unknown as { id: string; name: string; categoryId: string }[]} />
    </div>
  );
}
