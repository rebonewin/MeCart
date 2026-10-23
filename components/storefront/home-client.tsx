"use client";

import dynamic from "next/dynamic";
import { CustomCursor, LoadingScreen, LenisProvider, ScrollProgress } from "@/components/storefront/cinematic";
import { PremiumHero } from "@/components/storefront/premium-hero";
import { CategoryShowcase } from "@/components/storefront/categories";
import { FeaturedProducts } from "@/components/storefront/products";
import { LazySection } from "@/components/ui/lazy-section";
import type { StorefrontHomeData } from "@/lib/services/storefront";
import type { StorefrontProduct } from "@/types/product";

function SectionSkeleton({ minHeight = 420 }: { minHeight?: number }) {
  return (
    <div
      className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-16 sm:px-6 lg:px-8"
      style={{ minHeight }}
      aria-hidden
    >
      <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--lx-border)]" />
      <div className="h-8 w-72 max-w-full animate-pulse rounded-full bg-[var(--lx-border)]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-72 animate-pulse rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/60"
          />
        ))}
      </div>
    </div>
  );
}

const BrandShowcase = dynamic(
  () => import("@/components/storefront/brands").then((module) => module.BrandShowcase),
  { ssr: false, loading: () => <SectionSkeleton minHeight={440} /> },
);
const AIRecommendations = dynamic(
  () => import("@/components/storefront/recommendations").then((module) => module.AIRecommendations),
  { ssr: false, loading: () => <SectionSkeleton minHeight={620} /> },
);
const PersonalizedRecommendations = dynamic(
  () =>
    import("@/components/storefront/personalized-recommendations").then(
      (module) => module.PersonalizedRecommendations,
    ),
  { ssr: false, loading: () => <SectionSkeleton minHeight={700} /> },
);
const FlashDeals = dynamic(
  () => import("@/components/storefront/deals").then((module) => module.FlashDeals),
  { ssr: false, loading: () => <SectionSkeleton minHeight={560} /> },
);
const CustomerReviews = dynamic(
  () => import("@/components/storefront/reviews").then((module) => module.CustomerReviews),
  { ssr: false, loading: () => <SectionSkeleton minHeight={620} /> },
);
const Newsletter = dynamic(
  () => import("@/components/storefront/newsletter").then((module) => module.Newsletter),
  { ssr: false, loading: () => <SectionSkeleton minHeight={360} /> },
);

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
  const pool = dedupeById(data.catalog?.length ? data.catalog : [...data.featured, ...data.recommended]);

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
          <LazySection minHeight={440} label="Loading brand stories">
            <BrandShowcase brands={data.brands} />
          </LazySection>
          <LazySection minHeight={620} label="Loading personalised picks">
            <AIRecommendations products={pool} />
          </LazySection>
          <LazySection minHeight={700} label="Loading recommendation rails">
            <PersonalizedRecommendations pool={pool} />
          </LazySection>
          <LazySection minHeight={560} label="Loading flash deals">
            <FlashDeals products={data.flashSale} />
          </LazySection>
          <LazySection minHeight={620} label="Loading client reviews">
            <CustomerReviews reviews={data.reviews} stats={data.stats} />
          </LazySection>
          <LazySection minHeight={360} label="Loading newsletter">
            <Newsletter />
          </LazySection>
        </div>
      </div>
    </LenisProvider>
  );
}
