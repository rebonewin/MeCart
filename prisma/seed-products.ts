import { PrismaClient } from "@prisma/client";
import { categories, subCategories, brands, products } from "../lib/mock-data";

const prisma = new PrismaClient();

function slugToBrandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const db = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, deletedAt: null },
      create: { name: c.name, slug: c.slug },
    });
    categoryMap.set(c.slug, db.id);
  }

  const subCategoryMap = new Map<string, string>();
  for (const s of subCategories) {
    const catId = categoryMap.get(s.categorySlug);
    if (!catId) continue;
    const db = await prisma.subCategory.upsert({
      where: { slug_categoryId: { slug: s.slug, categoryId: catId } },
      update: { name: s.name, deletedAt: null },
      create: { name: s.name, slug: s.slug, categoryId: catId },
    });
    subCategoryMap.set(`${s.categorySlug}:${s.slug}`, db.id);
  }

  const brandMap = new Map<string, string>();
  for (const b of brands) {
    const db = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, deletedAt: null },
      create: { name: b.name, slug: b.slug },
    });
    brandMap.set(b.slug, db.id);
  }

  let count = 0;
  for (const p of products) {
    const catId = categoryMap.get(p.categorySlug);
    const subId = subCategoryMap.get(`${p.categorySlug}:${p.subCategorySlug}`);
    const brandId = brandMap.get(slugToBrandSlug(p.brandName));
    const finalPrice = p.finalPrice;

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        sku: p.sku,
        description: p.description,
        material: p.material,
        country: p.country,
        weight: p.weight,
        stock: p.stock,
        sizes: p.sizes,
        colors: p.colors,
        rating: p.rating,
        reviewCount: p.reviewCount,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        finalPrice,
        status: p.stock > 5 ? "ACTIVE" : "HIDDEN",
        featured: false,
        bestSeller: p.reviewCount > 300,
        newArrival: true,
        categoryId: catId ?? undefined,
        subCategoryId: subId ?? undefined,
        brandId: brandId ?? undefined,
        images: {
          deleteMany: {},
          create: p.images.map((url, index) => ({ url, position: index })),
        },
      },
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        material: p.material,
        country: p.country,
        weight: p.weight,
        stock: p.stock,
        sizes: p.sizes,
        colors: p.colors,
        rating: p.rating,
        reviewCount: p.reviewCount,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        finalPrice,
        status: p.stock > 5 ? "ACTIVE" : "HIDDEN",
        featured: false,
        bestSeller: p.reviewCount > 300,
        newArrival: true,
        category: { connect: { id: catId! } },
        subCategory: subId ? { connect: { id: subId } } : undefined,
        brand: brandId ? { connect: { id: brandId } } : undefined,
        images: {
          create: p.images.map((url, index) => ({ url, position: index })),
        },
      },
    });
    count++;
  }

  console.log(`Seeded ${categories.length} categories, ${subCategories.length} subcategories, ${brands.length} brands, ${count} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

