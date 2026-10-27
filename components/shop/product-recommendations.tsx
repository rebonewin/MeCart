"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ProductRail } from "@/components/shop/product-rail";
import { usePersonalization } from "@/lib/ai/use-personalization";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import type { StorefrontProduct } from "@/types/product";

export function ProductRecommendations({
  pool,
  product,
}: {
  pool: StorefrontProduct[];
  product: StorefrontProduct;
}) {
  const personalization = usePersonalization(pool, product);
  const recentlyViewed = useRecentlyViewed();
  const fbt = personalization.section("fbt");
  const also = personalization.section("also");
  const look = personalization.section("look");

  return (
    <div className="border-t border-[var(--lx-border)]">
      {fbt && fbt.products.length ? (
        <ProductRail
          products={fbt.products}
          eyebrow={fbt.eyebrow}
          title={
            <>
              Bought together with{" "}
              <span className="lx-serif text-[var(--lx-gold)]">
                {product.brandName || product.categoryName || "this piece"}
              </span>
            </>
          }
          description={fbt.description}
          action={
            <Link
              href={`/products/${product.slug}`}
              className="text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
            >
              The anchor piece
            </Link>
          }
        />
      ) : null}

      {also && also.products.length >= 2 ? (
        <ProductRail
          products={also.products}
          eyebrow={also.eyebrow}
          title={
            <>
              Customers also <span className="lx-serif text-[var(--lx-gold)]">purchased</span>
            </>
          }
          description={also.description}
          action={
            <Link
              href="/products?sort=rating"
              className="text-sm font-medium text-[var(--lx-cyan)] transition hover:text-[var(--lx-text)]"
            >
              Top rated
            </Link>
          }
        />
      ) : null}

      {look && look.products.length >= 2 ? (
        <ProductRail
          products={look.products}
          eyebrow={look.eyebrow}
          title={
            <>
              Complete the <span className="lx-serif text-[var(--lx-gold)]">look</span>
            </>
          }
          description={look.description}
          action={
            <Link
              href="/categories"
              className="text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
            >
              Explore collections
            </Link>
          }
        />
      ) : null}

      {recentlyViewed.hydrated && recentlyViewed.items.length >= 1 ? (
        <ProductRail
          products={recentlyViewed.items}
          eyebrow="Your browsing memory"
          title={
            <>
              Recently <span className="lx-serif text-[var(--lx-gold)]">viewed</span>
            </>
          }
          description="Kept on this device, so you can pick up exactly where you left off."
          action={
            <Button
              type="button"
              onClick={recentlyViewed.clear}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Clear
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
