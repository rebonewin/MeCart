"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal, RippleButton, SectionHeader } from "@/components/luxe/primitives";
import { ProductCard } from "@/components/shop/product-card";
import type { StorefrontProduct } from "@/types/product";

export function FeaturedProducts({ products }: { products: StorefrontProduct[] }) {
  const items = products.slice(0, 8);
  if (!items.length) return null;

  return (
    <section id="featured" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader
          eyebrow="Curated by the atelier"
          title={
            <>
              Featured <span className="lx-serif text-[var(--lx-gold)]">objects</span>
            </>
          }
          description="Hand-picked from the live catalogue — quick-add, wishlist or compare in a single gesture."
          action={
            <RippleButton href="/products" variant="glass" size="sm">
              All products
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </RippleButton>
          }
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product, index) => (
          <Reveal key={product.id} delay={(index % 4) * 0.07} className="h-full">
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
