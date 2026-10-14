"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("mecart_cart");
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  });

  useEffect(() => {
    localStorage.setItem("mecart_cart", JSON.stringify(items));
  }, [items]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const keyOf = (i: CartItem) => `${i.productId}|${i.size ?? ""}|${i.color ?? ""}`;

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => keyOf(p) === keyOf(item));
      if (existing) {
        return prev.map((p) =>
          keyOf(p) === keyOf(item) ? { ...p, quantity: p.quantity + item.quantity } : p,
        );
      }
      return [...prev, item];
    });
  };

  const removeItem = (productId: string, size?: string, color?: string) => {
    setItems((prev) =>
      prev.filter((p) => !(p.productId === productId && (p.size ?? "") === (size ?? "") && (p.color ?? "") === (color ?? ""))),
    );
  };

  const updateQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.productId === productId && (p.size ?? "") === (size ?? "") && (p.color ?? "") === (color ?? "")
            ? { ...p, quantity: Math.max(1, quantity) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
