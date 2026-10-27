"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Eye, Heart, Scale, ShoppingBag } from "lucide-react";
import { useCartMotion } from "@/components/storefront/rider/use-cart-motion";
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
      whileTap={{ scale: 0.86 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0B0B0F]/45 text-white/90 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors duration-200 hover:border-white/35 hover:bg-[#0B0B0F]/70 hover:text-white",
        active && "border-[var(--lx-gold)]/60 bg-[var(--lx-gold)]/20 text-[var(--lx-gold)]",
      )}
    >
      {children}
    </motion.button>
  );
}

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart } = useCartMotion();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [quickOpen, setQuickOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;
  const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.finalPrice;
  const alternateImage = product.images.find((image) => image && image !== product.coverImage);

  const quickAdd = async () => {
    if (outOfStock) return;
    await addToCart(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.finalPrice,
        image: product.coverImage,
        quantity: 1,
        size: product.sizes[0],
        color: product.colors[0],
      },
      { sourceEl: imageRef.current },
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <>
      <Tilt className="h-full" radiusClass="rounded-[1.75rem]" max={5}>
        <article className="lx-card group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_48px_90px_-52px_rgba(169,120,46,0.45)]">
          <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden bg-[var(--lx-surface-2)]">
            <Link
              href={`/products/${product.slug}`}
              aria-label={product.name}
              className="absolute inset-0 z-[1] block focus-visible:outline-none"
            >
              <span className="absolute inset-0 block">
                {product.coverImage ? (
                  <Image
                    src={product.coverImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.055]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--lx-surface-2)] to-[var(--lx-surface)] text-5xl font-black text-[var(--lx-muted)]/40">
                    {product.name[0]}
                  </span>
                )}
                {alternateImage ? (
                  <Image
                    src={alternateImage}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
                  />
                ) : null}
              </span>
            </Link>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/55 via-transparent to-transparent opacity-80" />

            {/* badges */}
            <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
              {hasDiscount ? (
                <span className="rounded-full bg-[var(--lx-gold)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[#0B0B0F] shadow-lg shadow-black/20">
                  −{Math.round(product.discountPercent)}%
                </span>
              ) : null}
              {product.newArrival ? (
                <span className="rounded-full border border-white/25 bg-[#0B0B0F]/45 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white backdrop-blur-md">
                  NEW
                </span>
              ) : null}
              {outOfStock ? (
                <span className="rounded-full bg-[var(--lx-rose)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white">
                  SOLD OUT
                </span>
              ) : lowStock ? (
                <span className="rounded-full border border-white/25 bg-[#0B0B0F]/45 px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] text-[var(--lx-gold)] backdrop-blur-md">
                  Only {product.stock} left
                </span>
              ) : null}
            </div>

            {/* actions */}
            <div className="absolute right-3 top-3 z-[3] flex flex-col gap-2 transition duration-300 lg:translate-x-1.5 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100">
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
            <div className="absolute inset-x-3 bottom-3 z-[3] translate-y-0 opacity-100 transition duration-300 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
              <Button
                type="button"
                onClick={() => void quickAdd()}
                disabled={outOfStock}
                className={cn(
                  "flex h-11 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 active:scale-[0.98]",
                  outOfStock
                    ? "cursor-not-allowed border-white/10 bg-[#0B0B0F]/40 text-white/45"
                    : added
                      ? "border-[var(--lx-gold)] bg-[var(--lx-gold)] text-[#0B0B0F]"
                      : "border-white/30 bg-white/90 text-[#0B0B0F] hover:-translate-y-0.5 hover:bg-white",
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
              </Button>
            </div>

            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-px bg-gradient-to-r from-transparent via-[var(--lx-gold)]/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
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
              className="line-clamp-2 min-h-[2.7rem] text-sm font-medium leading-[1.35] text-[var(--lx-text)] transition-colors hover:text-[var(--lx-gold)] sm:text-[0.95rem]"
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
              <Link
                href={`/products/${product.slug}`}
                aria-label={`View ${product.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition duration-300 hover:border-[var(--lx-gold)]/60 hover:bg-[var(--lx-gold)]/10 hover:text-[var(--lx-gold)]"
              >
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>

            <p
              className={cn(
                "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                outOfStock
                  ? "text-[var(--lx-rose)]"
                  : lowStock
                    ? "text-[var(--lx-gold)]"
                    : "text-[var(--lx-emerald)]",
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
