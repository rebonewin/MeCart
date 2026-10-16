import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://me-cart.vercel.app").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/api", "/auth", "/profile", "/orders", "/wishlist", "/cart", "/checkout", "/compare"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}