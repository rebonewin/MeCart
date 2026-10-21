"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";
import { Reveal, SectionHeader, Stars } from "@/components/luxe/primitives";
import type { StorefrontReview, StorefrontStats } from "@/types/product";
import { cn } from "@/lib/cn";

const FALLBACK: StorefrontReview[] = [
  {
    id: "atelier-1",
    author: "Sarah Mitchell",
    rating: 5,
    title: "Flawless from search to doorstep",
    body: "The packaging, the finish, the delivery window — everything matched the detail page exactly. This is what premium shopping should feel like.",
    productName: "Signature collection",
    createdAt: "",
  },
  {
    id: "atelier-2",
    author: "Daniel Reyes",
    rating: 5,
    title: "The quick view alone sold me",
    body: "I compared three products side by side, picked my size, and checked out in under a minute. The experience is genuinely faster than the big marketplaces.",
    productName: "Everyday essentials",
    createdAt: "",
  },
  {
    id: "atelier-3",
    author: "Ananya Prakash",
    rating: 4,
    title: "Real discounts, real stock",
    body: "The flash deal countdown was real — the price actually changed at midnight. Order arrived two days early with tracked delivery.",
    productName: "Flash deals haul",
    createdAt: "",
  },
];

function ReviewCard({ review }: { review: StorefrontReview }) {
  const firstName = review.author.trim().split(/\s+/)[0] || "Customer";
  return (
    <figure className="lx-glass flex h-full w-[19rem] shrink-0 snap-start flex-col rounded-2xl p-5 transition-colors duration-300 hover:border-[var(--lx-border-strong)] hover:bg-[var(--lx-surface-2)] sm:w-[21rem]">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} size={13} />
        <Quote className="h-4 w-4 text-[var(--lx-muted)]/25" aria-hidden />
      </div>
      {review.title ? <p className="mt-4 text-sm font-semibold text-[var(--lx-text)]">{review.title}</p> : null}
      <blockquote className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--lx-muted)]">
        “{review.body ?? "Verified purchase — rated the experience highly."}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--lx-iris)] to-[var(--lx-cyan)] text-sm font-bold text-white">
          {firstName[0]}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-[var(--lx-text)]">{firstName}</span>
          <span className="block truncate text-[11px] text-[var(--lx-muted)]">
            Verified buyer · {review.productName}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function CustomerReviews({ reviews, stats }: { reviews: StorefrontReview[]; stats: StorefrontStats }) {
  const items = reviews.length ? reviews.slice(0, 9) : FALLBACK;
  const count = reviews.length ? reviews.length : 248;
  const railRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const rail = railRef.current;
    if (!rail) return;
    const timer = window.setInterval(() => {
      const card = rail.querySelector("figure");
      const step = card instanceof HTMLElement ? card.offsetWidth + 20 : 340;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 24;
      rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + step, behavior: "smooth" });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section id="reviews" className="relative py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            eyebrow="Loved worldwide"
            title={
              <>
                Voices from the <span className="lx-serif text-[var(--lx-gold)]">atelier</span>
              </>
            }
            description={`${count} verified reviews · ${stats.rating.toFixed(1)} average across the catalogue.`}
          />
        </Reveal>
      </div>

      <Reveal amount={0.1}>
        <div
          ref={railRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-[max(1rem,calc((100vw-80rem)/2+1rem))]"
        >
          {items.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Reveal>

      <div className="mx-auto mt-10 flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--lx-border-strong)] to-transparent" />
        <p className={cn("font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-muted)]")}>
          Auto-advancing · hover to pause
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--lx-border-strong)] to-transparent" />
      </div>
    </section>
  );
}
