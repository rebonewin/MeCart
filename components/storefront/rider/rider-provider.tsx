"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimationQueue, motionBus, rectOf, usePrefersReducedMotion, type CartAddEvent } from "@/lib/motion";
import { useCart } from "@/lib/cart-context";
import { tierForCount, type CartTier, type FlightJob, type RiderPhase } from "./types";
import { PackageFlights } from "./flying-package";
import { MecoWelcome } from "./meco-welcome";

type RiderContextValue = {
  phase: RiderPhase;
  tier: CartTier;
  active: FlightJob | null;
  /** Increments on every delivery — drives the cart glow + celebration. */
  pulse: number;
  lastDelivered: string | null;
  busy: boolean;
  reduce: boolean;
  /** True while the one-time arrival scene is using the screen. */
  welcomeActive: boolean;
  /** Live cart line count (already in the cart, excluding in-flight parcels). */
  cartCount: number;
  enqueue: (job: FlightJob) => void;
};

const RiderContext = createContext<RiderContextValue | null>(null);

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const reduce = usePrefersReducedMotion();

  const [phase, setPhase] = useState<RiderPhase>("idle");
  const [active, setActive] = useState<FlightJob | null>(null);
  const [pulse, setPulse] = useState(0);
  const [lastDelivered, setLastDelivered] = useState<string | null>(null);
  const [welcomeActive, setWelcomeActive] = useState(false);

  const aliveRef = useRef(true);
  const queueRef = useRef<AnimationQueue<FlightJob> | null>(null);
  const pendingRef = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /**
   * The delivery timeline. Phases mirror the mission brief:
   * launch → catch → load → drive → deliver → celebrate → return.
   * The reused cart write (`job.deliver`) fires exactly when the parcel
   * reaches the cart, so the badge and the animation agree.
   */
  const runSequence = useCallback(async (job: FlightJob) => {
    const pressure = Math.max(0, pendingRef.current - 1);
    const speed = pressure > 3 ? 0.55 : pressure > 1 ? 0.78 : 1;
    const step = (ms: number) => sleep(ms * speed);

    const target = rectOf(document.getElementById("mecart-rider-anchor")) ?? rectOf(document.getElementById("mecart-cart-anchor"));
    const resolved: FlightJob = target ? { ...job, to: target } : job;

    setActive(resolved);
    setPhase("launch");
    await step(540);
    if (!aliveRef.current) return;

    setPhase("catch");
    await step(300);
    if (!aliveRef.current) return;

    setPhase("load");
    await step(260);
    if (!aliveRef.current) return;

    setPhase("drive");
    await step(540);

    // Deliver: the single source of truth for the cart write. The animation
    // never stalls on a slow network — the write keeps running in the
    // background while the rider finishes its route.
    try {
      await Promise.race([
        Promise.resolve(resolved.deliver()).catch(() => undefined),
        sleep(1600 * speed),
      ]);
    } catch {
      // A failed write must not stall the queue; the user can retry.
    }
    if (!aliveRef.current) return;

    setPulse((value) => value + 1);
    setLastDelivered(resolved.name);
    setPhase("deliver");
    await step(280);
    if (!aliveRef.current) return;

    setPhase("celebrate");
    await step(220);
    if (!aliveRef.current) return;

    setPhase("return");
    await step(240);
    if (!aliveRef.current) return;

    setPhase("idle");
    setActive(null);
    resolved.resolve();
    pendingRef.current = Math.max(0, pendingRef.current - 1);
  }, []);

  // The queue owns the single, non-overlapping rider sequence.
  useEffect(() => {
    queueRef.current = new AnimationQueue<FlightJob>((job) => runSequence(job), {
      max: 24,
      onOverflow: (job) => {
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        void job.deliver();
        job.resolve();
      },
    });
  }, [runSequence]);

  // Subscribe to animation events emitted by the add-to-cart hook.
  useEffect(() => {
    return motionBus.on("cart:add", (event: CartAddEvent) => {
      pendingRef.current += 1;
      queueRef.current?.enqueue({
        id: event.id,
        name: event.name,
        image: event.image,
        from: event.from,
        to: null,
        deliver: event.deliver,
        resolve: event.resolve,
      });
    });
  }, []);

  // Never lose a cart write on teardown or page hide.
  useEffect(() => {
    const flush = () => {
      pendingRef.current = 0;
      queueRef.current?.clear((job) => {
        void job.deliver();
        job.resolve();
      });
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const enqueue = useCallback((job: FlightJob) => {
    queueRef.current?.enqueue(job);
  }, []);

  const beginWelcome = useCallback(() => setWelcomeActive(true), []);
  const endWelcome = useCallback(() => setWelcomeActive(false), []);

  const tier = tierForCount(cart.count);

  const value = useMemo<RiderContextValue>(
    () => ({
      phase,
      tier,
      active,
      pulse,
      lastDelivered,
      busy: active !== null,
      reduce,
      welcomeActive,
      cartCount: cart.count,
      enqueue,
    }),
    [phase, tier, active, pulse, lastDelivered, reduce, welcomeActive, cart.count, enqueue],
  );

  return (
    <RiderContext.Provider value={value}>
      {children}
      <MecoWelcome onStart={beginWelcome} onDone={endWelcome} />
      <PackageFlights />
      <div role="status" aria-live="polite" className="sr-only">
        {lastDelivered ? `${lastDelivered} added to your bag` : ""}
      </div>
    </RiderContext.Provider>
  );
}

export function useRider(): RiderContextValue {
  const context = useContext(RiderContext);
  if (!context) throw new Error("useRider must be used within RiderProvider");
  return context;
}
