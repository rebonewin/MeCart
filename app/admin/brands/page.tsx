import { BrandManager } from "@/components/admin/brand-manager";
import { listBrandsWithMeta } from "@/lib/repositories/brands";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await listBrandsWithMeta();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Brands</h1>
      <BrandManager initial={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))} />
    </div>
  );
}
