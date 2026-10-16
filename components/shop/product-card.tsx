"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Eye, Heart, Scale, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { snapshotOf, useCompare } from "@/lib/compare-context";
import { PriceTag, Stars, Tilt } from "@/components/luxe/primitives";
import { QuickViewModal } from "@/components/shop/quick-view";
import type { StorefrontProduct } from "@/types/product";
import { cn } from "@/lib/cn";

function IconAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "lx-glass flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200",
        active ? "bg-white/20 text-[var(--lx-gold)]" : "text-white/85 hover:bg-white/20 hover:text-white",
      )}
    >
      {children}
    </motion.button>
  );
}

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [quickOpen, setQuickOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;
  const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.finalPrice;

  const quickAdd = async () => {
    if (outOfStock) return;
    await cart.addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.finalPrice,
      image: product.coverImage,
      quantity: 1,
      size: product.sizes[0],
      color: product.colors[0],
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <>
      <Tilt className="h-full" radiusClass="rounded-3xl" max={7}>
        <article className="lx-card group relative flex h-full flex-col overflow-hidden rounded-3xl transition-shadow duration-500 hover:shadow-[0_50px_100px_-55px_rgba(99,102,241,0.8)]">
          <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.04]">
            <Link href={`/products/${product.slug}`} aria-label={product.name} className="absolute inset-0 z-[1]">
              {product.coverImage ? (
                <Image
                  src={product.coverImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.06]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/25 to-cyan-400/15 text-5xl font-black text-white/50">
                  {product.name[0]}
                </span>
              )}
            </Link>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080a16]/85 via-transparent to-transparent" />

            {/* badges */}
            <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
              {hasDiscount ? (
                <span className="rounded-full bg-[var(--lx-gold)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#241a05]">
                  −{Math.round(product.discountPercent)}%
                </span>
              ) : null}
              {product.newArrival ? (
                <span className="rounded-full bg-cyan-400/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#04202a]">
                  NEW
                </span>
              ) : null}
              {outOfStock ? (
                <span className="rounded-full bg-rose-500/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
                  SOLD OUT
                </span>
              ) : lowStock ? (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--lx-gold)] backdrop-blur">
                  Only {product.stock} left
                </span>
              ) : null}
            </div>

            {/* actions */}
            <div className="absolute right-3 top-3 z-[3] flex flex-col gap-2 opacity-100 transition duration-300 lg:translate-x-1 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100">
              <IconAction label="Quick view" onClick={() => setQuickOpen(true)}>
                <Eye className="h-3.5 w-3.5" aria-hidden />
              </IconAction>
              <IconAction
                label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                active={inWishlist}
                onClick={() =>
                  void wishlist.toggle({
                    productId: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.finalPrice,
                    image: product.coverImage,
                  })
                }
              >
                <Heart className={cn("h-3.5 w-3.5", inWishlist && "fill-current")} aria-hidden />
              </IconAction>
              <IconAction
                label={inCompare ? "Remove from compare" : "Add to compare"}
                active={inCompare}
                onClick={() => compare.toggle(snapshotOf(product))}
              >
                <Scale className="h-3.5 w-3.5" aria-hidden />
              </IconAction>
            </div>

            {/* quick add */}
            <div className="absolute inset-x-3 bottom-3 z-[3] translate-y-1 opacity-100 transition duration-300 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => void quickAdd()}
                disabled={outOfStock}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold backdrop-blur-xl transition",
                  outOfStock
                    ? "cursor-not-allowed bg-white/10 text-white/40"
                    : added
                      ? "bg-[var(--lx-gold)] text-[#241a05]"
                      : "bg-white/92 text-[#05060e] hover:bg-white",
                )}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Added to bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    {outOfStock ? "Sold out" : "Quick add"}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                {product.brandName || product.categoryName || "MeCart"}
              </span>
              {product.rating > 0 ? (
                <span className="flex shrink-0 items-center gap-1">
                  <Stars rating={product.rating} size={11} />
                  <span className="text-[10px] text-[var(--lx-muted)]">({product.reviewCount})</span>
                </span>
              ) : null}
            </div>

            <Link
              href={`/products/${product.slug}`}
              className="line-clamp-2 min-h-[2.6rem] text-sm font-medium text-white transition-colors hover:text-[var(--lx-gold)]"
            >
              {product.name}
            </Link>

            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <PriceTag
                price={product.finalPrice}
                original={product.originalPrice}
                discountPercent={product.discountPercent}
                size="md"
              />
            </div>

            <p
              className={cn(
                "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                outOfStock ? "text-rose-300/80" : lowStock ? "text-[var(--lx-gold)]" : "text-[var(--lx-emerald)]/90",
              )}
            >
              <span className="h-1 w-1 rounded-full bg-current" />
              {outOfStock ? "Awaiting restock" : lowStock ? `Only ${product.stock} left` : "In stock · ships in 24h"}
            </p>
          </div>
        </article>
      </Tilt>

      <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}
