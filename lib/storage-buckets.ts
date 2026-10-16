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
] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];
