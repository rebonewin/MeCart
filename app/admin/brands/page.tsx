import { prisma } from "@/lib/prisma";
import { BrandManager } from "@/components/admin/brand-manager";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brands</h1>
      <BrandManager initial={brands as unknown as { id: string; name: string; slug: string }[]} />
    </div>
  );
}
