"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { useCartMotion } from "@/components/storefront/rider/use-cart-motion";
import { useWishlist } from "@/lib/wishlist-context";
import { snapshotOf, useCompare } from "@/lib/compare-context";
import { RippleButton, Stars } from "@/components/luxe/primitives";
import { Breadcrumbs } from "@/components/shop/storefront-ui";
import { LazySection } from "@/components/ui/lazy-section";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

type DetailProduct = Product & { newArrival?: boolean; bestSeller?: boolean };

const ProductRecommendations = dynamic(
  () =>
    import("@/components/shop/product-recommendations").then(
      (module) => module.ProductRecommendations,
    ),
  { ssr: false },
);

const ProductViewer = dynamic(
  () => import("@/components/product/product-viewer").then((module) => module.ProductViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[4/5] w-full animate-pulse items-center justify-center rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)] text-xs uppercase tracking-[0.2em] text-[var(--lx-muted)]">
        Preparing studio
      </div>
    ),
  },
);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function dedupeProducts(products: DetailProduct[]): DetailProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

export function ProductDetailClient({
  product,
  related = [],
  catalog = [],
}: {
  product: DetailProduct;
  related?: Product[];
  catalog?: Product[];
}) {
  const cart = useCart();
  const { addToCart } = useCartMotion();
  const wishlist = useWishlist();
  const { track } = useRecentlyViewed();
  const compare = useCompare();
  const router = useRouter();
  const imageRef = useRef<HTMLDivElement>(null);
  const recommendationPool = dedupeProducts([product, ...catalog, ...related]);

  const gallery =
    product.images.length && !product.images.includes(product.coverImage)
      ? [product.coverImage, ...product.images.filter(Boolean)]
      : product.images.filter(Boolean).length
        ? product.images.filter(Boolean)
        : product.coverImage
          ? [product.coverImage]
          : [];
  const [activeImage, setActiveImage] = useState(0);
  const [viewMode, setViewMode] = useState<"gallery" | "studio">("gallery");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  const size = selectedSize || (product.sizes[0] ?? "");
  const color = selectedColor || (product.colors[0] ?? "");
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 10;
  const hasDiscount = product.discountPercent > 0 && product.originalPrice > product.finalPrice;
  const inWishlist = wishlist.has(product.id);
  const inCompare = compare.has(product.id);
  const maxQuantity = Math.max(1, Math.min(product.stock || 1, 20));
  const currentImage = gallery[activeImage] ?? product.coverImage;

  useEffect(() => {
    track(product);
  }, [product, track]);

  const payload = {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    price: product.finalPrice,
    image: product.coverImage,
    quantity,
    size,
    color,
  };

  const add = async () => {
    if (soldOut) return;
    setAdding(true);
    try {
      await addToCart(payload, { sourceEl: imageRef.current });
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    if (soldOut) return;
    setBuying(true);
    try {
      await cart.addItem(payload);
      router.push("/checkout");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="lx-page">
      <div className="lx-container py-8 sm:py-12 lg:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            product.categoryName
              ? { label: product.categoryName, href: `/categories/${product.categorySlug}` }
              : { label: "Products", href: "/products" },
            { label: product.name },
          ]}
          className="mb-8"
        />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] lg:gap-14">
          {/* gallery */}
          <div className="lg:sticky lg:top-28">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Product media view"
                className="inline-flex rounded-full border border-[var(--lx-border)] bg-[var(--lx-surface)]/70 p-1 backdrop-blur"
              >
                {(
                  [
                    { id: "gallery", label: "Gallery" },
                    { id: "studio", label: "3D Studio" },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    aria-pressed={viewMode === mode.id}
                    className={cn(
                      "rounded-full px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] transition-colors duration-300",
                      viewMode === mode.id
                        ? "bg-[var(--lx-gold)] text-[#0B0B0F] shadow-[0_8px_22px_-12px_rgba(212,175,55,0.7)]"
                        : "text-[var(--lx-muted)] hover:text-[var(--lx-text)]",
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                {viewMode === "studio"
                  ? "Rotate · zoom · pan"
                  : `${gallery.length || 1} ${gallery.length === 1 ? "view" : "views"}`}
              </span>
            </div>

            <div ref={imageRef}>
              {viewMode === "studio" ? (
                <ProductViewer
                  name={product.name}
                  modelUrl={product.modelUrl}
                  poster={currentImage || product.coverImage}
                  caption={product.modelCaption}
                />
              ) : (
                <div className="flex gap-3 sm:gap-4">
                  {gallery.length > 1 ? (
                    <div className="hidden w-[4.5rem] shrink-0 flex-col gap-2 sm:flex">
                      {gallery.slice(0, 6).map((image, index) => (
                        <Button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => setActiveImage(index)}
                          aria-label={`View image ${index + 1} of ${product.name}`}
                          aria-pressed={index === activeImage}
                          className={cn(
                            "relative aspect-[4/5] overflow-hidden rounded-xl border bg-[var(--lx-surface-2)] transition duration-300",
                            index === activeImage
                              ? "border-[var(--lx-gold)] ring-2 ring-[var(--lx-gold)]/20"
                              : "border-[var(--lx-border)] opacity-65 hover:opacity-100",
                          )}
                        >
                          <Image src={image} alt="" fill sizes="72px" className="object-cover" />
                        </Button>
                      ))}
                    </div>
                  ) : null}

                  <div className="relative min-w-0 flex-1 overflow-hidden rounded-[1.75rem] border border-[var(--lx-border)] bg-[var(--lx-surface-2)]">
                    <div className="relative aspect-[4/5]">
                      <AnimatePresence mode="wait" initial={false}>
                        {currentImage ? (
                          <motion.div
                            key={currentImage}
                            initial={{ opacity: 0, scale: 1.015 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0"
                          >
                            <Image
                              src={currentImage}
                              alt={product.name}
                              fill
                              priority
                              fetchPriority="high"
                              sizes="(max-width: 1024px) 100vw, 55vw"
                              className="object-cover"
                            />
                          </motion.div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-6xl font-black text-[var(--lx-muted)]/30">
                            {product.name[0]}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
                      <div className="flex flex-col gap-1.5">
                        {hasDiscount ? (
                          <span className="rounded-full bg-[var(--lx-gold)] px-3 py-1 text-[10px] font-bold tracking-[0.06em] text-[#0B0B0F] shadow-lg shadow-black/15">
                            −{Math.round(product.discountPercent)}%
                          </span>
                        ) : null}
                        {product.newArrival ? (
                          <span className="rounded-full border border-white/25 bg-[#0B0B0F]/45 px-3 py-1 text-[10px] font-bold tracking-[0.08em] text-white backdrop-blur-md">
                            NEW SEASON
                          </span>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-white/20 bg-[#0B0B0F]/35 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
                        {activeImage + 1} / {gallery.length || 1}
                      </span>
                    </div>

                    {soldOut ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0B0B0F]/55 backdrop-blur-[2px]">
                        <span className="rounded-full border border-white/20 bg-[#0B0B0F]/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white">
                          Awaiting restock
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {viewMode === "gallery" && gallery.length > 1 ? (
              <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto sm:hidden">
                {gallery.slice(0, 6).map((image, index) => (
                  <Button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1} of ${product.name}`}
                    aria-pressed={index === activeImage}
                    className={cn(
                      "relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border bg-[var(--lx-surface-2)] transition",
                      index === activeImage
                        ? "border-[var(--lx-gold)] ring-2 ring-[var(--lx-gold)]/20"
                        : "border-[var(--lx-border)] opacity-65",
                    )}
                  >
                    <Image src={image} alt="" fill sizes="56px" className="object-cover" />
                  </Button>
                ))}
              </div>
            ) : null}
          </div>

          {/* information */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={product.brandName ? `/products?brand=${slugify(product.brandName)}` : "/products"}
                className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--lx-gold)] transition hover:text-[var(--lx-text)]"
              >
                {product.brandName || "MeCart atelier"}
              </Link>
              {product.storeName && product.storeSlug ? (
                <Link
                  href={`/stores/${product.storeSlug}`}
                  className="inline-flex items-center gap-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
                >
                  <Store className="h-3 w-3" aria-hidden /> {product.storeName}
                </Link>
              ) : null}
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                {product.sku}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight text-[var(--lx-text)] sm:text-4xl lg:text-[2.9rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {product.rating > 0 ? (
                <span className="flex items-center gap-2">
                  <Stars rating={product.rating} size={14} />
                  <span className="text-xs text-[var(--lx-text)]">{product.rating.toFixed(1)}</span>
                  <span className="text-xs text-[var(--lx-muted)]">
                    ({product.reviewCount} reviews)
                  </span>
                </span>
              ) : null}
              <span className="h-3 w-px bg-[var(--lx-border)]" aria-hidden />
              <span
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em]",
                  soldOut
                    ? "text-[var(--lx-rose)]"
                    : lowStock
                      ? "text-[var(--lx-gold)]"
                      : "text-[var(--lx-emerald)]",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {soldOut ? "Sold out" : lowStock ? `Only ${product.stock} left` : "In stock · ready to ship"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-semibold tabular-nums tracking-tight text-[var(--lx-text)]">
                ${product.finalPrice.toFixed(2)}
              </span>
              {hasDiscount ? (
                <>
                  <span className="text-sm text-[var(--lx-muted)] line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                  <span className="rounded-full bg-[var(--lx-emerald)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--lx-emerald)]">
                    Save ${(product.originalPrice - product.finalPrice).toFixed(2)}
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-6 text-sm leading-7 text-[var(--lx-muted)] sm:text-[0.95rem]">
              {product.description}
            </p>

            <div className="mt-7 h-px bg-[var(--lx-border)]" />

            {product.sizes.length ? (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="lx-label mb-0">Size</p>
                  <span className="text-[10px] text-[var(--lx-muted)]">Fits true to size</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => setSelectedSize(option)}
                      aria-pressed={size === option}
                      className={cn(
                        "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-xs font-medium transition duration-300",
                        size === option
                          ? "border-[var(--lx-gold)] bg-[var(--lx-gold)]/10 text-[var(--lx-text)]"
                          : "border-[var(--lx-border)] text-[var(--lx-muted)] hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]",
                      )}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.colors.length ? (
              <div className="mt-6">
                <p className="lx-label mb-0">Colour</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.colors.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      onClick={() => setSelectedColor(option)}
                      aria-pressed={color === option}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-medium transition duration-300",
                        color === option
                          ? "border-[var(--lx-gold)] bg-[var(--lx-gold)]/10 text-[var(--lx-text)]"
                          : "border-[var(--lx-border)] text-[var(--lx-muted)] hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]",
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: option.toLowerCase() }}
                      />
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex h-11 items-center rounded-full border border-[var(--lx-border)] bg-[var(--lx-surface)]">
                <Button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-full w-10 items-center justify-center rounded-l-full text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)] disabled:opacity-35"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <span aria-live="polite" className="w-8 text-center text-xs font-semibold tabular-nums text-[var(--lx-text)]">
                  {quantity}
                </span>
                <Button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity || soldOut}
                  aria-label="Increase quantity"
                  className="flex h-full w-10 items-center justify-center rounded-r-full text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)] disabled:opacity-35"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
              <span className="text-[11px] text-[var(--lx-muted)]">
                {soldOut ? "Join the restock list at the atelier" : `${product.stock} units available`}
              </span>
            </div>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-[1fr_auto]">
              <RippleButton
                type="button"
                variant="primary"
                size="lg"
                loading={adding}
                disabled={soldOut}
                onClick={() => void add()}
                className="w-full"
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Added to bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    {soldOut ? "Sold out" : "Add to bag"}
                  </>
                )}
              </RippleButton>
              <div className="flex gap-2.5">
                <Button
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
                  aria-pressed={inWishlist}
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  className={cn(
                    "flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border transition duration-300",
                    inWishlist
                      ? "border-[var(--lx-gold)]/50 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]"
                      : "border-[var(--lx-border)] text-[var(--lx-muted)] hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]",
                  )}
                >
                  <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} aria-hidden />
                </Button>
                <Button
                  type="button"
                  onClick={() => compare.toggle(snapshotOf(product))}
                  aria-pressed={inCompare}
                  aria-label={inCompare ? "Remove from compare" : "Add to compare"}
                  className={cn(
                    "flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full border transition duration-300",
                    inCompare
                      ? "border-[var(--lx-gold)]/50 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]"
                      : "border-[var(--lx-border)] text-[var(--lx-muted)] hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]",
                  )}
                >
                  <Scale className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => void buyNow()}
              disabled={soldOut || buying}
              className="group mt-2.5 flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-full border border-[var(--lx-border-strong)] bg-transparent text-sm font-semibold text-[var(--lx-text)] transition duration-300 hover:border-[var(--lx-gold)]/50 hover:bg-[var(--lx-gold)]/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {buying ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              )}
              Buy now — skip the bag
            </Button>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: Truck, title: "Tracked delivery", text: "3–5 days" },
                { icon: RotateCcw, title: "7-day returns", text: "On the house" },
                { icon: ShieldCheck, title: "Authenticity", text: "Guaranteed" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[var(--lx-border)] p-3 text-center"
                >
                  <item.icon className="mx-auto h-4 w-4 text-[var(--lx-gold)]" aria-hidden />
                  <p className="mt-2 text-[10px] font-medium text-[var(--lx-text)]">{item.title}</p>
                  <p className="mt-0.5 text-[9px] text-[var(--lx-muted)]">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 divide-y divide-[var(--lx-border)] border-y border-[var(--lx-border)]">
              {[
                {
                  title: "Details & materials",
                  content: (
                    <div className="space-y-1.5 pb-4 text-xs leading-6 text-[var(--lx-muted)]">
                      <p>Material: {product.material || "Atelier selection"}</p>
                      <p>Country of origin: {product.country || "Imported"}</p>
                      <p>Weight: {product.weight || "—"} kg</p>
                      <p>Reference: {product.sku}</p>
                    </div>
                  ),
                },
                {
                  title: "Care & provenance",
                  content: (
                    <p className="pb-4 text-xs leading-6 text-[var(--lx-muted)]">
                      Each piece is inspected by the atelier before dispatch. Store away from direct
                      sunlight and follow the care label. Provenance and authenticity are verified on
                      every order.
                    </p>
                  ),
                },
                {
                  title: "Shipping & returns",
                  content: (
                    <div className="space-y-1.5 pb-4 text-xs leading-6 text-[var(--lx-muted)]">
                      <p>Tracked worldwide delivery within 3–5 business days.</p>
                      <p>Flat shipping of $49 is calculated in your bag.</p>
                      <p>7-day returns, collected from your door at no extra cost.</p>
                    </div>
                  ),
                },
              ].map((section) => (
                <details key={section.title} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium text-[var(--lx-text)]">
                    {section.title}
                    <ChevronDown
                      className="h-4 w-4 text-[var(--lx-muted)] transition duration-300 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  {section.content}
                </details>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-[10px] text-[var(--lx-muted)]">
              <PackageCheck className="h-3.5 w-3.5 text-[var(--lx-emerald)]" aria-hidden />
              MECO handles the hand-off — live tracking the moment it leaves the atelier.
            </div>
          </div>
        </div>

        <LazySection minHeight={680} label="Loading recommendations for this piece">
          <ProductRecommendations pool={recommendationPool} product={product} />
        </LazySection>
      </div>
    </div>
  );
}
