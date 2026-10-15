"use client";

import { motion } from "framer-motion";
import { HomeHero } from "@/components/home/hero";
import { FeatureBar } from "@/components/home/feature-bar";
import { CategorySection } from "@/components/home/categories";
import { FlashSale } from "@/components/home/flash-sale";
import { FeaturedProducts, TrendingProducts, BestSellers } from "@/components/home/product-sections";
import { PromoBanners, WhyChooseUs, ReviewsSlider, BrandsCarousel, NewsletterSection } from "@/components/home/home-extras";

export default function HomePage() {
  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
        <motion.div
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-80px] top-40 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

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
  );
}
