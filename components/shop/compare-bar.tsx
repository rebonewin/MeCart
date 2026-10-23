"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Award, BadgeCheck, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { useCompare, type CompareItem } from "@/lib/compare-context";
import { useCartMotion } from "@/components/storefront/rider/use-cart-motion";
import { RippleButton, Stars, useMounted } from "@/components/luxe/primitives";
import { cn } from "@/lib/cn";

type CompareRow = {
  key: string;
  group: "The essentials" | "Specifications" | "Atelier detail";
  label: string;
  render: (item: CompareItem) => React.ReactNode;
  value: (item: CompareItem) => string;
};

function featuresOf(item: CompareItem) {
  return [
    item.bestSeller ? "Best seller" : null,
    item.newArrival ? "New arrival" : null,
    item.discountPercent > 0 ? `${item.discountPercent}% saving` : null,
    item.stock > 0 ? "Ready to dispatch" : null,
    item.sizes.length > 1 ? `${item.sizes.length} sizes` : null,
    item.colors.length > 1 ? `${item.colors.length} colourways` : null,
    item.country && item.country !== "—" ? `Made in ${item.country}` : null,
  ].filter((entry): entry is string => Boolean(entry));
}

const ROWS: CompareRow[] = [
  {
    key: "price",
    group: "The essentials",
    label: "Price",
    value: (item) => item.price.toFixed(2),
    render: (item) => (
      <span className="font-semibold text-white">
        ${item.price.toFixed(2)}
        {item.discountPercent > 0 ? (
          <span className="ml-2 text-xs font-normal text-white/35 line-through">
            ${item.originalPrice.toFixed(2)}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "rating",
    group: "The essentials",
    label: "Rating",
    value: (item) => `${item.rating}-${item.reviewCount}`,
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
    key: "availability",
    group: "The essentials",
    label: "Availability",
    value: (item) => (item.stock > 0 ? "in" : "out"),
    render: (item) => (
      <span
        className={cn(
          "text-xs font-medium",
          item.stock > 0 ? "text-[var(--lx-emerald)]" : "text-rose-300",
        )}
      >
        {item.stock > 0 ? `${item.stock} in stock` : "Sold out"}
      </span>
    ),
  },
  {
    key: "features",
    group: "The essentials",
    label: "Features",
    value: (item) => featuresOf(item).join("|"),
    render: (item) => (
      <span className="flex flex-wrap gap-1.5">
        {featuresOf(item).length ? (
          featuresOf(item).map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-[var(--lx-gold)]/20 bg-[var(--lx-gold)]/[0.07] px-2 py-0.5 text-[10px] text-[var(--lx-gold)]/90"
            >
              {feature}
            </span>
          ))
        ) : (
          <span className="text-xs text-[var(--lx-muted)]">—</span>
        )}
      </span>
    ),
  },
  {
    key: "brand",
    group: "Specifications",
    label: "Atelier",
    value: (item) => item.brandName,
    render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.brandName}</span>,
  },
  {
    key: "collection",
    group: "Specifications",
    label: "Collection",
    value: (item) => `${item.categoryName}-${item.subCategoryName}`,
    render: (item) => (
      <span className="text-sm text-[var(--lx-muted)]">
        {item.categoryName}
        {item.subCategoryName && item.subCategoryName !== "—" ? (
          <span className="mt-0.5 block text-[10px] text-[var(--lx-muted)]/60">
            {item.subCategoryName}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "material",
    group: "Specifications",
    label: "Material",
    value: (item) => item.material,
    render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.material}</span>,
  },
  {
    key: "origin",
    group: "Specifications",
    label: "Origin",
    value: (item) => item.country,
    render: (item) => <span className="text-sm text-[var(--lx-muted)]">{item.country}</span>,
  },
  {
    key: "weight",
    group: "Specifications",
    label: "Weight",
    value: (item) => String(item.weight),
    render: (item) => (
      <span className="text-sm text-[var(--lx-muted)]">
        {item.weight ? `${item.weight} kg` : "—"}
      </span>
    ),
  },
  {
    key: "sizes",
    group: "Specifications",
    label: "Sizes",
    value: (item) => item.sizes.join("|"),
    render: (item) => (
      <span className="flex flex-wrap gap-1">
        {item.sizes.length ? (
          item.sizes.map((size) => (
            <span
              key={size}
              className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--lx-muted)]"
            >
              {size}
            </span>
          ))
        ) : (
          <span className="text-xs text-[var(--lx-muted)]">—</span>
        )}
      </span>
    ),
  },
  {
    key: "colours",
    group: "Specifications",
    label: "Colours",
    value: (item) => item.colors.join("|"),
    render: (item) => (
      <span className="text-sm text-[var(--lx-muted)]">{item.colors.join(" · ") || "—"}</span>
    ),
  },
  {
    key: "sku",
    group: "Atelier detail",
    label: "Reference",
    value: (item) => item.sku,
    render: (item) => (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--lx-muted)]">
        {item.sku}
      </span>
    ),
  },
  {
    key: "description",
    group: "Atelier detail",
    label: "The piece",
    value: (item) => item.description,
    render: (item) => (
      <p className="line-clamp-4 text-xs leading-5 text-[var(--lx-muted)]">
        {item.description || "A considered piece from the MeCart atelier."}
      </p>
    ),
  },
  {
    key: "added",
    group: "Atelier detail",
    label: "Catalogue",
    value: (item) => item.createdAt,
    render: (item) => (
      <span className="text-xs text-[var(--lx-muted)]">
        {new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
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

  const lowestPrice = Math.min(...compare.items.map((item) => item.price));
  const topRating = Math.max(...compare.items.map((item) => item.rating));

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
            className="lx-card relative z-10 flex max-h-[92svh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[1.75rem] sm:rounded-3xl"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--lx-cyan)]">
                  Side by side
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Comparing {compare.count} of {compare.max} pieces
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--lx-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--lx-gold)]" aria-hidden />
                  Gold marks the details that differ
                </p>
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
                  autoFocus
                  className="lx-glass flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <div className="overflow-auto overscroll-contain">
              <div
                role="table"
                aria-label="Product comparison matrix"
                className="grid min-w-[48rem]"
                style={{
                  gridTemplateColumns: `10.5rem repeat(${Math.max(compare.count, 1)}, minmax(13rem, 1fr))`,
                }}
              >
                <div
                  role="row"
                  className="contents"
                >
                  <div
                    role="columnheader"
                    className="sticky left-0 z-20 flex items-end bg-[#0b0d1c]/95 p-4 pb-5"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                      The edit
                    </span>
                  </div>
                  {compare.items.map((item) => {
                    const isBestValue = compare.count >= 2 && item.price === lowestPrice;
                    const isTopRated = compare.count >= 2 && item.rating === topRating;
                    return (
                      <div
                        key={item.id}
                        role="columnheader"
                        className="border-l border-white/5 p-4"
                      >
                        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-white/[0.04]">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
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
                          <div className="absolute inset-x-2 bottom-2 flex flex-wrap gap-1">
                            {isBestValue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--lx-emerald)]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#052014]">
                                <Award className="h-2.5 w-2.5" aria-hidden /> Best value
                              </span>
                            ) : null}
                            {isTopRated ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--lx-gold)]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#1b1305]">
                                <BadgeCheck className="h-2.5 w-2.5" aria-hidden /> Top rated
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="line-clamp-2 text-sm font-medium text-white transition hover:text-[var(--lx-gold)]"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-[10px] text-[var(--lx-muted)]">{item.brandName}</p>
                      </div>
                    );
                  })}
                </div>

                {ROWS.map((row, rowIndex) => {
                  const values = compare.items.map(row.value);
                  const differs = new Set(values).size > 1;
                  const previousGroup = rowIndex > 0 ? ROWS[rowIndex - 1].group : null;
                  return (
                    <div key={row.key} className="contents" role="rowgroup">
                      {row.group !== previousGroup ? (
                        <div
                          role="row"
                          className="border-t border-white/10 bg-white/[0.035] px-4 py-2"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                            {row.group}
                          </p>
                        </div>
                      ) : null}
                      <div role="row" className="contents">
                        <div
                          role="rowheader"
                          aria-label={`${row.label}${differs ? " differs" : ""}`}
                          className={cn(
                            "sticky left-0 z-10 flex items-center gap-2 border-t border-white/5 bg-[#0b0d1c]/95 p-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--lx-muted)]",
                            differs && "bg-[#17150d]/95 text-[var(--lx-gold)]",
                          )}
                        >
                          {differs ? (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lx-gold)]" aria-hidden />
                          ) : null}
                          {row.label}
                        </div>
                        {compare.items.map((item) => (
                          <div
                            key={`${row.key}-${item.id}`}
                            role="cell"
                            className={cn(
                              "border-l border-t border-white/5 p-4",
                              differs && "border-l-[var(--lx-gold)]/10 bg-[var(--lx-gold)]/[0.035]",
                            )}
                          >
                            {row.render(item)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="contents" role="row">
                  <div
                    role="cell"
                    className="sticky left-0 z-10 border-t border-white/10 bg-[#0b0d1c]/95 p-4"
                  />
                  {compare.items.map((item) => (
                    <div
                      key={`cta-${item.id}`}
                      role="cell"
                      className="border-l border-t border-white/10 p-4"
                    >
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
                        {item.stock > 0 ? "Add to bag" : "Sold out"}
                      </RippleButton>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
              <p className="flex items-center gap-1.5 text-[10px] text-[var(--lx-muted)]">
                <Sparkles className="h-3 w-3 text-[var(--lx-cyan)]" aria-hidden />
                Prices, stock and availability are confirmed live at checkout.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs text-[var(--lx-cyan)] transition hover:text-white"
              >
                Keep browsing
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
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
