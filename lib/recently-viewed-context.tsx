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
import type { StorefrontProduct } from "@/types/product";

const STORAGE_KEY = "mecart-recently-viewed-v1";
const MAX_ITEMS = 12;

type RecentlyViewedContextValue = {
  items: StorefrontProduct[];
  hydrated: boolean;
  track: (product: StorefrontProduct) => void;
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

function isStoredProduct(value: unknown): value is StorefrontProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<StorefrontProduct>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.finalPrice === "number"
  );
}

function readStored(): StorefrontProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredProduct).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Local-first browsing memory. The full product snapshot is kept so the
 * carousel and recommendation engine render instantly, with no server round
 * trip and no extra catalogue query.
 */
export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StorefrontProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const loadedRef = useRef(false);
  const pendingRef = useRef<StorefrontProduct[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStored();
      const pending = pendingRef.current;
      const merged = [...pending, ...stored].filter(
        (product, index, list) => list.findIndex((entry) => entry.id === product.id) === index,
      );
      loadedRef.current = true;
      pendingRef.current = [];
      setItems(merged.slice(0, MAX_ITEMS));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private mode or a full quota — the in-memory carousel still works.
    }
  }, [items]);

  const track = useCallback((product: StorefrontProduct) => {
    if (!loadedRef.current) {
      pendingRef.current = [
        product,
        ...pendingRef.current.filter((entry) => entry.id !== product.id),
      ].slice(0, MAX_ITEMS);
      return;
    }
    setItems((current) => [
      product,
      ...current.filter((entry) => entry.id !== product.id),
    ].slice(0, MAX_ITEMS));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage can be unavailable
    }
  }, []);

  const value = useMemo(
    () => ({ items, hydrated, track, clear }),
    [items, hydrated, track, clear],
  );

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewed must be used within RecentlyViewedProvider");
  }
  return context;
}
