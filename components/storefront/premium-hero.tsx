"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Counter, Magnetic, RippleButton } from "@/components/luxe/primitives";
import { LiveSearch } from "@/components/storefront/live-search";
import { VaultStage } from "@/components/luxe/webgl/vault-stage";
import { usePointerSpotlight } from "@/lib/motion";
import type { StorefrontStats } from "@/types/product";

const SERVICES = [
  { icon: Truck, title: "Complimentary shipping" },
  { icon: ShieldCheck, title: "Secured checkout" },
  { icon: RotateCcw, title: "7-day atelier returns" },
  { icon: Headphones, title: "24/7 concierge" },
] as const;

export function PremiumHero({ stats }: { stats: StorefrontStats }) {
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightRef = usePointerSpotlight<HTMLDivElement>();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const statItems = [
    { value: stats.products, decimals: 0, suffix: "+", label: "Curated products" },
    { value: stats.categories, decimals: 0, suffix: "", label: "Collections" },
    { value: stats.brands, decimals: 0, suffix: "", label: "Maisons & brands" },
    { value: stats.rating, decimals: 1, suffix: "", label: "Average rating" },
  ];

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="lx-dark-scene relative isolate flex min-h-[calc(100svh-4.5625rem)] flex-col overflow-hidden bg-[var(--lx-bg)] lg:min-h-[calc(100svh-6.5625rem)]"
    >
      {/* ambient stage — liquid light field + the Sable Vault centrepiece */}
      <motion.div className="absolute inset-0 -z-10" style={{ scale: backdropScale, y: backdropY }} aria-hidden>
        {/* Paint-only light field — the WebGL budget belongs to the vault. */}
        <div className="lx-liquid-fallback absolute inset-0 opacity-60" />
        <div className="lx-liquid-grain absolute inset-0" />
        <VaultStage variant="hero" className="hidden lg:block" />
        <div ref={spotlightRef} className="lx-spotlight absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_-12%,transparent_36%,rgba(11,11,15,0.74)_100%)]" />
      </motion.div>

      {/* museum label for the centrepiece — the atelier voice, kept quiet */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[7.5%] right-[9%] z-10 hidden flex-col items-end gap-1 text-right xl:flex"
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
          Object № 01
        </p>
        <p className="max-w-[15rem] text-[11px] leading-5 text-white/45">
          <span className="lx-serif text-white/80">Le Cristal de Sable</span>
          <br />
          blown, cut and gilded in the atelier
        </p>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pb-20 pt-14 text-center sm:px-6 lg:items-start lg:px-8 lg:pb-24 lg:text-left">
        <div className="lx-rise lx-glass inline-flex max-w-full flex-wrap items-center justify-center gap-2.5 rounded-full px-4 py-2 text-center">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/80 sm:text-[10px] sm:tracking-[0.28em]">
            The MeCart Atelier — SS26 live
          </span>
          <span className="inline-flex h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--lx-emerald)]" />
        </div>

        <h1 className="lx-hero-title mt-7 max-w-[42rem] text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4rem] 2xl:max-w-[46rem] 2xl:text-[4.4rem]">
          Objects of <span className="lx-serif text-[var(--lx-gold)]">desire,</span>
          <br className="hidden sm:block" /> delivered in <span className="lx-text-grad">motion</span>.
        </h1>

        <p
          className="lx-rise mt-6 max-w-xl text-base leading-7 text-[var(--lx-muted)] sm:text-lg"
          style={{ animationDelay: "60ms" }}
        >
          Fashion, audio, timepieces and technology — gathered from the world&apos;s most considered
          makers, then sent to your door like a small event.
        </p>

        <div
          className="lx-rise mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
          style={{ animationDelay: "120ms" }}
        >
          <Magnetic>
            <span data-cursor-label="Collection">
              <RippleButton href="/products" size="lg" variant="primary">
                Enter the collection
                <ArrowRight className="h-4 w-4" aria-hidden />
              </RippleButton>
            </span>
          </Magnetic>
          <Magnetic strength={0.16}>
            <span data-cursor-label="Explore">
              <RippleButton href="/categories" size="lg" variant="glass">
                Browse collections
              </RippleButton>
            </span>
          </Magnetic>
        </div>

        <div
          className="lx-rise mt-9 w-full max-w-xl"
          style={{ animationDelay: "180ms" }}
        >
          <LiveSearch />
        </div>

        <dl
          className="lx-rise mt-10 grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
          style={{ animationDelay: "240ms" }}
        >
          {statItems.map((item) => (
            <div key={item.label} className="border-l border-white/10 pl-4 text-left">
              <dd className="text-2xl font-semibold text-white">
                <Counter value={item.value} decimals={item.decimals} suffix={item.suffix} />
              </dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--lx-muted)]">{item.label}</dt>
            </div>
          ))}
        </dl>

        <div
          className="lx-rise mt-10 flex w-full max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-[11px] text-white/55 lg:justify-start"
          style={{ animationDelay: "300ms" }}
        >
          {SERVICES.map((service) => (
            <span key={service.title} className="inline-flex items-center gap-2 whitespace-nowrap">
              <service.icon className="h-3.5 w-3.5 shrink-0 text-[var(--lx-gold)]/80" aria-hidden />
              {service.title}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
