/**
 * MotionBus — a tiny, typed, dependency-free event bus.
 *
 * It is the seam between "something happened in the app" and "the motion
 * system should react". Producers (e.g. an add-to-cart interaction) never
 * import the animation runtime directly; they only emit. Consumers (the
 * rider controller, the checkout takeover) subscribe.
 *
 * Emitting is always safe: when nobody is listening, `emit` returns `false`
 * and callers can fall back to their synchronous behaviour.
 */

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CartAddEvent = {
  /** Stable id for the emitted interaction. */
  id: string;
  name: string;
  image: string;
  /** Viewport rect of the product image the interaction originated from. */
  from: Rect | null;
  /** Reused cart write — invoked once the package reaches the cart. */
  deliver: () => void | Promise<void>;
  /** Resolves when the interaction is fully settled (or immediately when skipped). */
  resolve: () => void;
};

export type MotionEventMap = {
  "cart:add": CartAddEvent;
  "checkout:success": { orderNumber?: string };
};

type Handler<K extends keyof MotionEventMap> = (payload: MotionEventMap[K]) => void;

class MotionBus {
  private readonly handlers = new Map<string, Set<(payload: unknown) => void>>();

  on<K extends keyof MotionEventMap>(type: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as (payload: unknown) => void);
    return () => {
      set?.delete(handler as (payload: unknown) => void);
    };
  }

  emit<K extends keyof MotionEventMap>(type: K, payload: MotionEventMap[K]): boolean {
    const set = this.handlers.get(type);
    if (!set || set.size === 0) return false;
    for (const handler of set) {
      try {
        handler(payload);
      } catch {
        // A misbehaving listener must never break the producer.
      }
    }
    return true;
  }

  has(type: keyof MotionEventMap): boolean {
    return (this.handlers.get(type)?.size ?? 0) > 0;
  }
}

export const motionBus = new MotionBus();

export function rectOf(element: Element | null | undefined): Rect | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}
