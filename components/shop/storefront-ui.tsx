import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Breadcrumbs                                                        */
/* ------------------------------------------------------------------ */

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight className="h-3 w-3 text-[var(--lx-faint)]" aria-hidden />
            ) : null}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--lx-text)]"
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* PageHeader — editorial header used across commerce pages            */
/* ------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
  crumbs,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  aside?: React.ReactNode;
  crumbs?: Crumb[];
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header className={cn("relative", className)}>
      {crumbs?.length ? <Breadcrumbs items={crumbs} className="mb-8" /> : null}
      <div
        className={cn(
          "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between",
          align === "center" && "items-center text-center",
        )}
      >
        <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
          <p className={cn("lx-eyebrow", align === "center" && "justify-center")}>{eyebrow}</p>
          <h1 className="lx-display mt-5 text-[var(--lx-text)]">{title}</h1>
          {description ? (
            <p
              className={cn(
                "mt-5 max-w-xl text-sm leading-7 text-[var(--lx-muted)] sm:text-base",
                align === "center" && "mx-auto",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* SectionTitle — compact in-page section heading                      */
/* ------------------------------------------------------------------ */

export function SectionTitle({
  eyebrow,
  title,
  aside,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="lx-eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-2xl">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("lx-card relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--lx-gold)_25%,transparent),transparent_68%)] blur-2xl"
      />
      <span className="lx-glass relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-[var(--lx-gold)]">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      {eyebrow ? <p className="lx-eyebrow mt-6 justify-center">{eyebrow}</p> : null}
      <h2 className="mx-auto mt-3 max-w-lg text-2xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--lx-muted)]">{description}</p>
      ) : null}
      {children ? <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                          */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("lx-skeleton", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="lx-card overflow-hidden rounded-3xl">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function PageLoadingSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="lx-page lx-container py-14 sm:py-20" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-6 h-14 w-3/4 max-w-2xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <ProductGridSkeleton count={cards} className="mt-10" />
    </div>
  );
}
