"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type WishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  toggle: (item: WishlistItem) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("mecart_wishlist");
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  });

  useEffect(() => {
    localStorage.setItem("mecart_wishlist", JSON.stringify(items));
  }, [items]);

  const has = (productId: string) => items.some((i) => i.productId === productId);
  const add = (item: WishlistItem) => {
    setItems((prev) => (prev.some((i) => i.productId === item.productId) ? prev : [...prev, item]));
  };
  const remove = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const toggle = (item: WishlistItem) => {
    setItems((prev) =>
      prev.some((i) => i.productId === item.productId)
        ? prev.filter((i) => i.productId !== item.productId)
        : [...prev, item],
    );
  };

  return (
    <WishlistContext.Provider value={{ items, has, add, remove, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
