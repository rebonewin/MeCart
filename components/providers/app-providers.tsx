"use client";

import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CompareProvider } from "@/lib/compare-context";
import { RecentlyViewedProvider } from "@/lib/recently-viewed-context";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RiderProvider } from "@/components/storefront/rider/rider-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <RiderProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CompareProvider>{children}</CompareProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </RiderProvider>
      </CartProvider>
    </AuthProvider>
  );
}
