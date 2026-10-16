import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeCart | Enterprise E-Commerce",
    short_name: "MeCart",
    description: "MeCart modern enterprise e-commerce platform",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}