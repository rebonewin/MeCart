"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { SectionHeader } from "@/components/luxe/primitives";
import { cn } from "@/lib/cn";
import type { StorefrontProduct } from "@/types/product";

export function ProductRail({
  products,
  eyebrow,
  title,
  description,
  action,
  id,
  badge,
  className,
}: {
  products: StorefrontProduct[];
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  id?: string;
  badge?: string;
  className?: string;
}) {
  const railId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const node = railRef.current;
    if (!node) return;
    setCanPrev(node.scrollLeft > 8);
    setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    const node = railRef.current;
    if (!node) return;
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, products.length]);

  const scroll = (direction: -1 | 1) => {
    const node = railRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.max(node.clientWidth * 0.78, 280),
      behavior: "smooth",
    });
  };

  if (!products.length) return null;

  return (
    <section id={id} className={cn("relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8", className)}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <div className="flex items-center gap-3">
            {action}
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => scroll(-1)}
                disabled={!canPrev}
                aria-label="Scroll recommendations left"
                aria-controls={railId}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/50 hover:text-[var(--lx-gold)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                disabled={!canNext}
                aria-label="Scroll recommendations right"
                aria-controls={railId}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/50 hover:text-[var(--lx-gold)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        }
      />

      <div
        ref={railRef}
        id={railId}
        role="region"
        aria-label={typeof title === "string" ? title : "Product recommendations"}
        tabIndex={0}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lx-gold)]/60 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[78vw] max-w-[290px] shrink-0 snap-start sm:w-[19rem]"
          >
            {badge ? (
              <p className="mb-2 flex items-center gap-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-cyan)]">
                <Sparkles className="h-3 w-3" aria-hidden />
                {badge}
              </p>
            ) : null}
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
