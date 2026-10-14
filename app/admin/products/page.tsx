import { prisma } from "@/lib/prisma";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp?.q ?? "";
  const status = sp?.status ?? "";
  const page = Math.max(1, Number(sp?.page ?? 1));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { position: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <ProductsManager
      products={products as unknown as import("@/components/admin/products-manager").AdminProduct[]}
      total={total}
      page={page}
      pageSize={pageSize}
      q={q}
      status={status}
    />
  );
}
