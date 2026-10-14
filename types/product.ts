export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type SubCategory = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  material: string;
  country: string;
  weight: number;
  stock: number;
  sizes: string[];
  colors: string[];
  rating: number;
  reviewCount: number;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  subCategoryId: string;
  subCategorySlug: string;
  subCategoryName: string;
  brandId: string;
  brandName: string;
  coverImage: string;
  images: string[];
  createdAt: string;
};
