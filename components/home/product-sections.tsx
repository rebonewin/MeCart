"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { products } from "@/lib/mock-data";
import { SectionHeading } from "@/components/home/categories";
import { ProductCardHome } from "@/components/home/product-card";

export function FeaturedProducts() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Curated collection" title="Featured Products" description="Premium picks selected for quality, style, and performance." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: index * 0.08 }}
            >
              <ProductCardHome product={product} />
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/products" className="inline-flex rounded-2xl bg-white/80 px-6 py-3 font-semibold shadow-sm backdrop-blur transition hover:-translate-y-1 dark:bg-gray-900/80">
            View all products
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BestSellers() {
  const best = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Customer favorites" title="Best Sellers" description="Loved by thousands of happy customers around the world." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: index * 0.08 }}
            >
              <ProductCardHome product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendingProducts() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const interval = setInterval(() => {
      element.scrollBy({ left: 280, behavior: "smooth" });
      if (element.scrollLeft + element.clientWidth >= element.scrollWidth - 10) {
        element.scrollTo({ left: 0, behavior: "smooth" });
      }
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="What's hot" title="Trending Products" description="Smooth horizontal scrolling through the products everyone is talking about." />
        <div ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none]">
          {products.map((product) => (
            <div key={product.id} className="w-[280px] shrink-0 snap-start">
              <ProductCardHome product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
