"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2, X } from "lucide-react";
import { useCompare } from "@/lib/compare-context";
import { useCartMotion } from "@/components/storefront/rider/use-cart-motion";
import { RippleButton, Stars, useMounted } from "@/components/luxe/primitives";
import { cn } from "@/lib/cn";

const ROWS: { label: string; render: (item: ReturnType<typeof useCompare>["items"][number]) => React.ReactNode }[] = [
  {
    label: "Price",
    render: (item) => (
      <span className="font-semibold text-white">
        ${item.price.toFixed(2)}
        {item.discountPercent > 0 ? (
          <span className="ml-2 text-xs font-normal text-white/35 line-through">${item.originalPrice.toFixed(2)}</span>
        ) : null}
      </span>
    ),
  },
  {
    label: "Rating",
    render: (item) => (
      <span className="flex items-center gap-2">
        <Stars rating={item.rating} size={12} />
        <span className="text-xs text-[var(--lx-muted)]">
          {item.rating.toFixed(1)} ({item.reviewCount})
        </span>
      </span>
    ),
  },
  {
    label: "Availability",
    render: (item) => (
      <span className={cn("text-xs font-medium", item.stock > 0 ? "text-[var(--lx-emerald)]" : "text-rose-300")}>
        {item.stock > 0 ? `${item.stock} in stock` : "Sold out"}
      </span>
    ),
  },
  { label: "Brand", render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.brandName}</span> },
  { label: "Collection", render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.categoryName}</span> },
  { label: "Material", render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.material}</span> },
  { label: "Origin", render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.country}</span> },
  {
    label: "Sizes",
    render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.sizes.join(" · ") || "—"}</span>,
  },
  {
    label: "Colours",
    render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.colors.join(" · ") || "—"}</span>,
  },
];

function CompareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const compare = useCompare();
  const { addToCart } = useCartMotion();
  const mounted = useMounted();

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

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[160] flex items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Compare products"
        >
          <button
            type="button"
            aria-label="Close comparison"
            onClick={onClose}
            className="absolute inset-0 bg-[#02030a]/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lx-card relative z-10 flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--lx-cyan)]">
                  Side by side
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Comparing {compare.count} of {compare.max} pieces
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={compare.clear}
                  className="flex h-9 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-[var(--lx-muted)] transition hover:border-white/25 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="lx-glass flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <div className="overflow-auto">
              <div
                className="grid min-w-[40rem]"
                style={{ gridTemplateColumns: `10rem repeat(${Math.max(compare.count, 1)}, minmax(12rem, 1fr))` }}
              >
                <div className="sticky left-0 z-10 bg-[#0b0d1c]/95 p-4" />
                {compare.items.map((item) => (
                  <div key={item.id} className="border-l border-white/5 p-4">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-white/[0.04]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="220px" className="object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-3xl font-black text-white/50">
                          {item.name[0]}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => compare.remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="lx-glass absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:text-white"
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="line-clamp-2 text-sm font-medium text-white transition hover:text-[var(--lx-gold)]"
                    >
                      {item.name}
                    </Link>
                  </div>
                ))}

                {ROWS.map((row) => (
                  <div key={row.label} className="contents">
                    <div className="sticky left-0 z-10 border-t border-white/5 bg-[#0b0d1c]/95 p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                      {row.label}
                    </div>
                    {compare.items.map((item) => (
                      <div key={`${row.label}-${item.id}`} className="border-l border-t border-white/5 p-4">
                        {row.render(item)}
                      </div>
                    ))}
                  </div>
                ))}

                <div className="sticky left-0 z-10 border-t border-white/5 bg-[#0b0d1c]/95 p-4" />
                {compare.items.map((item) => (
                  <div key={`cta-${item.id}`} className="border-l border-t border-white/5 p-4">
                    <RippleButton
                      size="sm"
                      disabled={item.stock <= 0}
                      className="w-full"
                      onClick={(event) =>
                        void addToCart(
                          {
                            productId: item.id,
                            name: item.name,
                            slug: item.slug,
                            price: item.price,
                            image: item.image,
                            quantity: 1,
                            size: item.sizes[0],
                            color: item.colors[0],
                          },
                          { sourceEl: event.currentTarget },
                        )
                      }
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                      Add to bag
                    </RippleButton>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function CompareBar() {
  const compare = useCompare();
  const [open, setOpen] = useState(false);
  const modalOpen = open && compare.count >= 2;

  return (
    <>
      <AnimatePresence>
        {compare.count > 0 && !modalOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lx-glass lx-panel-glow fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#0b0d1c]/90 px-4 py-3 shadow-2xl"
          >
            <div className="flex items-center -space-x-2">
              {compare.items.map((item) => (
                <span
                  key={item.id}
                  className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#0b0d1c] bg-white/5"
                >
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                      {item.name[0]}
                    </span>
                  )}
                </span>
              ))}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white">
                {compare.count} selected for compare
              </p>
              <p className="text-[10px] text-[var(--lx-muted)]">Up to {compare.max} pieces side by side</p>
            </div>
            <RippleButton size="sm" variant="gold" onClick={() => setOpen(true)}>
              Compare
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </RippleButton>
            <button
              type="button"
              onClick={compare.clear}
              aria-label="Clear compare selection"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--lx-muted)] transition hover:bg-white/10 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CompareModal open={modalOpen} onClose={() => setOpen(false)} />
    </>
  );
}
