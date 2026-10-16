"use client";

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth/guest-session";
import {
  addCartItem,
  clearCart as repoClearCart,
  listCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/repositories/cart";

export type CartItem = {
  id?: string;
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
  loading: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, size?: string, color?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mergeUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const next = await listCartItems(supabase, userId);
      setItems(
        next.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function boot() {
      const userId = await ensureSession();
      if (!active || !userId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      mergeUserIdRef.current = userId;
      await refresh(userId);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
          const previous = mergeUserIdRef.current;
          mergeUserIdRef.current = session.user.id;

          if (previous && previous !== session.user.id) {
            // fold the anonymous cart into the real account (best-effort)
            try {
              await supabase.rpc("merge_guest_cart", { p_from_user: previous });
            } catch {
              // ignore — the server action merge covers the sign-in path too
            }
          }
          await refresh(session.user.id);
        }
        if (event === "SIGNED_OUT") {
          setItems([]);
          const anonId = await ensureSession();
          if (anonId) {
            mergeUserIdRef.current = anonId;
            await refresh(anonId);
          }
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    }

    void boot();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [refresh]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addItem = useCallback(async (item: CartItem) => {
    const userId = await ensureSession();
    if (!userId) return;

    const supabase = createClient();
    await addCartItem(supabase, userId, {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
    await refresh(userId);
  }, [refresh]);

  const removeItem = useCallback(async (productId: string, size?: string, color?: string) => {
    const userId = await ensureSession();
    if (!userId) return;
    const supabase = createClient();
    await removeCartItem(supabase, userId, productId, size, color);
    await refresh(userId);
  }, [refresh]);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, size?: string, color?: string) => {
      const userId = await ensureSession();
      if (!userId) return;
      const supabase = createClient();
      await updateCartItemQuantity(supabase, userId, productId, quantity, size, color);
      await refresh(userId);
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    const userId = await ensureSession();
    if (!userId) return;
    const supabase = createClient();
    await repoClearCart(supabase, userId);
    await refresh(userId);
  }, [refresh]);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
