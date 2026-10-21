"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  LockKeyhole,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { RippleButton } from "@/components/luxe/primitives";
import { Breadcrumbs, EmptyState, Skeleton } from "@/components/shop/storefront-ui";
import { cn } from "@/lib/cn";

function QuantityStepper({
  quantity,
  onChange,
  disabled,
}: {
  quantity: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-9 items-center rounded-full border border-[var(--lx-border)] bg-[var(--lx-surface)]">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={disabled || quantity <= 1}
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center rounded-l-full text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center text-xs font-semibold tabular-nums text-[var(--lx-text)]"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={disabled || quantity >= 20}
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center rounded-r-full text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function CartLine({
  item,
  index,
  busy,
  saved,
  onQuantity,
  onRemove,
  onSave,
}: {
  item: CartItem;
  index: number;
  busy: boolean;
  saved: boolean;
  onQuantity: (value: number) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const variant = [item.size, item.color].filter(Boolean).join(" · ");

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.16), ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface)] transition-colors duration-300 hover:border-[var(--lx-border-strong)]"
    >
      <div className="flex gap-4 p-3 sm:gap-5 sm:p-4">
        <Link
          href={`/products/${item.slug}`}
          className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--lx-surface-2)] sm:h-32 sm:w-28"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover transition duration-700 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--lx-muted)]/40">
              {item.name[0]}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--lx-gold)]">
                Atelier object
              </p>
              <Link
                href={`/products/${item.slug}`}
                className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[var(--lx-text)] transition hover:text-[var(--lx-gold)] sm:text-[0.95rem]"
              >
                {item.name}
              </Link>
              <p className="mt-1.5 text-xs text-[var(--lx-muted)]">
                {variant || "One size"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-[var(--lx-text)]">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <QuantityStepper quantity={item.quantity} onChange={onQuantity} disabled={busy} />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSave}
                disabled={busy || saved}
                className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={saved ? "Saved to wishlist" : "Save for later"}
              >
                {saved ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--lx-emerald)]" aria-hidden />
                ) : (
                  <Heart className="h-3.5 w-3.5" aria-hidden />
                )}
                <span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
              </button>
              <button
                type="button"
                onClick={onRemove}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--lx-muted)] transition hover:bg-[var(--lx-rose)]/10 hover:text-[var(--lx-rose)] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-[var(--lx-gold)]/0 to-transparent transition-all duration-500 group-hover:via-[var(--lx-gold)]/60"
      />
    </motion.li>
  );
}

export default function CartPage() {
  const cart = useCart();
  const wishlist = useWishlist();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const shipping = cart.subtotal > 0 ? 49 : 0;
  const tax = Math.round(cart.subtotal * 0.08);
  const total = cart.subtotal + shipping + tax;

  const lineKey = (item: CartItem) => `${item.productId}-${item.size ?? ""}-${item.color ?? ""}`;

  const updateLine = async (item: CartItem, value: number) => {
    const key = lineKey(item);
    setBusyKey(key);
    try {
      await cart.updateQuantity(item.productId, value, item.size, item.color);
    } finally {
      setBusyKey(null);
    }
  };

  const removeLine = async (item: CartItem) => {
    const key = lineKey(item);
    setBusyKey(key);
    try {
      await cart.removeItem(item.productId, item.size, item.color);
    } finally {
      setBusyKey(null);
    }
  };

  const saveForLater = async (item: CartItem) => {
    const key = lineKey(item);
    setBusyKey(key);
    try {
      if (!wishlist.has(item.productId)) {
        await wishlist.add({
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          image: item.image,
        });
      }
      await cart.removeItem(item.productId, item.size, item.color);
      toast.success("Moved to your wishlist", { description: item.name });
    } finally {
      setBusyKey(null);
    }
  };

  if (cart.loading) {
    return (
      <div className="lx-page">
        <div className="lx-container py-14">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-7 h-14 w-72" />
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_24rem]">
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-40 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-[26rem] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="lx-page">
        <div className="lx-container py-14 sm:py-20">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Bag" }]}
            className="mb-10"
          />
          <EmptyState
            icon={ShoppingBag}
            eyebrow="The bag"
            title="An open page, for now."
            description="Your bag is waiting for its first object. Start with a curated capsule or browse the full live catalogue."
          >
            <RippleButton href="/products" variant="primary" size="lg">
              Explore the collection <ArrowRight className="h-4 w-4" aria-hidden />
            </RippleButton>
            <Link
              href="/categories"
              className="lx-glass inline-flex h-[3.25rem] items-center gap-2 rounded-full px-7 text-sm font-medium text-[var(--lx-text)]"
            >
              Browse capsules
            </Link>
          </EmptyState>

          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, title: "Tracked delivery", text: "Dispatched within 24 hours" },
              { icon: RotateCcw, title: "7-day returns", text: "Collected from your door" },
              { icon: ShieldCheck, title: "Secure payment", text: "Encrypted end-to-end" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-[var(--lx-border)] p-4"
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-[var(--lx-text)]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-[var(--lx-muted)]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag" }]} className="mb-10" />

        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--lx-border)] pb-7">
          <div>
            <p className="lx-eyebrow">Reserved for you</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-5xl">
              Your <span className="lx-serif text-[var(--lx-gold)]">bag</span>
            </h1>
            <p className="mt-3 text-sm text-[var(--lx-muted)]">
              {cart.count} {cart.count === 1 ? "object" : "objects"} · live stock reserved while you
              decide.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Continue exploring
          </Link>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div>
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {cart.items.map((item, index) => {
                  const key = lineKey(item);
                  return (
                    <CartLine
                      key={key}
                      item={item}
                      index={index}
                      busy={busyKey === key}
                      saved={wishlist.has(item.productId)}
                      onQuantity={(value) => void updateLine(item, value)}
                      onRemove={() => void removeLine(item)}
                      onSave={() => void saveForLater(item)}
                    />
                  );
                })}
              </AnimatePresence>
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--lx-border-strong)] px-5 py-4">
              <p className="flex items-center gap-2 text-xs text-[var(--lx-muted)]">
                <Sparkles className="h-4 w-4 text-[var(--lx-gold)]" aria-hidden />
                Every order is packed by hand in the atelier.
              </p>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                No plastic · Recyclable
              </span>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <div className="lx-card overflow-hidden rounded-[1.75rem]">
              <div className="border-b border-[var(--lx-border)] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--lx-text)]">
                    Order summary
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                    USD
                  </span>
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">
                      ${cart.subtotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt className="flex items-center gap-1.5">
                      Shipping
                      <Truck className="h-3.5 w-3.5" aria-hidden />
                    </dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">
                      ${shipping.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-[var(--lx-muted)]">
                    <dt>Estimated tax</dt>
                    <dd className="tabular-nums text-[var(--lx-text)]">${tax.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                      Total due
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--lx-faint)]">
                      Tax & shipping included
                    </p>
                  </div>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={total}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--lx-text)]"
                    >
                      ${total.toFixed(2)}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="mt-6">
                  <RippleButton
                    href="/checkout"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    ariaLabel="Proceed to secure checkout"
                  >
                    Secure checkout
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </RippleButton>
                </div>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-[var(--lx-muted)]">
                  <LockKeyhole className="h-3 w-3" aria-hidden />
                  Encrypted checkout · Visa · Mastercard · UPI
                </p>

                <div className="mt-5 space-y-2.5 border-t border-[var(--lx-border)] pt-5">
                  {[
                    { icon: Truck, text: "Tracked worldwide delivery" },
                    { icon: RotateCcw, text: "Free 7-day atelier returns" },
                    { icon: ShieldCheck, text: "Authenticity guaranteed" },
                  ].map((item) => (
                    <p
                      key={item.text}
                      className="flex items-center gap-2 text-[11px] text-[var(--lx-muted)]"
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                      {item.text}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--lx-muted)]">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-[var(--lx-emerald)]")} />
              MECO is standing by for dispatch
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
