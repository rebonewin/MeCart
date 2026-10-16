"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { StorefrontProduct } from "@/types/product";

export type CompareItem = {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  categoryName: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  sizes: string[];
  colors: string[];
  material: string;
  country: string;
};

const MAX_ITEMS = 4;
const STORAGE_KEY = "mecart-compare-v1";

type CompareContextValue = {
  items: CompareItem[];
  count: number;
  max: number;
  has: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function snapshotOf(product: StorefrontProduct): CompareItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brandName: product.brandName || "—",
    categoryName: product.categoryName || "—",
    price: product.finalPrice,
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    image: product.coverImage,
    sizes: product.sizes,
    colors: product.colors,
    material: product.material || "—",
    country: product.country || "—",
  };
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CompareItem[];
          if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_ITEMS));
        }
      } catch {
        // corrupted storage — start fresh
      } finally {
        loadedRef.current = true;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — comparison stays in-memory
    }
  }, [items]);

  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    setItems((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current.filter((entry) => entry.id !== item.id);
      }
      if (current.length >= MAX_ITEMS) {
        toast.error(`Compare holds up to ${MAX_ITEMS} pieces at a time`);
        return current;
      }
      return [...current, item];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.length, max: MAX_ITEMS, has, toggle, remove, clear }),
    [items, has, toggle, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
