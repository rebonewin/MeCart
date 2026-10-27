"use client";

import { useEffect, useRef } from "react";
import { useIsCoarsePointer, usePrefersReducedMotion } from "@/lib/motion";

/**
 * MaisonCursor — desktop-only cursor choreography.
 *
 * Three layers move at different weights: a precise gold point, a lagging
 * ring that reads the affordance under the pointer, and a screen-wide
 * champagne spotlight. It disables itself on touch, reduced-motion and as
 * soon as the visitor navigates by keyboard.
 */
export function MaisonCursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const coarse = useIsCoarsePointer();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (coarse || reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const layer = layerRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    const spotlight = spotlightRef.current;
    if (!layer || !ring || !dot || !label || !spotlight) return;

    document.documentElement.classList.add("lx-cursor-active");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let previousX = targetX;
    let previousY = targetY;
    let raf = 0;
    let shown = false;
    let pressed = false;
    let hovered = false;
    let labelText = "";
    let keyboard = false;

    const setVisible = (visible: boolean) => {
      if (visible === shown) return;
      shown = visible;
      layer.dataset.visible = visible ? "true" : "false";
    };

    const interactiveSelector =
      'a, button, [role="button"], [data-cursor], summary, label[for], input[type="submit"], input[type="button"], select';

    const readTarget = (node: EventTarget | null) => {
      if (!(node instanceof Element)) return null;
      return node.closest<HTMLElement>(interactiveSelector);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (keyboard) {
        keyboard = false;
        document.documentElement.classList.add("lx-cursor-active");
      }
      setVisible(true);

      const target = readTarget(event.target);
      const nextLabel = target?.dataset.cursorLabel ?? "";
      const nextHovered = Boolean(target);
      if (nextHovered !== hovered) {
        hovered = nextHovered;
        layer.dataset.hover = nextHovered ? "true" : "false";
      }
      if (nextLabel !== labelText) {
        labelText = nextLabel;
        label.textContent = nextLabel;
        if (nextLabel) layer.dataset.label = nextLabel;
        else delete layer.dataset.label;
      }
      spotlight.style.setProperty("--lx-cursor-x", `${event.clientX}px`);
      spotlight.style.setProperty("--lx-cursor-y", `${event.clientY}px`);
      if (!pressed && event.buttons === 1) {
        pressed = true;
        layer.dataset.pressed = "true";
      }
    };

    const onPointerDown = () => {
      pressed = true;
      layer.dataset.pressed = "true";
    };
    const onPointerUp = () => {
      pressed = false;
      delete layer.dataset.pressed;
    };
    const onPointerLeave = () => setVisible(false);
    const onPointerEnter = () => setVisible(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      keyboard = true;
      setVisible(false);
      document.documentElement.classList.remove("lx-cursor-active");
    };

    const loop = () => {
      const dx = targetX - ringX;
      const dy = targetY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;
      const velocity = Math.min(26, Math.hypot(targetX - previousX, targetY - previousY));
      previousX = targetX;
      previousY = targetY;
      const stretch = 1 + Math.min(0.16, velocity / 160);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) rotate(${angle}deg) scale(${stretch}, ${2 - stretch})`;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      label.style.transform = `translate3d(${targetX}px, ${targetY + 46}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerenter", onPointerEnter);
    window.addEventListener("keydown", onKeyDown);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("lx-cursor-active");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerenter", onPointerEnter);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [coarse, reduced]);

  if (coarse || reduced) return null;

  return (
    <div ref={layerRef} className="lx-cursor-layer hidden md:block" aria-hidden>
      <div ref={spotlightRef} className="lx-cursor-spotlight" />
      <div ref={ringRef} className="lx-cursor-ring" />
      <div ref={dotRef} className="lx-cursor-dot" />
      <div ref={labelRef} className="lx-cursor-label" />
    </div>
  );
}
