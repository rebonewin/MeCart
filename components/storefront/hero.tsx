"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Counter, Magnetic, RippleButton, Stars } from "@/components/luxe/primitives";
import { LiveSearch } from "@/components/storefront/live-search";
import type { StorefrontProduct, StorefrontStats } from "@/types/product";
import { cn } from "@/lib/cn";

const HeroScene = dynamic(() => import("@/components/storefront/hero-scene").then((mod) => mod.HeroScene), {
  ssr: false,
});

const SERVICES = [
  { icon: Truck, title: "Complimentary shipping", text: "On qualifying orders" },
  { icon: ShieldCheck, title: "Secured checkout", text: "Encrypted end-to-end" },
  { icon: RotateCcw, title: "7-day atelier returns", text: "Effortless and free" },
  { icon: Headphones, title: "24/7 concierge", text: "Humans, not bots" },
] as const;

function ProductChip({
  product,
  label,
  className,
  style,
}: {
  product: StorefrontProduct;
  label: string;
  className?: string;
  style?: React.ComponentProps<typeof motion.div>["style"];
}) {
  return (
    <motion.div style={style} className={cn("lx-glass lx-panel-glow absolute w-60 rounded-2xl p-3", className)}>
      <div className="flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {product.coverImage ? (
            <Image src={product.coverImage} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 text-sm font-bold text-white">
              {product.name[0]}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white">{product.name}</span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--lx-emerald)]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">{label}</span>
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold text-[var(--lx-gold)]">${product.finalPrice.toFixed(0)}</span>
      </div>
    </motion.div>
  );
}

export function HeroSection({ stats, artifacts }: { stats: StorefrontStats; artifacts: StorefrontProduct[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [sceneOn, setSceneOn] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setSceneOn(entry.isIntersecting), {
      rootMargin: "200px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.05]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.09]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 55, damping: 18, mass: 0.5 });
  const py = useSpring(my, { stiffness: 55, damping: 18, mass: 0.5 });

  useEffect(() => {
    if (reduced) return;
    const handler = (event: PointerEvent) => {
      mx.set((event.clientX / window.innerWidth - 0.5) * 24);
      my.set((event.clientY / window.innerHeight - 0.5) * 16);
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, [mx, my, reduced]);

  const chipAx = useTransform(px, (value) => value);
  const chipAy = useTransform(py, (value) => value);
  const chipBx = useTransform(px, (value) => value * -0.78);
  const chipBy = useTransform(py, (value) => value * -0.62);
  const chipCx = useTransform(px, (value) => value * 0.5);
  const chipCy = useTransform(py, (value) => value * -0.38);

  const [lead, second] = artifacts;

  const statItems = [
    { value: stats.products, decimals: 0, suffix: "+", label: "Curated products" },
    { value: stats.categories, decimals: 0, suffix: "", label: "Collections" },
    { value: stats.brands, decimals: 0, suffix: "", label: "Maisons & brands" },
    { value: stats.rating, decimals: 1, suffix: "", label: "Average rating" },
  ];

  return (
    <section ref={sectionRef} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* 3D stage */}
      <motion.div className="absolute inset-0 z-0" style={{ scale: sceneScale }} aria-hidden>
        {sceneOn && !reduced ? <HeroScene /> : null}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_18%_42%,rgba(5,6,14,0.82)_0%,transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#05060e]/70 to-[#05060e]" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-24 pt-12 sm:px-6 lg:px-8"
      >
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lx-glass inline-flex items-center gap-2.5 rounded-full px-4 py-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--lx-gold)]" aria-hidden />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/80">
                SS26 Atelier drop — live now
              </span>
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--lx-emerald)]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-2xl text-[2.7rem] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]"
            >
              Objects of <span className="lx-serif text-[var(--lx-gold)]">desire,</span>
              <br className="hidden sm:block" /> engineered for <span className="lx-text-grad">tomorrow</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-xl text-base leading-7 text-[var(--lx-muted)] sm:text-lg"
            >
              Aurora-grade curation of fashion, audio, timepieces and technology — assembled by MeCart
              Intelligence, delivered with atelier care.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Magnetic>
                <RippleButton href="/products" size="lg" variant="primary">
                  Enter the collection
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </RippleButton>
              </Magnetic>
              <Magnetic strength={0.16}>
                <RippleButton href="/categories" size="lg" variant="glass">
                  Browse collections
                </RippleButton>
              </Magnetic>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 max-w-xl"
            >
              <LiveSearch />
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
            >
              {statItems.map((item) => (
                <div key={item.label} className="border-l border-white/10 pl-4">
                  <dd className="text-2xl font-semibold text-white">
                    <Counter value={item.value} decimals={item.decimals} suffix={item.suffix} />
                  </dd>
                  <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--lx-muted)]">
                    {item.label}
                  </dt>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* floating artifact chips */}
          <div className="relative hidden h-[26rem] lg:block">
            {lead ? (
              <ProductChip
                product={lead}
                label="Trending now"
                style={{ x: chipAx, y: chipAy, top: "4%", left: "2%" }}
              />
            ) : null}
            <motion.div
              style={{ x: chipCx, y: chipCy }}
              className="lx-glass lx-panel-glow absolute bottom-[20%] left-[10%] w-56 rounded-2xl p-4"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-cyan)]">
                Live inventory
              </p>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  <Counter value={second?.stock ?? 24} />
                </span>
                <span className="text-xs text-[var(--lx-muted)]">units ready to ship</span>
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-[var(--lx-emerald)] to-[var(--lx-cyan)]"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "72%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
            <motion.div
              style={{ x: chipBx, y: chipBy }}
              className="lx-glass lx-panel-glow absolute right-[2%] top-[38%] w-52 rounded-2xl p-4"
            >
              <Stars rating={stats.rating} size={14} />
              <p className="mt-2 text-sm font-semibold text-white">
                <Counter value={stats.rating} decimals={1} /> / 5.0
              </p>
              <p className="mt-1 text-xs text-[var(--lx-muted)]">
                from <Counter value={Math.max(stats.products * 3, 120)} suffix="+" /> verified reviews
              </p>
            </motion.div>
          </div>
        </div>

        {/* services strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="lx-glass flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors duration-300 hover:bg-white/10"
            >
              <service.icon className="h-5 w-5 shrink-0 text-[var(--lx-cyan)]" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white sm:text-sm">{service.title}</p>
                <p className="truncate text-[11px] text-[var(--lx-muted)]">{service.text}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
        <div className="mx-auto flex h-9 w-[22px] items-start justify-center rounded-full border border-white/25 p-1.5">
          <span className="lx-scroll-cue h-1.5 w-1.5 rounded-full bg-[var(--lx-cyan)]" />
        </div>
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">Scroll</p>
      </div>
    </section>
  );
}
