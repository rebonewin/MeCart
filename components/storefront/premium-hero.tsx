"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Counter, Magnetic, RippleButton, Stars } from "@/components/luxe/primitives";
import { LiveSearch } from "@/components/storefront/live-search";
import { ParticleField } from "@/components/storefront/particle-field";
import { usePointerSpotlight, usePrefersReducedMotion } from "@/lib/motion";
import type { StorefrontProduct, StorefrontStats } from "@/types/product";
import { cn } from "@/lib/cn";

const SERVICES = [
  { icon: Truck, title: "Complimentary shipping", text: "On qualifying orders" },
  { icon: ShieldCheck, title: "Secured checkout", text: "Encrypted end-to-end" },
  { icon: RotateCcw, title: "7-day atelier returns", text: "Effortless and free" },
  { icon: Headphones, title: "24/7 concierge", text: "Humans, not bots" },
] as const;

const CHIP_POSITIONS = [
  { className: "left-[4%] top-[16%]", factor: 1 },
  { className: "right-[4%] top-[22%]", factor: -0.82 },
  { className: "bottom-[24%] left-[7%]", factor: 0.62 },
  { className: "bottom-[20%] right-[6%]", factor: -0.55 },
] as const;

function FloatingChip({
  product,
  label,
  className,
  x,
  y,
  factor,
}: {
  product: StorefrontProduct;
  label: string;
  className?: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  factor: number;
}) {
  const offsetX = useTransform(x, (value) => value * factor);
  const offsetY = useTransform(y, (value) => value * factor);
  return (
    <motion.div
      style={{ x: offsetX, y: offsetY }}
      className={cn("lx-glass lx-panel-glow absolute w-56 rounded-2xl p-3", className)}
    >
      <div className="flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {product.coverImage ? (
            <Image src={product.coverImage} alt="" fill sizes="48px" loading="eager" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 text-sm font-bold text-white">
              {product.name[0]}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white">{product.brandName || product.name}</span>
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

export function PremiumHero({ stats, artifacts }: { stats: StorefrontStats; artifacts: StorefrontProduct[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const spotlightRef = usePointerSpotlight<HTMLDivElement>();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.04]);
  const backdropScale = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 55, damping: 18, mass: 0.5 });
  const springY = useSpring(pointerY, { stiffness: 55, damping: 18, mass: 0.5 });

  const handlePointer = (event: React.PointerEvent<HTMLElement>) => {
    if (reduced) return;
    pointerX.set((event.clientX / window.innerWidth - 0.5) * 26);
    pointerY.set((event.clientY / window.innerHeight - 0.5) * 18);
  };

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
      onPointerMove={handlePointer}
      className="lx-dark-scene relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#05060e]"
    >
      {/* ambient stage */}
      <motion.div className="absolute inset-0 -z-10" style={{ scale: backdropScale, y: backdropY }} aria-hidden>
        <div className="absolute inset-0 bg-[#05060e]" />
        <div className="lx-grid-floor absolute inset-0 opacity-60" />
        <div className="lx-blob lx-drift-a left-[-12%] top-[-18%] h-[44rem] w-[44rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.45),transparent_62%)]" />
        <div className="lx-blob lx-drift-b right-[-16%] top-[6%] h-[40rem] w-[40rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.3),transparent_62%)]" />
        <div className="lx-blob lx-drift-c left-[24%] top-[52%] h-[38rem] w-[38rem] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.26),transparent_62%)]" />
        <ParticleField className="absolute inset-0 h-full w-full" />
        <div ref={spotlightRef} className="lx-spotlight absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_-12%,transparent_36%,rgba(5,6,14,0.8)_100%)]" />
      </motion.div>

      {/* orbit ring */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] lg:block"
      >
        <div className="lx-conic-ring absolute inset-0 rounded-full blur-3xl" />
        <div className="absolute inset-[10%] rounded-full border border-white/10" />
        <div className="absolute inset-[24%] rounded-full border border-white/[0.06]" />
      </div>

      {/* floating product highlights */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden 2xl:block">
        {CHIP_POSITIONS.map((position, index) => {
          const product = artifacts[index];
          if (!product) return null;
          return (
            <FloatingChip
              key={product.id}
              product={product}
              label={index % 2 === 0 ? "Trending now" : "Just landed"}
              className={position.className}
              x={springX}
              y={springY}
              factor={position.factor}
            />
          );
        })}
      </div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pb-24 pt-14 text-center sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="lx-glass inline-flex items-center gap-2.5 rounded-full px-4 py-2"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--lx-gold)]" aria-hidden />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/80">
            The MeCart Atelier — SS26 drop, live now
          </span>
          <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--lx-emerald)]" />
        </motion.div>

        <h1 className="mt-7 max-w-4xl text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.4rem]">
          Objects of <span className="lx-serif text-[var(--lx-gold)]">desire,</span>
          <br className="hidden sm:block" /> delivered in <span className="lx-text-grad">motion</span>.
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl text-base leading-7 text-[var(--lx-muted)] sm:text-lg"
        >
          Fashion, audio, timepieces and technology — gathered from the world&apos;s most considered
          makers, then sent to your door like a small event.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
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
          className="mt-9 w-full max-w-xl"
        >
          <LiveSearch />
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
        >
          {statItems.map((item) => (
            <div key={item.label} className="border-l border-white/10 pl-4 text-left">
              <dd className="text-2xl font-semibold text-white">
                <Counter value={item.value} decimals={item.decimals} suffix={item.suffix} />
              </dd>
              <dt className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--lx-muted)]">{item.label}</dt>
            </div>
          ))}
        </motion.dl>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 grid w-full grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className="lx-glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors duration-300 hover:bg-white/10"
            >
              <service.icon className="h-5 w-5 shrink-0 text-[var(--lx-cyan)]" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white sm:text-sm">{service.title}</p>
                <p className="truncate text-[11px] text-[var(--lx-muted)]">{service.text}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 flex items-center gap-3"
        >
          <Stars rating={stats.rating} size={14} />
          <span className="text-xs text-[var(--lx-muted)]">
            <Counter value={stats.rating} decimals={1} /> / 5.0 from verified atelier clients
          </span>
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
