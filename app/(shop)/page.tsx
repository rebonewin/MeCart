"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { HomeHero } from "@/components/home/hero";
import { FeatureBar } from "@/components/home/feature-bar";
import { CategorySection } from "@/components/home/categories";
import { FlashSale } from "@/components/home/flash-sale";
import { FeaturedProducts, TrendingProducts, BestSellers } from "@/components/home/product-sections";
import { PromoBanners, WhyChooseUs, ReviewsSlider, BrandsCarousel, NewsletterSection } from "@/components/home/home-extras";
import { LenisProvider } from "@/components/home/cinematic/lenis-provider";
import { CustomCursor } from "@/components/home/cinematic/custom-cursor";
import { LoadingScreen } from "@/components/home/cinematic/loading-screen";
import { ScrollProgress } from "@/components/home/cinematic/scroll-progress";

const CinematicScene = dynamic(() => import("@/components/home/cinematic/scene").then((mod) => mod.CinematicScene), {
  ssr: false,
});

export default function HomePage() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return (
    <LenisProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
        <LoadingScreen />
        <CinematicScene />
        <CustomCursor />
        <ScrollProgress />
        <div className="noise-overlay" />

        <div className="relative z-10">
          <HomeHero />
          <FeatureBar />
          <CategorySection />
          <FlashSale />
          <FeaturedProducts />
          <TrendingProducts />
          <BestSellers />
          <PromoBanners />
          <WhyChooseUs />
          <ReviewsSlider />
          <BrandsCarousel />
          <NewsletterSection />
        </div>
      </div>
    </LenisProvider>
  );
}
