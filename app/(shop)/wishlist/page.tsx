"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWishlist, type WishlistItem } from "@/lib/wishlist-context";
import { useCartMotion } from "@/components/storefront/rider/use-cart-motion";
import { RippleButton } from "@/components/luxe/primitives";
import { Breadcrumbs, EmptyState, PageHeader, Skeleton } from "@/components/shop/storefront-ui";

function SavedCard({
  item,
  index,
  onRemove,
}: {
  item: WishlistItem;
  index: number;
  onRemove: () => Promise<void>;
}) {
  const { addToCart } = useCartMotion();
  const imageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const moveToBag = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await addToCart(
        {
          productId: item.productId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          image: item.image,
          quantity: 1,
        },
        { sourceEl: imageRef.current },
      );
      await onRemove();
      toast.success("Moved to your bag", { description: item.name });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className="lx-card group relative flex flex-col overflow-hidden rounded-[1.5rem]"
    >
      <div ref={imageRef} className="relative aspect-[4/5] overflow-hidden bg-[var(--lx-surface-2)]">
        <Link href={`/products/${item.slug}`} aria-label={item.name} className="absolute inset-0 block">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-4xl font-black text-[var(--lx-muted)]/30">
              {item.name[0]}
            </span>
          )}
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/35 via-transparent to-transparent opacity-60" />
        <Button
          type="button"
          onClick={() => {
            void onRemove();
            toast.success("Removed from saved pieces", { description: item.name });
          }}
          aria-label={`Remove ${item.name} from wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-[#0B0B0F]/45 text-white/80 backdrop-blur-xl transition hover:border-[var(--lx-rose)]/50 hover:bg-[var(--lx-rose)]/20 hover:text-white"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-[#0B0B0F]/40 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
          Saved piece
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--lx-gold)]">
            Atelier wishlist
          </p>
          <Link
            href={`/products/${item.slug}`}
            className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-[var(--lx-text)] transition hover:text-[var(--lx-gold)]"
          >
            {item.name}
          </Link>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--lx-border)] pt-3">
          <span className="text-sm font-semibold tabular-nums text-[var(--lx-text)]">
            ${item.price.toFixed(2)}
          </span>
          <Button
            type="button"
            onClick={() => void moveToBag()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--lx-text)] px-4 text-[10px] font-semibold text-[var(--lx-bg)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Moving…" : "Move to bag"}
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default function WishlistPage() {
  const wishlist = useWishlist();

  if (wishlist.loading) {
    return (
      <div className="lx-page">
        <div className="lx-container py-14">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-7 h-14 w-80" />
          <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Saved pieces" }]} className="mb-10" />

        <PageHeader
          eyebrow="The wishlist"
          title={
            <>
              Saved <span className="lx-serif text-[var(--lx-gold)]">pieces</span>
            </>
          }
          description="An edit of your own. Saved pieces live in your account, ready to move to the bag whenever the moment is right."
          aside={
            <div className="lx-glass flex items-center gap-4 rounded-2xl px-5 py-4">
              <Heart className="h-5 w-5 text-[var(--lx-gold)]" aria-hidden />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                  In your edit
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--lx-text)]">
                  {wishlist.items.length}
                </p>
              </div>
            </div>
          }
        />

        {wishlist.items.length ? (
          <>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--lx-border)] pb-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                {wishlist.items.length} {wishlist.items.length === 1 ? "piece" : "pieces"} saved
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
              >
                Find something new <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <motion.div layout className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {wishlist.items.map((item, index) => (
                  <SavedCard
                    key={item.productId}
                    item={item}
                    index={index}
                    onRemove={() => wishlist.remove(item.productId)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[var(--lx-border)] px-6 py-5 text-center sm:flex-row sm:text-left">
              <p className="max-w-xl text-xs leading-6 text-[var(--lx-muted)]">
                Your saved pieces stay here between visits. Prices and availability are refreshed from
                live stock when you move them to the bag.
              </p>
              <RippleButton href="/products" variant="glass" size="sm">
                Continue exploring <ArrowRight className="h-4 w-4" aria-hidden />
              </RippleButton>
            </div>
          </>
        ) : (
          <div className="mt-10">
            <EmptyState
              icon={Heart}
              eyebrow="An empty save"
              title="Nothing saved yet."
              description="Tap the heart on any piece to keep it here. The atelier will hold the edit while you consider."
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
          </div>
        )}
      </div>
    </div>
  );
}
