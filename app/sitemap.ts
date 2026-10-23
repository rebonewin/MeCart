import type { MetadataRoute } from "next";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://me-cart.vercel.app").replace(/\/$/, "");
  const supabase = getPublicSupabaseClient();

  const [products, categories, stores, vendors] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "ACTIVE")
      .eq("approval_status", "APPROVED")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(5000),
    supabase.from("categories").select("slug, updated_at").limit(500),
    supabase
      .from("stores")
      .select("slug, updated_at")
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .limit(5000),
    supabase.from("public_vendor_profiles").select("slug, created_at").limit(5000),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/stores`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/rewards`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/search`, changeFrequency: "weekly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...(products.data ?? []).map((product) => ({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(categories.data ?? []).map((category) => ({
      url: `${base}/categories/${category.slug}`,
      lastModified: category.updated_at ? new Date(category.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(stores.data ?? []).map((store) => ({
      url: `${base}/stores/${store.slug}`,
      lastModified: store.updated_at ? new Date(store.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(vendors.data ?? []).map((vendor) => ({
      url: `${base}/vendors/${vendor.slug}`,
      lastModified: vendor.created_at ? new Date(vendor.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
