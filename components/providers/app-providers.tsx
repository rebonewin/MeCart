"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CompareProvider } from "@/lib/compare-context";
import { AuthProvider } from "@/components/providers/auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>{children}</CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
