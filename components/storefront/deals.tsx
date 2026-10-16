"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Reveal, SectionHeader } from "@/components/luxe/primitives";
import { ProductCard } from "@/components/shop/product-card";
import type { StorefrontProduct } from "@/types/product";

type Remaining = { hours: number; minutes: number; seconds: number };

function useMidnightCountdown(): Remaining | null {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    const tick = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setRemaining({
        hours: Math.floor(diff / 3_600_000),
        minutes: Math.floor(diff / 60_000) % 60,
        seconds: Math.floor(diff / 1_000) % 60,
      });
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return remaining;
}

function TimeBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-[#0a0c1a] shadow-inner sm:h-16 sm:w-16">
        <motion.span
          key={String(value)}
          initial={{ y: "-70%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums text-white sm:text-3xl"
        >
          {typeof value === "number" ? String(value).padStart(2, "0") : value}
        </motion.span>
      </div>
      <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.26em] text-[var(--lx-muted)]">{label}</span>
    </div>
  );
}

export function FlashDeals({ products }: { products: StorefrontProduct[] }) {
  const items = products.slice(0, 4);
  const remaining = useMidnightCountdown();
  if (!items.length) return null;

  return (
    <section id="flash-deals" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <div className="lx-card relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(240,196,108,0.22),transparent_65%)] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_65%)] blur-2xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <SectionHeader
                eyebrow="Midnight drop"
                title={
                  <>
                    Flash <span className="lx-serif text-[var(--lx-gold)]">deals</span> — today only
                  </>
                }
                description="Live discounts straight from the catalogue. When the clock resets, the prices reset."
              />
              <p className="lg:hidden" />
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="mr-1 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--lx-gold)] sm:flex">
                <Flame className="h-4 w-4 animate-pulse" aria-hidden />
                Ending in
              </span>
              <TimeBox value={remaining ? remaining.hours : "--"} label="Hours" />
              <TimeBox value={remaining ? remaining.minutes : "--"} label="Minutes" />
              <TimeBox value={remaining ? remaining.seconds : "--"} label="Seconds" />
            </div>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 0.07} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
