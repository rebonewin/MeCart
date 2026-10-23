"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { loadGsap } from "@/lib/motion/load-gsap";
import { useMounted } from "@/components/luxe/primitives";
import { useRider } from "./rider-provider";

type Geometry = {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  size: number;
};

/**
 * PackageFlights — the parcel that leaves a product tile and is caught by the
 * rider. It is a single portal-mounted element driven by GSAP along a
 * quadratic Bézier, so it is always on top of the page and never triggers
 * layout.
 */
export function PackageFlights() {
  const { active, phase, reduce } = useRider();
  const mounted = useMounted();
  const elementRef = useRef<HTMLDivElement>(null);
  const geometryRef = useRef<Geometry | null>(null);

  const writeTransform = useCallback((x: number, y: number, scale: number, rotate: number) => {
    const element = elementRef.current;
    if (!element) return;
    element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;
  }, []);

  // Launch: fly the parcel from its origin to the rider along an arc.
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !active || reduce) return;

    const from = active.from;
    const to = active.to;
    if (!to) return;

    const startX = from ? from.x + from.width / 2 : to.x + to.width / 2;
    const startY = from ? from.y + from.height / 2 : window.innerHeight * 0.62;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const controlX = startX + dx * 0.36;
    const controlY = Math.min(startY, endY) - Math.max(96, Math.abs(dx) * 0.16) - Math.abs(dy) * 0.1;
    const size = Math.max(30, Math.min(66, (from?.width ?? 72) * 0.5));

    geometryRef.current = { startX, startY, controlX, controlY, endX, endY, size };
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.opacity = "1";
    writeTransform(startX - size / 2, startY - size / 2, 1, 0);

    const proxy = { t: 0 };
    let disposed = false;
    let tween: { kill: () => void } | undefined;
    void loadGsap()
      .then((gsap) => {
        if (disposed) return;
        tween = gsap.to(proxy, {
          t: 1,
          duration: 0.54,
          ease: "power2.inOut",
          onUpdate: () => {
            const t = proxy.t;
            const inverse = 1 - t;
            const x = inverse * inverse * startX + 2 * inverse * t * controlX + t * t * endX;
            const y = inverse * inverse * startY + 2 * inverse * t * controlY + t * t * endY;
            writeTransform(x - size / 2, y - size / 2, 1 - 0.32 * t, (t - 0.5) * 28);
          },
        });
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      tween?.kill();
    };
  }, [active, reduce, writeTransform]);

  // Load: the parcel drops into the delivery box and disappears.
  useEffect(() => {
    const element = elementRef.current;
    const geometry = geometryRef.current;
    if (!element || !geometry || reduce) return;
    if (phase !== "load") return;

    const proxy = { t: 0 };
    let disposed = false;
    let tween: { kill: () => void } | undefined;
    void loadGsap()
      .then((gsap) => {
        if (disposed) return;
        tween = gsap.to(proxy, {
          t: 1,
          duration: 0.26,
          ease: "power2.in",
          onUpdate: () => {
            const t = proxy.t;
            const scale = (1 - 0.32) * (1 - t);
            const x = geometry.endX - geometry.size / 2 + t * 5;
            const y = geometry.endY - geometry.size / 2 + t * 10;
            element.style.opacity = `${1 - t}`;
            writeTransform(x, y, Math.max(scale, 0), 0);
          },
        });
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      tween?.kill();
    };
  }, [phase, reduce, writeTransform]);

  if (!mounted) return null;

  const visible = Boolean(active) && phase !== "idle" && phase !== "return";
  const image = active?.image;

  return createPortal(
    <div
      ref={elementRef}
      aria-hidden
      data-mecart-flight=""
      className="pointer-events-none fixed left-0 top-0 z-[180] will-change-transform"
      style={{ opacity: 0, visibility: visible ? "visible" : "hidden" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[22%] border border-[var(--lx-gold)]/60 bg-[#f7d99a] shadow-[0_18px_40px_-16px_rgba(240,196,108,0.7)]">
        {image ? (
          <Image src={image} alt="" fill sizes="66px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-[#5a4416]">M</span>
        )}
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[var(--lx-gold)]/70" />
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[var(--lx-gold)]/70" />
      </div>
    </div>,
    document.body,
  );
}
