"use client";

import type { CartItem } from "@/lib/cart-context";

export type CartMutation =
  | { type: "add"; item: CartItem }
  | { type: "remove"; productId: string; size?: string; color?: string }
  | { type: "update"; productId: string; quantity: number; size?: string; color?: string }
  | { type: "clear" };

export type PendingCartOperation = CartMutation & { id: string; at: number };

const MIRROR_KEY = "mecart-cart-mirror-v1";
const QUEUE_KEY = "mecart-cart-queue-v1";
const MAX_QUEUE = 80;

function operationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.slug === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number"
  );
}

export function readCartMirror(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(MIRROR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function writeCartMirror(items: CartItem[]) {
  try {
    window.localStorage.setItem(MIRROR_KEY, JSON.stringify(items));
  } catch {
    // storage quota or private mode
  }
}

export function readCartQueue(): PendingCartOperation[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is PendingCartOperation =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as { id?: unknown }).id === "string" &&
        ["add", "remove", "update", "clear"].includes(
          String((entry as { type?: unknown }).type),
        ),
    );
  } catch {
    return [];
  }
}

export function writeCartQueue(queue: PendingCartOperation[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    // storage quota or private mode
  }
}

export function enqueueCartOperation(operation: CartMutation) {
  const queue = readCartQueue();
  const next = { ...operation, id: operationId(), at: Date.now() } as PendingCartOperation;
  const trimmed = [...queue, next].slice(-MAX_QUEUE);
  writeCartQueue(trimmed);
  return trimmed.length;
}

function sameLine(item: CartItem, productId: string, size?: string, color?: string) {
  return (
    item.productId === productId &&
    (item.size ?? "") === (size ?? "") &&
    (item.color ?? "") === (color ?? "")
  );
}

export function applyCartMutation(items: CartItem[], operation: CartMutation): CartItem[] {
  if (operation.type === "clear") return [];
  if (operation.type === "add") {
    const index = items.findIndex((item) =>
      sameLine(item, operation.item.productId, operation.item.size, operation.item.color),
    );
    if (index < 0) return [...items, operation.item];
    return items.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, quantity: item.quantity + operation.item.quantity }
        : item,
    );
  }
  if (operation.type === "remove") {
    return items.filter(
      (item) => !sameLine(item, operation.productId, operation.size, operation.color),
    );
  }
  if (operation.quantity <= 0) {
    return items.filter(
      (item) => !sameLine(item, operation.productId, operation.size, operation.color),
    );
  }
  return items.map((item) =>
    sameLine(item, operation.productId, operation.size, operation.color)
      ? { ...item, quantity: operation.quantity }
      : item,
  );
}

type SyncRegistration = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

/**
 * Asks the service worker to replay the cart queue when connectivity returns.
 * The in-page `online` listener remains the primary path; background sync is the
 * resilience layer for browsers that support it.
 */
export async function requestCartBackgroundSync() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration = (await navigator.serviceWorker.ready) as SyncRegistration;
    if (registration.sync) {
      await registration.sync.register("mecart-cart-sync");
    } else {
      navigator.serviceWorker.controller?.postMessage({ type: "QUEUE_CART_SYNC" });
    }
    return true;
  } catch {
    return false;
  }
}
