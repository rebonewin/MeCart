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
  /** Optional interactive 3D asset (GLB/GLTF). Falls back to studio photography. */
  modelUrl?: string;
  /** Optional caption for the 3D viewer, e.g. "glTF · 4.2 MB". */
  modelCaption?: string;
  createdAt: string;
  storeName?: string;
  storeSlug?: string;
};

/** Structural shape shared by storefront views (subset of the admin ProductView flags). */
export type StorefrontProduct = Product & {
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
};

export type StorefrontReview = {
  id: string;
  author: string;
  rating: number;
  title: string | null;
  body: string | null;
  productName: string;
  createdAt: string;
};

export type StorefrontStats = {
  products: number;
  categories: number;
  brands: number;
  rating: number;
};
