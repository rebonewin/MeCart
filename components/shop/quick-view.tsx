"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  Scale,
  ShoppingBag,
  X,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { snapshotOf, useCompare } from "@/lib/compare-context";
import { RippleButton, Stars, useMounted } from "@/components/luxe/primitives";
import { cn } from "@/lib/cn";
import type { StorefrontProduct } from "@/types/product";

export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: StorefrontProduct;
  open: boolean;
  onClose: () => void;
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const mounted = useMounted();
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setActiveImage(0);
      setQuantity(1);
      setAdded(false);
    }
  }

  const gallery = (product.images.length ? product.images : product.coverImage ? [product.coverImage] : []).slice(0, 5);
  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const lowStock = product.stock > 0 && product.stock <= 10;
  const outOfStock = product.stock <= 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const addToBag = async () => {
    if (outOfStock) return;
    await cart.addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.finalPrice,
      image: product.coverImage,
      quantity,
      size: size || undefined,
      color: color || undefined,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[150] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view — ${product.name}`}
        >
          <button
            type="button"
            aria-label="Close quick view"
            onClick={onClose}
            className="absolute inset-0 bg-[#02030a]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lx-card relative z-10 max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-t-[1.75rem] sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="lx-glass absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="grid gap-0 md:grid-cols-2">
              {/* gallery */}
              <div className="relative">
                <div className="relative aspect-square overflow-hidden rounded-t-[1.75rem] bg-white/[0.03] md:rounded-l-3xl md:rounded-tr-none">
                  {gallery[activeImage] ? (
                    <Image
                      src={gallery[activeImage]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/25 to-cyan-400/15 text-6xl font-black text-white/60">
                      {product.name[0]}
                    </span>
                  )}
                  {product.discountPercent > 0 ? (
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--lx-gold)] px-3 py-1 text-xs font-bold text-[#241a05]">
                      −{Math.round(product.discountPercent)}%
                    </span>
                  ) : null}
                </div>
                {gallery.length > 1 ? (
                  <div className="flex gap-2 p-4">
                    {gallery.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`View image ${index + 1}`}
                        className={cn(
                          "relative h-14 w-14 overflow-hidden rounded-xl border transition",
                          index === activeImage
                            ? "border-[var(--lx-gold)]/70"
                            : "border-white/10 opacity-60 hover:opacity-100",
                        )}
                      >
                        <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* details */}
              <div className="flex flex-col p-6 sm:p-8 md:py-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--lx-cyan)]">
                  {product.brandName || product.categoryName || "MeCart Atelier"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{product.name}</h2>

                <div className="mt-3 flex items-center gap-3">
                  <Stars rating={product.rating} size={14} />
                  <span className="text-xs text-[var(--lx-muted)]">
                    {product.rating.toFixed(1)} · {product.reviewCount} reviews
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="text-2xl font-semibold text-white">${product.finalPrice.toFixed(2)}</span>
                  {product.discountPercent > 0 && product.originalPrice > product.finalPrice ? (
                    <span className="text-sm text-white/35 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em]",
                      outOfStock
                        ? "bg-rose-500/15 text-rose-300"
                        : lowStock
                          ? "bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]"
                          : "bg-[var(--lx-emerald)]/15 text-[var(--lx-emerald)]",
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {outOfStock ? "Sold out" : lowStock ? `Only ${product.stock} left` : "In stock"}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--lx-muted)]">
                  {product.description || "A signature atelier piece, curated for the MeCart collection."}
                </p>

                {product.sizes.length > 0 ? (
                  <div className="mt-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">Size</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.sizes.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSize(option)}
                          className={cn(
                            "rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                            option === size
                              ? "border-[var(--lx-gold)]/70 bg-[var(--lx-gold)]/10 text-white"
                              : "border-white/10 text-[var(--lx-muted)] hover:border-white/25 hover:text-white",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {product.colors.length > 0 ? (
                  <div className="mt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">Colour</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.colors.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setColor(option)}
                          className={cn(
                            "rounded-xl border px-3.5 py-2 text-xs font-medium transition",
                            option === color
                              ? "border-[var(--lx-gold)]/70 bg-[var(--lx-gold)]/10 text-white"
                              : "border-white/10 text-[var(--lx-muted)] hover:border-white/25 hover:text-white",
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-7 flex items-center gap-4">
                  <div className="flex h-12 items-center rounded-full border border-white/10">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      aria-label="Decrease quantity"
                      className="flex h-full w-11 items-center justify-center text-[var(--lx-muted)] transition hover:text-white"
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-white">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.min(99, value + 1))}
                      aria-label="Increase quantity"
                      className="flex h-full w-11 items-center justify-center text-[var(--lx-muted)] transition hover:text-white"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <RippleButton
                    onClick={() => void addToBag()}
                    disabled={outOfStock}
                    variant={added ? "gold" : "primary"}
                    size="md"
                    className="flex-1"
                  >
                    {added ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden /> Added to bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" aria-hidden /> Add to bag
                      </>
                    )}
                  </RippleButton>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void wishlist.toggle({
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.finalPrice,
                        image: product.coverImage,
                      })
                    }
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-xs font-medium transition",
                      inWishlist
                        ? "border-rose-400/50 bg-rose-500/10 text-rose-300"
                        : "border-white/10 text-[var(--lx-muted)] hover:border-white/25 hover:text-white",
                    )}
                  >
                    <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} aria-hidden />
                    {inWishlist ? "In wishlist" : "Wishlist"}
                  </button>
                  <button
                    type="button"
                    onClick={() => compare.toggle(snapshotOf(product))}
                    className={cn(
                      "flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-xs font-medium transition",
                      inCompare
                        ? "border-[var(--lx-cyan)]/50 bg-cyan-400/10 text-[var(--lx-cyan)]"
                        : "border-white/10 text-[var(--lx-muted)] hover:border-white/25 hover:text-white",
                    )}
                  >
                    <Scale className="h-4 w-4" aria-hidden />
                    {inCompare ? "Comparing" : "Compare"}
                  </button>
                </div>

                <Link
                  href={`/products/${product.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-cyan)] transition hover:text-white"
                >
                  View full details
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
