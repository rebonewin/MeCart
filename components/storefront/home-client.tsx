"use client";

import { CustomCursor, LoadingScreen, LenisProvider, ScrollProgress } from "@/components/storefront/cinematic";
import { PremiumHero } from "@/components/storefront/premium-hero";
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
  const artifacts = dedupeById(data.featured).slice(0, 3);

  return (
    <LenisProvider>
      <div className="lx-page relative min-h-screen overflow-hidden">
        <LoadingScreen />
        <CustomCursor />
        <ScrollProgress />
        <div className="noise-overlay" />

        <div className="relative z-10">
          <PremiumHero stats={data.stats} artifacts={artifacts} />
          <div
            aria-hidden
            className="pointer-events-none relative z-10 -mt-1 h-24 bg-gradient-to-b from-[#05060e] to-[var(--lx-bg)] sm:h-32"
          />
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
