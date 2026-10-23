export const STORAGE_BUCKETS = [
  "products",
  "product-gallery",
  "categories",
  "brands",
  "avatars",
  "banners",
  "cms",
  "review-images",
  "documents",
  "reports",
  "vendor-assets",
  "vendor-documents",
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];
