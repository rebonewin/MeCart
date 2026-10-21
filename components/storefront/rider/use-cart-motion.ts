"use client";

import { useCallback } from "react";
import { motionBus, rectOf, usePrefersReducedMotion, type Rect } from "@/lib/motion";
import { useCart, type CartItem } from "@/lib/cart-context";

type AddOptions = {
  /** Element the interaction originated from (used as the flight origin). */
  sourceEl?: Element | null;
  /** Explicit viewport rect, if already measured. */
  rect?: Rect | null;
};

let sequence = 0;

/**
 * useCartMotion — the single add-to-cart entry point for the storefront.
 *
 * It never re-implements cart logic: it delegates the write to the existing
 * `useCart().addItem`. It only *decides when* that write happens — immediately
 * when motion is off, or when the parcel reaches the cart when motion is on.
 */
export function useCartMotion() {
  const cart = useCart();
  const reduce = usePrefersReducedMotion();
  const { addItem } = cart;

  const addToCart = useCallback(
    (item: CartItem, options?: AddOptions): Promise<void> => {
      const deliver = () => addItem(item);
      const animated = !reduce && motionBus.has("cart:add");

      if (!animated) {
        return Promise.resolve(deliver()).then(() => undefined);
      }

      const from = options?.rect ?? rectOf(options?.sourceEl ?? null);
      sequence += 1;

      return new Promise<void>((resolve) => {
        motionBus.emit("cart:add", {
          id: `${item.productId}-${sequence}`,
          name: item.name,
          image: item.image,
          from,
          deliver,
          resolve,
        });
      });
    },
    [addItem, reduce],
  );

  return { addToCart, cart, animated: !reduce };
}
