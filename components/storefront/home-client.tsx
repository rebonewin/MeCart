"use client";

import { useEffect } from "react";
import { AuroraBackdrop } from "@/components/luxe/aurora";
import { CustomCursor, LoadingScreen, LenisProvider, ScrollProgress } from "@/components/storefront/cinematic";
import { HeroSection } from "@/components/storefront/hero";
import { CategoryShowcase } from "@/components/storefront/categories";
import { FeaturedProducts } from "@/components/storefront/products";
import { BrandShowcase } from "@/components/storefront/brands";
import { AIRecommendations } from "@/components/storefront/recommendations";
import { FlashDeals } from "@/components/storefront/deals";
import { CustomerReviews } from "@/components/storefront/reviews";
import { Newsletter } from "@/components/storefront/newsletter";
import type { StorefrontHomeData } from "@/lib/services/storefront";
import type { StorefrontProduct } from "@/types/product";

function dedupeById(products: StorefrontProduct[]): StorefrontProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function HomePageClient({ data }: { data: StorefrontHomeData }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const artifacts = dedupeById(data.featured).slice(0, 3);

  return (
    <LenisProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#05060e] text-[var(--lx-text)]">
        <LoadingScreen />
        <CustomCursor />
        <ScrollProgress />
        <AuroraBackdrop />
        <div className="noise-overlay" />

        <div className="relative z-10">
          <HeroSection stats={data.stats} artifacts={artifacts} />
          <CategoryShowcase categories={data.categories} />
          <FeaturedProducts products={data.featured} />
          <BrandShowcase brands={data.brands} />
          <AIRecommendations products={data.recommended} />
          <FlashDeals products={data.flashSale} />
          <CustomerReviews reviews={data.reviews} stats={data.stats} />
          <Newsletter />
        </div>
      </div>
    </LenisProvider>
  );
}
