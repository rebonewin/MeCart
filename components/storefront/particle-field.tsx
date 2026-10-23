"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";

type Particle = {
  x: number;
  y: number;
  z: number;
  r: number;
  vx: number;
  vy: number;
  color: readonly [number, number, number];
  twinkle: number;
};

const PALETTE = [
  [129, 140, 248],
  [34, 211, 238],
  [167, 139, 250],
  [240, 196, 108],
] as const;

/**
 * ParticleField — a GPU-cheap ambient dust layer rendered on a 2D canvas.
 *
 * • DPR is capped at 2 and density is derived from area.
 * • The RAF loop stops when the canvas leaves the viewport.
 * • Pointer parallax is applied per-particle depth for a sense of volume.
 * • Nothing renders at all under reduced-motion.
 *
 * All animation state lives inside a single effect closure, so there is no
 * cross-render mutation and the loop is torn down deterministically.
 */
export function ParticleField({
  className,
  density = 1,
  interactive = true,
}: {
  className?: string;
  density?: number;
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const pointer = { x: 0.5, y: 0.4 };

    const build = () => {
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      if (!nextWidth || !nextHeight) return;
      dpr = nextDpr;
      width = nextWidth;
      height = nextHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      const target = Math.round(Math.min(110, Math.max(30, (width * height) / 17000)) * density);
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        r: 0.4 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.05 - Math.random() * 0.2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    build();

    const resizeObserver = new ResizeObserver(build);
    resizeObserver.observe(canvas);

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
    };
    if (interactive) window.addEventListener("pointermove", onPointer, { passive: true });

    const loop = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const elapsed = (now - start) / 1000;

      if (visible && width && height) {
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = "lighter";

        const offsetX = (pointer.x - 0.5) * 2;
        const offsetY = (pointer.y - 0.5) * 2;
        const step = dt * 60;

        for (const particle of particles) {
          particle.x += particle.vx * step;
          particle.y += particle.vy * step;

          if (particle.y < -8) particle.y = height + 8;
          if (particle.y > height + 8) particle.y = -8;
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;

          const depth = 0.4 + particle.z * 0.9;
          const drawX = particle.x + offsetX * (10 + particle.z * 34);
          const drawY = particle.y + offsetY * (10 + particle.z * 34);
          const twinkle = 0.65 + 0.35 * Math.sin(elapsed * 1.6 + particle.twinkle);
          const alpha = (0.12 + particle.z * 0.5) * twinkle;
          const [r, g, b] = particle.color;

          context.beginPath();
          context.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          context.arc(drawX, drawY, particle.r * depth, 0, Math.PI * 2);
          context.fill();
        }

        context.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (raf || reduce) return;
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
      ).connection;
      const lightweight =
        window.matchMedia("(pointer: coarse)").matches ||
        connection?.saveData ||
        connection?.effectiveType === "2g";
      if (lightweight) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          startLoop();
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "140px" },
    );
    intersectionObserver.observe(canvas);

    if (!reduce) startLoop();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (interactive) window.removeEventListener("pointermove", onPointer);
    };
  }, [density, interactive, reduce]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
