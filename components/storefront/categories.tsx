"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Baby,
  Footprints,
  Heart,
  Shirt,
  Smartphone,
  Sparkles,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { Reveal, RippleButton, SectionHeader, Tilt } from "@/components/luxe/primitives";
import { cn } from "@/lib/cn";

type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  imageUrl: string | null;
  description: string | null;
};

const ICONS: Record<string, LucideIcon> = {
  men: Shirt,
  women: Sparkles,
  girls: Heart,
  "baby-boy": Baby,
  "baby-girl": Baby,
  electronics: Smartphone,
  shoes: Footprints,
  fashion: Shirt,
  accessories: Watch,
};

const TONES = [
  "from-indigo-500/45 via-indigo-400/10 to-transparent",
  "from-cyan-400/40 via-cyan-300/10 to-transparent",
  "from-[#f0c46c]/35 via-[#f0c46c]/10 to-transparent",
  "from-violet-500/40 via-violet-400/10 to-transparent",
  "from-emerald-400/35 via-emerald-300/10 to-transparent",
  "from-rose-400/35 via-rose-300/10 to-transparent",
];

function CategoryTileCard({ category, index, featured }: { category: CategoryTile; index: number; featured: boolean }) {
  const Icon = ICONS[category.slug] ?? Sparkles;
  const tone = TONES[index % TONES.length];

  return (
    <Tilt className="h-full" radiusClass="rounded-[1.6rem]" max={7}>
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "lx-dark-scene group relative flex h-full flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-[#0a0c1a] p-5 transition-shadow duration-500 hover:shadow-[0_40px_90px_-50px_rgba(169,120,46,0.55)]",
          featured ? "min-h-[17rem] lg:min-h-[20rem]" : "min-h-[14rem]",
        )}
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes={featured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
            className="object-cover opacity-60 transition duration-700 group-hover:scale-[1.05] group-hover:opacity-70"
          />
        ) : null}
        <div className={cn("absolute inset-0 bg-gradient-to-br", tone)} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060e] via-[#05060e]/40 to-transparent" />

        <div className="relative z-10 flex items-start justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="lx-glass flex h-11 w-11 items-center justify-center rounded-full text-white transition duration-500 group-hover:scale-110 group-hover:rotate-6">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        </div>

        <div className="relative z-10">
          <h3 className={cn("font-semibold tracking-tight text-white", featured ? "text-2xl sm:text-3xl" : "text-lg")}>
            {category.name}
          </h3>
          {featured && category.description ? (
            <p className="mt-2 line-clamp-2 max-w-md text-sm leading-6 text-[var(--lx-muted)]">
              {category.description}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--lx-cyan)]">
              {category.productCount} {category.productCount === 1 ? "piece" : "pieces"}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition duration-300 group-hover:border-[var(--lx-gold)]/60 group-hover:bg-[var(--lx-gold)]/10 group-hover:text-[var(--lx-gold)]">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

export function CategoryShowcase({ categories }: { categories: CategoryTile[] }) {
  const tiles = categories.slice(0, 6);
  if (!tiles.length) return null;

  return (
    <section id="collections" className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader
          eyebrow="Browse the archive"
          title={
            <>
              Shop by <span className="lx-serif text-[var(--lx-gold)]">collection</span>
            </>
          }
          description="Every collection is a curated capsule — sourced, vetted and restocked from live inventory."
          action={
            <RippleButton href="/categories" variant="glass" size="sm">
              All collections
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </RippleButton>
          }
        />
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((category, index) => (
          <Reveal
            key={category.slug}
            delay={(index % 3) * 0.08}
            className={cn("h-full", index === 0 && "sm:col-span-2")}
          >
            <CategoryTileCard category={category} index={index} featured={index === 0} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
