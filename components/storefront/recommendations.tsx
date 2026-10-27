"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Sparkles } from "lucide-react";
import { Reveal, SectionHeader, Stars } from "@/components/luxe/primitives";
import { usePersonalization } from "@/lib/ai/use-personalization";
import { matchConfidence } from "@/lib/ai/recommendations";
import type { StorefrontProduct } from "@/types/product";

function SignalBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--lx-muted)]">{label}</span>
        <span className="font-mono text-[var(--lx-text)]/70">{Math.round(value)}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--lx-border)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
          initial={{ width: "0%" }}
          whileInView={{ width: `${Math.round(value)}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({
  product,
  index,
  confidence,
}: {
  product: StorefrontProduct;
  index: number;
  confidence: number;
}) {
  return (
    <Reveal delay={index * 0.08} className="h-full">
      <div className="flex h-full flex-col">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="lx-glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-cyan)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {confidence}% match
          </span>
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="lx-card group flex flex-1 flex-col overflow-hidden rounded-2xl transition duration-500 hover:-translate-y-1"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
            {product.coverImage ? (
              <Image
                src={product.coverImage}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/25 to-cyan-400/15 text-3xl font-black text-white/70">
                {product.name[0]}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D24]/90 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">
              ${product.finalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              {product.brandName || product.categoryName}
            </span>
            <span className="line-clamp-2 text-sm font-medium text-[var(--lx-text)] transition group-hover:text-[var(--lx-gold)]">
              {product.name}
            </span>
            <div className="mt-auto flex items-center gap-2">
              <Stars rating={product.rating} size={12} />
              <span className="text-[11px] text-[var(--lx-muted)]">({product.reviewCount})</span>
            </div>
          </div>
        </Link>
      </div>
    </Reveal>
  );
}

export function AIRecommendations({ products }: { products: StorefrontProduct[] }) {
  const personalization = usePersonalization(products);
  const recommended = personalization.section("recommended")?.products ?? products.slice(0, 4);
  const items = recommended.slice(0, 4);
  if (!items.length) return null;

  const avgPrice = products.length
    ? products.reduce((sum, product) => sum + product.finalPrice, 0) / products.length
    : 0;
  const avgRating = products.length
    ? products.reduce((sum, product) => sum + product.rating, 0) / products.length
    : 0;
  const inStock = products.filter((product) => product.stock > 0).length;
  const viewedCount = personalization.signals.recentlyViewed?.length ?? 0;
  const wishlistCount = personalization.signals.wishlistIds?.length ?? 0;
  const cartCount = personalization.signals.cartIds?.length ?? 0;
  const catalogueDepth = Math.min(100, products.length * 12.5);
  const tasteAffinity = Math.min(98, 42 + viewedCount * 9 + wishlistCount * 6 + cartCount * 4);
  const stockVelocity = products.length ? (inStock / products.length) * 100 : 0;
  const reviewSentiment = Math.min(100, (avgRating / 5) * 100);
  const priceFit = products.length && avgPrice > 0
    ? (products.filter((product) => product.finalPrice <= avgPrice).length / products.length) * 100
    : 0;

  return (
    <section id="recommendations" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader
          eyebrow="MeCart Intelligence"
          title={
            <>
              Picked for <span className="lx-serif text-[var(--lx-gold)]">you</span>, live
            </>
          }
          description="A ranking engine over real catalogue signals — ratings, review depth, stock health and the pieces you have opened in this session."
          action={
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-cyan)] transition hover:text-[var(--lx-text)]"
            >
              Tune recommendations
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_2.15fr]">
        <Reveal className="h-full">
          <div className="lx-card flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6">
            <div>
              <span className="relative flex h-14 w-14 items-center justify-center">
                <span className="lx-conic-ring absolute inset-0 rounded-2xl opacity-80" />
                <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[13px] bg-[var(--lx-surface)]">
                  <BrainCircuit className="h-6 w-6 text-[var(--lx-cyan)]" aria-hidden />
                </span>
              </span>
              <h3 className="mt-5 text-xl font-semibold text-[var(--lx-text)]">Signals in this edit</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lx-muted)]">
                The ranking recalculates with every catalogue change and every piece you view — nothing is mocked.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <SignalBar label="Taste affinity" value={tasteAffinity} delay={0.1} />
              <SignalBar label="Catalogue depth" value={catalogueDepth} delay={0.22} />
              <SignalBar label="Stock readiness" value={stockVelocity} delay={0.34} />
              <SignalBar label="Review sentiment" value={reviewSentiment} delay={0.46} />
              <SignalBar label="Price fit" value={priceFit} delay={0.58} />
            </div>
            <p className="mt-6 border-t border-[var(--lx-border)] pt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              Recomputed live · v3.0
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((product, index) => (
            <RecommendationCard
              key={product.id}
              product={product}
              index={index}
              confidence={matchConfidence(product, personalization.signals)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
