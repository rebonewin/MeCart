"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ProductRail } from "@/components/shop/product-rail";
import { usePersonalization } from "@/lib/ai/use-personalization";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import type { StorefrontProduct } from "@/types/product";

export function PersonalizedRecommendations({
  pool,
  anchor,
  includeRecentlyViewed = true,
}: {
  pool: StorefrontProduct[];
  anchor?: StorefrontProduct;
  includeRecentlyViewed?: boolean;
}) {
  const personalization = usePersonalization(pool, anchor);
  const recentlyViewed = useRecentlyViewed();
  const viewed = personalization.section("viewed");
  const trending = personalization.section("trending");

  return (
    <div className="relative">
      {viewed && viewed.products.length >= 2 ? (
        <ProductRail
          products={viewed.products}
          eyebrow={viewed.eyebrow}
          title={
            <>
              Because you viewed{" "}
              <span className="lx-serif text-[var(--lx-gold)]">
                {viewed.anchor?.brandName || viewed.anchor?.categoryName || "the atelier"}
              </span>
            </>
          }
          description={viewed.description}
          action={
            viewed.anchor ? (
              <Link
                href={`/products/${viewed.anchor.slug}`}
                className="text-sm font-medium text-[var(--lx-cyan)] transition hover:text-[var(--lx-text)]"
              >
                Return to the piece
              </Link>
            ) : null
          }
        />
      ) : null}

      {trending && trending.products.length >= 2 ? (
        <ProductRail
          products={trending.products}
          eyebrow={trending.eyebrow}
          title={
            <>
              Trending <span className="lx-serif text-[var(--lx-gold)]">now</span>
            </>
          }
          description={trending.description}
          action={
            <Link
              href="/products?sort=popular"
              className="text-sm font-medium text-[var(--lx-cyan)] transition hover:text-[var(--lx-text)]"
            >
              Most wanted
            </Link>
          }
        />
      ) : null}

      {includeRecentlyViewed && recentlyViewed.hydrated && recentlyViewed.items.length >= 1 ? (
        <ProductRail
          products={recentlyViewed.items}
          eyebrow="Your browsing memory"
          title={
            <>
              Recently <span className="lx-serif text-[var(--lx-gold)]">viewed</span>
            </>
          }
          description="Pieces you opened on this device — kept locally, ready when you are."
          action={
            <button
              type="button"
              onClick={recentlyViewed.clear}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Clear
            </button>
          }
        />
      ) : null}
    </div>
  );
}
