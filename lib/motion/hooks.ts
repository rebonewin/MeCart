"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const COARSE_QUERY = "(pointer: coarse)";

function subscribeMedia(query: string, callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function matchesMedia(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

/** SSR-safe `prefers-reduced-motion` without a setState-in-effect. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => subscribeMedia(REDUCED_QUERY, cb),
    () => matchesMedia(REDUCED_QUERY),
    () => false,
  );
}

/** SSR-safe coarse-pointer (touch) detection. */
export function useIsCoarsePointer(): boolean {
  return useSyncExternalStore(
    (cb) => subscribeMedia(COARSE_QUERY, cb),
    () => matchesMedia(COARSE_QUERY),
    () => false,
  );
}

/**
 * useReveal — IntersectionObserver-driven scroll reveal. Returns a ref to
 * attach and whether the element has entered the viewport.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const once = options?.once ?? true;
  const rootMargin = options?.rootMargin ?? "0px 0px -12% 0px";
  const threshold = options?.threshold ?? 0.15;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}

/**
 * usePointerSpotlight — writes smoothed pointer coordinates to `--mx` / `--my`
 * CSS custom properties on the returned ref. Consumers paint a radial
 * highlight from those variables. Disabled for touch + reduced-motion.
 */
export function usePointerSpotlight<T extends HTMLElement = HTMLDivElement>(
  enabled = true,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    if (matchesMedia(COARSE_QUERY) || matchesMedia(REDUCED_QUERY)) return;

    let raf = 0;
    let running = false;
    let targetX = 50;
    let targetY = 40;
    let currentX = 50;
    let currentY = 40;

    const loop = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * 0.1;
      currentY += dy * 0.1;
      element.style.setProperty("--mx", `${currentX.toFixed(2)}%`);
      element.style.setProperty("--my", `${currentY.toFixed(2)}%`);

      // Park the loop once the highlight has caught up; idle pages cost 0 rAF.
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      targetX = ((event.clientX - rect.left) / rect.width) * 100;
      targetY = ((event.clientY - rect.top) / rect.height) * 100;
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    kick();
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return ref;
}

/** A requestAnimationFrame loop with delta time, paused when `active` is false. */
export function useRaf(callback: (dt: number, elapsed: number) => void, active = true): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      callbackRef.current(dt, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Scroll-linked vertical parallax with a spring-smoothed output. */
export function useScrollParallax<T extends HTMLElement = HTMLDivElement>(options?: {
  distance?: number;
  smoothing?: boolean;
}): { ref: React.RefObject<T | null>; progress: MotionValue<number>; y: MotionValue<number> } {
  const ref = useRef<T>(null);
  const distance = options?.distance ?? 120;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [0, distance]);
  const smoothed = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.4 });
  const y = options?.smoothing === false ? raw : smoothed;
  return { ref, progress: scrollYProgress, y };
}
