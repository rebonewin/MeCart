"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/auth/guest-session";
import {
  addToWishlist,
  listWishlist,
  removeFromWishlist,
} from "@/lib/repositories/wishlist";

export type WishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

type WishlistContextValue = {
  items: WishlistItem[];
  loading: boolean;
  has: (productId: string) => boolean;
  add: (item: WishlistItem) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggle: (item: WishlistItem) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const rows = await listWishlist(supabase, userId);
      setItems(rows.map((r) => ({ productId: r.productId, name: r.name, slug: r.slug, price: r.price, image: r.image })));
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
      await refresh(userId);

      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session?.user) {
          await refresh(session.user.id);
        }
        if (event === "SIGNED_OUT") {
          const anonId = await ensureSession();
          if (anonId) await refresh(anonId);
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

  const has = (productId: string) => items.some((i) => i.productId === productId);

  const add = useCallback(async (item: WishlistItem) => {
    const userId = await ensureSession();
    if (!userId) return;
    const supabase = createClient();
    await addToWishlist(supabase, userId, item.productId);
    await refresh(userId);
  }, [refresh]);

  const remove = useCallback(async (productId: string) => {
    const userId = await ensureSession();
    if (!userId) return;
    const supabase = createClient();
    await removeFromWishlist(supabase, userId, productId);
    await refresh(userId);
  }, [refresh]);

  const toggle = useCallback(
    async (item: WishlistItem) => {
      if (items.some((i) => i.productId === item.productId)) {
        await remove(item.productId);
      } else {
        await add(item);
      }
    },
    [items, add, remove],
  );

  return (
    <WishlistContext.Provider value={{ items, loading, has, add, remove, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
