"use client";

import Image from "next/image";
import Link from "next/link";
import { Marquee, Reveal, SectionHeader } from "@/components/luxe/primitives";

type BrandTile = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
};

function BrandCard({ brand }: { brand: BrandTile }) {
  const initials = brand.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/products?brand=${brand.slug}`}
      className="lx-glass group mx-2.5 flex h-32 w-56 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/10"
      aria-label={`${brand.name} — ${brand.productCount} products`}
    >
      {brand.logoUrl ? (
        <Image
          src={brand.logoUrl}
          alt={brand.name}
          width={112}
          height={40}
          className="h-10 w-auto max-w-[7rem] object-contain opacity-80 transition group-hover:opacity-100"
        />
      ) : (
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span className="lx-conic-ring absolute inset-0 rounded-2xl opacity-70 transition group-hover:opacity-100" />
          <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[13px] bg-[#0a0c1a] text-sm font-black tracking-tight text-white">
            {initials}
          </span>
        </span>
      )}
      <span className="max-w-[12rem] truncate text-sm font-semibold text-white/85 transition group-hover:text-white">
        {brand.name}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
        {brand.productCount} {brand.productCount === 1 ? "piece" : "pieces"}
      </span>
    </Link>
  );
}

export function BrandShowcase({ brands }: { brands: BrandTile[] }) {
  if (!brands.length) return null;

  const half = Math.ceil(brands.length / 2);
  const rowA = brands.slice(0, Math.max(half, 1));
  const rowB = brands.length > half ? brands.slice(half) : brands;

  return (
    <section id="brands" className="relative py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeader
            align="center"
            eyebrow="Maisons on board"
            title={
              <>
                The <span className="lx-serif text-[var(--lx-gold)]">maison</span> carousel
              </>
            }
            description="Certified labels and houses, orbiting the atelier in an endless showcase."
          />
        </Reveal>
      </div>

      <Reveal amount={0.1}>
        <div className="space-y-5 [perspective:1200px]">
          <div className="[transform:rotateX(14deg)] [transform-style:preserve-3d]">
            <Marquee duration={46}>
              {rowA.map((brand) => (
                <BrandCard key={`a-${brand.id}`} brand={brand} />
              ))}
            </Marquee>
          </div>
          <div className="[transform:rotateX(-14deg)] [transform-style:preserve-3d]">
            <Marquee duration={54} reverse>
              {rowB.map((brand) => (
                <BrandCard key={`b-${brand.id}`} brand={brand} />
              ))}
            </Marquee>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
