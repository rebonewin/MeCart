import Link from "next/link";
import { ArrowUpRight, Search, SearchX, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState, PageHeader, Breadcrumbs } from "@/components/shop/storefront-ui";
import { RecentSearches } from "@/components/storefront/recent-searches";
import { listProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

const POPULAR = ["Watches", "Sneakers", "Headphones", "Fragrance", "New arrivals"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await listProducts({ search: query, limit: 60 }) : [];

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} className="mb-10" />

        <PageHeader
          align="center"
          eyebrow="Search the atelier"
          title={
            <>
              Find your next <span className="lx-serif text-[var(--lx-gold)]">object</span>
            </>
          }
          description="Search the live catalogue by piece, maison or collection. Everything you see is in stock and ready for the atelier queue."
        />

        <form action="/search" method="GET" role="search" className="group relative mx-auto mt-10 max-w-2xl">
          <div className="lx-glass lx-panel-glow flex h-14 items-center gap-3 rounded-full pl-5 pr-1.5 transition focus-within:border-[var(--lx-gold)]/45">
            <Search className="h-5 w-5 shrink-0 text-[var(--lx-muted)]" aria-hidden />
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search products, brands, categories…"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)]/70 sm:text-base [&::-webkit-search-cancel-button]:hidden"
            />
            <button
              type="submit"
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--lx-text)] px-5 text-sm font-semibold text-[var(--lx-bg)] transition duration-300 hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
            >
              Search
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>

        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
            Popular
          </span>
          {POPULAR.map((term) => (
            <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="lx-chip">
              {term}
            </Link>
          ))}
        </div>

        {!query ? (
          <>
            <RecentSearches />
            <div className="mx-auto mt-14 max-w-3xl">
              <div className="lx-card relative overflow-hidden rounded-[2rem] p-8 text-center sm:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--lx-gold)_22%,transparent),transparent_68%)] blur-2xl"
                />
                <span className="lx-glass relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-[var(--lx-gold)]">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="relative mt-5 text-xl font-semibold text-[var(--lx-text)]">
                  Not sure where to begin?
                </h2>
                <p className="relative mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--lx-muted)]">
                  Start with a curated collection, or let the atelier recommendations lead.
                </p>
                <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/categories"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)] transition hover:-translate-y-0.5"
                  >
                    Browse collections <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/products"
                    className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium text-[var(--lx-text)]"
                  >
                    View all products
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : results.length ? (
          <section className="mt-14" aria-label="Search results">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                  Search result
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--lx-text)]">
                  {results.length} {results.length === 1 ? "piece" : "pieces"} for “{query}”
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
              >
                Browse the full collection <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <div className="mx-auto mt-14 max-w-2xl">
            <EmptyState
              icon={SearchX}
              eyebrow="No matches"
              title={`Nothing found for “${query}”`}
              description="Try a shorter keyword, a maison name, or one of the popular searches above."
            >
              <Link
                href="/products"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)] transition hover:-translate-y-0.5"
              >
                Browse everything <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/categories"
                className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium text-[var(--lx-text)]"
              >
                Collections
              </Link>
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  );
}
