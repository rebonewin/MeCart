"use client";

import { useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import {
  buildRecommendationSections,
  type RecommendationSection,
  type RecommendationSectionId,
  type RecommendationSignals,
} from "@/lib/ai/recommendations";
import type { StorefrontProduct } from "@/types/product";

export function usePersonalization(
  pool: StorefrontProduct[],
  anchor?: StorefrontProduct,
) {
  const recentlyViewed = useRecentlyViewed();
  const cart = useCart();
  const wishlist = useWishlist();

  const signals = useMemo<RecommendationSignals>(
    () => ({
      recentlyViewed: recentlyViewed.items,
      wishlistIds: wishlist.items.map((item) => item.productId),
      cartIds: cart.items.map((item) => item.productId),
    }),
    [recentlyViewed.items, wishlist.items, cart.items],
  );

  const sections = useMemo(
    () => buildRecommendationSections(pool, signals, { anchor }),
    [pool, signals, anchor],
  );

  return useMemo(
    () => ({
      signals,
      sections,
      section: (id: RecommendationSectionId): RecommendationSection | undefined =>
        sections.find((entry) => entry.id === id),
    }),
    [signals, sections],
  );
}
