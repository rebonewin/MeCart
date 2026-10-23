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
  sku: string;
  description: string;
  brandName: string;
  categoryName: string;
  subCategoryName: string;
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
  weight: number;
  createdAt: string;
  bestSeller: boolean;
  newArrival: boolean;
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

function normalizeStored(value: unknown): CompareItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CompareItem>;
  if (!item.id || !item.name || !item.slug) return null;
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    sku: item.sku ?? "—",
    description: item.description ?? "",
    brandName: item.brandName ?? "—",
    categoryName: item.categoryName ?? "—",
    subCategoryName: item.subCategoryName ?? "—",
    price: Number(item.price ?? 0),
    originalPrice: Number(item.originalPrice ?? item.price ?? 0),
    discountPercent: Number(item.discountPercent ?? 0),
    rating: Number(item.rating ?? 0),
    reviewCount: Number(item.reviewCount ?? 0),
    stock: Number(item.stock ?? 0),
    image: item.image ?? "",
    sizes: Array.isArray(item.sizes) ? item.sizes.filter((entry): entry is string => typeof entry === "string") : [],
    colors: Array.isArray(item.colors) ? item.colors.filter((entry): entry is string => typeof entry === "string") : [],
    material: item.material ?? "—",
    country: item.country ?? "—",
    weight: Number(item.weight ?? 0),
    createdAt: item.createdAt ?? new Date().toISOString(),
    bestSeller: Boolean(item.bestSeller),
    newArrival: Boolean(item.newArrival),
  };
}

export function snapshotOf(product: StorefrontProduct): CompareItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    brandName: product.brandName || "—",
    categoryName: product.categoryName || "—",
    subCategoryName: product.subCategoryName || "—",
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
    weight: product.weight,
    createdAt: product.createdAt,
    bestSeller: Boolean(product.bestSeller),
    newArrival: Boolean(product.newArrival),
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
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            setItems(
              parsed
                .map(normalizeStored)
                .filter((item): item is CompareItem => Boolean(item))
                .slice(0, MAX_ITEMS),
            );
          }
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
