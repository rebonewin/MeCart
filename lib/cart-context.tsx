"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSupabase, hasSupabaseSessionCookie } from "@/lib/supabase/browser";
import { ensureSession } from "@/lib/auth/guest-session";
import {
  addCartItem,
  clearCart as repoClearCart,
  listCartItems,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/repositories/cart";
import {
  applyCartMutation,
  enqueueCartOperation,
  readCartMirror,
  readCartQueue,
  requestCartBackgroundSync,
  writeCartMirror,
  writeCartQueue,
  type CartMutation,
} from "@/lib/offline/cart";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

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
  /** True when the device is offline and the cart is backed by the local mirror. */
  offline: boolean;
  /** Number of mutations waiting to reach Supabase. */
  pendingSync: number;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string, size?: string, color?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Replay the local queue. Safe to call at any time; returns true when drained. */
  flushPending: () => Promise<boolean>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mirrorReady, setMirrorReady] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const online = useOnlineStatus();
  const offline = !online;
  const mergeUserIdRef = useRef<string | null>(null);
  const wasOfflineRef = useRef(false);

  /** Pull the authoritative cart from Supabase. On failure, keep the mirror. */
  const refresh = useCallback(async (userId: string) => {
    try {
      const supabase = await getSupabase();
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
      // Keep the local mirror visible; the queue will replay on reconnect.
    } finally {
      setLoading(false);
    }
  }, []);

  const flushPending = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.onLine) return false;
    let queue = readCartQueue();
    if (!queue.length) {
      setPendingSync(0);
      return true;
    }

    const userId = await ensureSession().catch(() => null);
    if (!userId) return false;
    const supabase = await getSupabase();

    while (queue.length) {
      const operation = queue[0];
      try {
        if (operation.type === "add") {
          await addCartItem(supabase, userId, {
            productId: operation.item.productId,
            quantity: operation.item.quantity,
            size: operation.item.size,
            color: operation.item.color,
          });
        } else if (operation.type === "remove") {
          await removeCartItem(
            supabase,
            userId,
            operation.productId,
            operation.size,
            operation.color,
          );
        } else if (operation.type === "update") {
          await updateCartItemQuantity(
            supabase,
            userId,
            operation.productId,
            operation.quantity,
            operation.size,
            operation.color,
          );
        } else {
          await repoClearCart(supabase, userId);
        }
        queue = queue.slice(1);
        writeCartQueue(queue);
        setPendingSync(queue.length);
      } catch {
        break;
      }
    }

    return queue.length === 0;
  }, []);

  const syncNow = useCallback(async () => {
    const drained = await flushPending();
    if (!drained) return;
    const userId = await ensureSession().catch(() => null);
    if (userId) await refresh(userId);
  }, [flushPending, refresh]);

  /** Restore the local mirror before any network work starts. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readCartMirror();
      const queueLength = readCartQueue().length;
      if (stored.length) setItems(stored);
      setPendingSync(queueLength);
      setMirrorReady(true);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  /** Keep a local mirror for instant and offline reads. */
  useEffect(() => {
    if (!mirrorReady) return;
    writeCartMirror(items);
  }, [items, mirrorReady]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    let timer = 0;

    async function boot() {
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      const userId = await ensureSession().catch(() => null);
      if (!active) return;
      if (!userId) {
        setLoading(false);
        return;
      }

      mergeUserIdRef.current = userId;
      await syncNow();
      if (!active) return;

      const supabase = await getSupabase();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
          const previous = mergeUserIdRef.current;
          mergeUserIdRef.current = session.user.id;

          if (previous && previous !== session.user.id) {
            // Fold the anonymous cart into the real account (best effort).
            try {
              await supabase.rpc("merge_guest_cart", { p_from_user: previous });
            } catch {
              // The server action merge covers the sign-in path too.
            }
          }
          await syncNow();
        }
        if (event === "SIGNED_OUT") {
          setItems([]);
          writeCartMirror([]);
          const anonId = await ensureSession().catch(() => null);
          if (anonId) {
            mergeUserIdRef.current = anonId;
            await refresh(anonId);
          }
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    }

    // Guests get the storefront first: the local mirror is already painted, so
    // the remote reconciliation can wait until after the first interaction
    // window. Signed-in carts restore sooner.
    const signedIn = hasSupabaseSessionCookie();
    const hasLocalActivity = readCartMirror().length > 0 || readCartQueue().length > 0;
    const delay = signedIn ? 1100 : hasLocalActivity ? 1800 : 7000;
    timer = window.setTimeout(() => {
      if (active) void boot();
    }, delay);

    return () => {
      active = false;
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, [refresh, syncNow]);

  /** Replay queued cart changes and reconcile as soon as the network returns. */
  useEffect(() => {
    if (online && wasOfflineRef.current) {
      void syncNow();
    }
    wasOfflineRef.current = !online;
  }, [online, syncNow]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "MECART_FLUSH_CART") void syncNow();
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMessage);
      return () => navigator.serviceWorker.removeEventListener("message", onMessage);
    }
    return undefined;
  }, [syncNow]);

  const mutate = useCallback(
    async (mutation: CartMutation, remote: (userId: string) => Promise<void>) => {
      const applyLocally = () => {
        setItems((current) => applyCartMutation(current, mutation));
        const queued = enqueueCartOperation(mutation);
        setPendingSync(queued);
        void requestCartBackgroundSync();
      };

      if (!navigator.onLine) {
        applyLocally();
        return;
      }

      try {
        const userId = await ensureSession();
        if (!userId) throw new Error("No cart session");
        await remote(userId);
        await refresh(userId);
      } catch {
        applyLocally();
      }
    },
    [refresh],
  );

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback(
    async (item: CartItem) => {
      await mutate({ type: "add", item }, async (userId) => {
        const supabase = await getSupabase();
        await addCartItem(supabase, userId, {
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        });
      });
    },
    [mutate],
  );

  const removeItem = useCallback(
    async (productId: string, size?: string, color?: string) => {
      await mutate({ type: "remove", productId, size, color }, async (userId) => {
        const supabase = await getSupabase();
        await removeCartItem(supabase, userId, productId, size, color);
      });
    },
    [mutate],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, size?: string, color?: string) => {
      await mutate(
        { type: "update", productId, quantity, size, color },
        async (userId) => {
          const supabase = await getSupabase();
          await updateCartItemQuantity(supabase, userId, productId, quantity, size, color);
        },
      );
    },
    [mutate],
  );

  const clear = useCallback(async () => {
    await mutate({ type: "clear" }, async (userId) => {
      const supabase = await getSupabase();
      await repoClearCart(supabase, userId);
    });
  }, [mutate]);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        loading,
        offline,
        pendingSync,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        flushPending,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
