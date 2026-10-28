"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, type ReactNode } from "react";
import {
  ArrowRight,
  Heart,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  isSafeAssistantHref,
  isSafeProductSlug,
} from "@/lib/ai/safety";
import type {
  AssistantAction,
  AssistantProduct,
  AssistantReply,
} from "@/lib/ai/types";

export const AssistantProductCard = memo(function AssistantProductCard({
  product,
  onAdd,
  adding,
  saved,
  onSave,
  onNavigate,
}: {
  product: AssistantProduct;
  onAdd: (product: AssistantProduct) => void;
  adding: boolean;
  saved: boolean;
  onSave: (product: AssistantProduct) => void;
  onNavigate: () => void;
}) {
  const productHref = isSafeProductSlug(product.slug)
    ? `/products/${product.slug}`
    : "/products";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--lx-glass-border)] bg-[var(--lx-surface)]/90 transition duration-300 hover:border-[var(--lx-gold)]/30 hover:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]">
      <Link href={productHref} onClick={onNavigate} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="180px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--lx-muted)]">
              {product.name.charAt(0)}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#080b15]/80 to-transparent" />
          {product.stock <= 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-[#1A1D24]/85 px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-white/70 backdrop-blur">
              Waitlist
            </span>
          ) : product.newArrival ? (
            <span className="absolute left-2 top-2 rounded-full bg-[var(--lx-gold)]/90 px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-[var(--lx-bg)]">
              New
            </span>
          ) : null}
        </div>
        <div className="px-2.5 pb-1.5 pt-2">
          <p className="truncate text-[9px] uppercase tracking-[0.16em] text-[var(--lx-muted)]">
            {product.brandName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-4 text-[var(--lx-text)]">
            {product.name}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-[11px] text-[var(--lx-gold)]">
              ${product.price.toFixed(2)}
            </p>
            {product.rating > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-[var(--lx-muted)]">
                <Star
                  className="h-2.5 w-2.5 fill-[var(--lx-gold)] text-[var(--lx-gold)]"
                  aria-hidden
                />
                {product.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <Button
        type="button"
        onClick={() => onSave(product)}
        aria-label={
          saved
            ? `Remove ${product.name} from your wishlist`
            : `Save ${product.name} to your wishlist`
        }
        aria-pressed={saved}
        className={cn(
          "absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#080b15]/60 text-white/65 backdrop-blur transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]",
          saved && "border-[var(--lx-gold)]/40 bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]",
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} aria-hidden />
      </Button>

      <Button
        type="button"
        onClick={() => onAdd(product)}
        disabled={adding || product.stock <= 0}
        className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--lx-glass-border)] py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--lx-muted)] transition hover:bg-[var(--lx-gold)]/10 hover:text-[var(--lx-gold)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Add ${product.name} to bag`}
      >
        {adding ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="h-3 w-3" aria-hidden />
        )}
        {product.stock <= 0 ? "Waitlist" : "Add to bag"}
      </Button>
    </div>
  );
});

function AssistantActionLink({
  action,
  onNavigate,
}: {
  action: AssistantAction;
  onNavigate: () => void;
}) {
  if (!isSafeAssistantHref(action.href)) return null;

  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-gold)]/35 bg-[var(--lx-gold)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--lx-gold)] transition hover:bg-[var(--lx-gold)]/20";
  if (/^(mailto:|https?:\/\/)/i.test(action.href)) {
    return (
      <a
        href={action.href}
        target={/^https?:\/\//i.test(action.href) ? "_blank" : undefined}
        rel="noreferrer"
        className={className}
      >
        {action.label}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={action.href} onClick={onNavigate} className={className}>
      {action.label}
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

export function StreamingCaret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse rounded-full bg-[var(--lx-gold)] align-middle"
    />
  );
}

export function ReplyBody({
  reply,
  onAdd,
  addingId,
  savedIds,
  onSave,
  onNavigate,
  streaming,
}: {
  reply: AssistantReply;
  onAdd: (product: AssistantProduct) => void;
  addingId: string | null;
  savedIds: Set<string>;
  onSave: (product: AssistantProduct) => void;
  onNavigate: () => void;
  streaming?: boolean;
}) {
  return (
    <div className="space-y-3">
      {reply.text ? (
        <p className="whitespace-pre-line text-[13px] leading-6 text-[var(--lx-text)]/90">
          {reply.text}
          {streaming ? <StreamingCaret /> : null}
        </p>
      ) : null}

      {reply.products?.length ? (
        <div className="grid grid-cols-2 gap-2">
          {reply.products.slice(0, 4).map((product) => (
            <AssistantProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              adding={addingId === product.id}
              saved={savedIds.has(product.id)}
              onSave={onSave}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}

      {reply.categories?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {reply.categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              onClick={onNavigate}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--lx-glass-border)] px-2.5 py-1 text-[10px] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
            >
              {category.name}
              <span className="font-mono text-[9px] text-[var(--lx-muted)]/60">
                {category.productCount}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {reply.actions?.length ? (
        <div className="flex flex-wrap gap-2">
          {reply.actions.slice(0, 4).map((action) => (
            <AssistantActionLink
              key={`${action.label}-${action.href}`}
              action={action}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MessageError({
  message,
  retryable,
  onRetry,
  children,
}: {
  message: string;
  retryable: boolean;
  onRetry: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className="mt-2 rounded-xl border border-[var(--lx-rose)]/25 bg-[var(--lx-rose)]/[0.07] px-3 py-2.5"
      role="alert"
    >
      <p className="text-[11px] leading-5 text-[var(--lx-rose)]/90">{message}</p>
      {children}
      {retryable ? (
        <Button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-rose)]/30 px-2.5 py-1 text-[10px] font-medium text-[var(--lx-rose)] transition hover:bg-[var(--lx-rose)]/10"
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
