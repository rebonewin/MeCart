"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useIsCoarsePointer, useIsSmallScreen, usePrefersReducedMotion } from "@/lib/motion";

const AtelierVault = dynamic(
  () => import("./atelier-vault").then((module) => module.AtelierVault),
  { ssr: false },
);

const AuthAtelier = dynamic(
  () => import("./auth-atelier").then((module) => module.AuthAtelier),
  { ssr: false },
);

/**
 * VaultStage — the mounting harness for the Sable Vault centrepiece.
 *
 * Full experience      fine pointer · ≥1024px · motion allowed · WebGL
 * CSS "atelier plate"  touch · reduced motion · small screens · GL failure
 *
 * The real canvas boots only after first paint settles (no LCP contention)
 * and its render loop pauses whenever the stage scrolls out of view. The
 * fallback composition mirrors the same silhouette so both paths read as
 * one object.
 */
export type VaultStageVariant = "hero" | "relic" | "auth";

class StageBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Atelier plates — the no-WebGL compositions. Same object, softer     */
/* media (pure paint, zero scripts).                                   */
/* ------------------------------------------------------------------ */

function VaultFallback({ variant, className }: { variant: VaultStageVariant; className?: string }) {
  if (variant === "auth") return <GateFallback className={className} />;
  return (
    <div
      aria-hidden
      className={cn("lx-vault-fallback pointer-events-none absolute inset-0", className)}
    >
      <span className="lx-vault-fallback-glow" />
      <span className="lx-vault-fallback-ring" />
      <span className="lx-vault-fallback-ring lx-vault-fallback-ring--far" />
      <span className="lx-vault-fallback-crystal" />
      <span className="lx-vault-fallback-dais" />
      {variant === "relic" ? <span className="sr-only" /> : null}
    </div>
  );
}

function GateFallback({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("lx-gate-fallback pointer-events-none absolute inset-0", className)}>
      <span className="lx-gate-fallback-glow" />
      <span className="lx-gate-fallback-ring" />
      <span className="lx-gate-fallback-ring lx-gate-fallback-ring--far" />
      <span className="lx-gate-fallback-monolith" />
      <span className="lx-gate-fallback-dais" />
    </div>
  );
}

export function VaultStage({
  variant = "hero",
  className,
}: {
  variant?: VaultStageVariant;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const [booted, setBooted] = useState(false);
  const [paused, setPaused] = useState(true);
  const smallScreen = useIsSmallScreen();

  /* Boot only when the stage is (or is about to be) on screen, and only
     after the browser is idle — protects the LCP headline and hydration. */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced || coarse) return;

    let cancelIdle: () => void = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const mutate = () => {
          if (!window.matchMedia("(min-width: 1024px)").matches) return;
          setBooted(true);
        };
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(mutate);
        } else {
          const timer = window.setTimeout(mutate, 180);
          cancelIdle = () => window.clearTimeout(timer);
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      cancelIdle();
    };
  }, [coarse, reduced]);

  /* Pause when not visible — keeps the loop honest and the GPU idle. */
  useEffect(() => {
    if (!booted) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(Boolean(!entry?.isIntersecting)),
      { rootMargin: "120px" },
    );
    observer.observe(host);
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [booted]);

  const fallback = <VaultFallback variant={variant} />;
  const useGl = booted && !reduced && !coarse && !smallScreen;

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {fallback}
      {useGl ? (
        <StageBoundary fallback={fallback}>
          {variant === "auth" ? (
            <AuthAtelier paused={paused} />
          ) : (
            <AtelierVault variant={variant} paused={paused} />
          )}
        </StageBoundary>
      ) : null}
    </div>
  );
}
