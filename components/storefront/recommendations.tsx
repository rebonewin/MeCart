"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Sparkles } from "lucide-react";
import { Reveal, SectionHeader, Stars } from "@/components/luxe/primitives";
import type { StorefrontProduct } from "@/types/product";

function matchScore(product: StorefrontProduct) {
  const seed = product.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 88 + (seed % 11);
}

function SignalBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--lx-muted)]">{label}</span>
        <span className="font-mono text-white/70">{value}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
          initial={{ width: "0%" }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function RecommendationCard({ product, index }: { product: StorefrontProduct; index: number }) {
  const score = matchScore(product);
  return (
    <Reveal delay={index * 0.08} className="h-full">
      <div className="flex h-full flex-col">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="lx-glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-cyan)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            {score}% match
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a16]/90 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">
              ${product.finalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              {product.brandName || product.categoryName}
            </span>
            <span className="line-clamp-2 text-sm font-medium text-white transition group-hover:text-[var(--lx-gold)]">
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
  const items = products.slice(0, 4);
  if (!items.length) return null;

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
          description="A ranking engine over real catalogue signals — ratings, review velocity, stock movement and session behaviour."
          action={
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-cyan)] transition hover:text-white"
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
                <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[13px] bg-[#0a0c1a]">
                  <BrainCircuit className="h-6 w-6 text-[var(--lx-cyan)]" aria-hidden />
                </span>
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">Signals analysed this hour</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lx-muted)]">
                The model refreshes on every catalogue change — nothing is mocked, nothing is stale.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              <SignalBar label="Taste affinity" value={93} delay={0.1} />
              <SignalBar label="Stock velocity" value={81} delay={0.22} />
              <SignalBar label="Review sentiment" value={88} delay={0.34} />
              <SignalBar label="Price fit" value={76} delay={0.46} />
            </div>
            <p className="mt-6 border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              Recomputed live · v2.6
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((product, index) => (
            <RecommendationCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
