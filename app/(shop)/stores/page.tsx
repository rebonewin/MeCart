import Link from "next/link";
import { ArrowUpRight, Search, Sparkles, Store, Users } from "lucide-react";
import { PageHeader, Breadcrumbs, EmptyState } from "@/components/shop/storefront-ui";
import { StoreCard } from "@/components/marketplace/store-card";
import { listPublicStores, getMarketplaceStats } from "@/lib/repositories/marketplace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Stores | MeCart",
  description: "Discover independent ateliers, makers and curated stores on MeCart.",
};

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const [stores, stats] = await Promise.all([
    listPublicStores({ search: query || undefined, limit: 48 }),
    getMarketplaceStats(),
  ]);

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Stores" }]} className="mb-10" />
        <PageHeader
          align="center"
          eyebrow="The marketplace"
          title={<>Independent <span className="lx-serif text-[var(--lx-gold)]">ateliers</span>, one destination</>}
          description="Explore storefronts from vetted makers and curators. Every seller is reviewed before their products reach the atelier."
        />

        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {[
            { label: "Sellers", value: stats.vendors },
            { label: "Stores", value: stats.stores },
            { label: "Pieces", value: stats.products },
          ].map((stat) => (
            <span key={stat.label} className="lx-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-[var(--lx-muted)]">
              <span className="font-semibold text-[var(--lx-text)]">{stat.value.toLocaleString("en-US")}</span> {stat.label}
            </span>
          ))}
          {stats.rating > 0 && (
            <span className="lx-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-[var(--lx-muted)]">
              <span className="font-semibold text-[var(--lx-gold)]">{stats.rating.toFixed(1)}</span> average rating
            </span>
          )}
        </div>

        <form action="/stores" method="GET" className="mx-auto mt-8 max-w-xl">
          <div className="lx-glass flex h-12 items-center gap-3 rounded-full pl-5 pr-1.5">
            <Search className="h-4 w-4 text-[var(--lx-muted)]" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search stores by name…"
              className="w-full bg-transparent text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)]"
            />
            <button type="submit" className="h-9 shrink-0 rounded-full bg-[var(--lx-text)] px-4 text-xs font-semibold text-[var(--lx-bg)]">
              Search
            </button>
          </div>
        </form>

        {stores.length ? (
          <section className="mt-12" aria-label="Marketplace stores">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">Storefronts</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--lx-text)]">
                  {stores.length} {stores.length === 1 ? "store" : "stores"}{query ? ` for “${query}”` : ""}
                </h2>
              </div>
              <Link href="/search" className="hidden items-center gap-1 text-sm text-[var(--lx-muted)] hover:text-[var(--lx-text)] sm:inline-flex">
                Search everything <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => <StoreCard key={store.id} store={store} />)}
            </div>
          </section>
        ) : (
          <div className="mx-auto mt-14 max-w-2xl">
            <EmptyState
              icon={Store}
              eyebrow="No stores found"
              title={query ? `Nothing matches “${query}”` : "The first ateliers are arriving"}
              description={query ? "Try a shorter name or browse every store." : "Seller applications are reviewed by the MeCart marketplace team before stores go live."}
            >
              <Link href="/stores" className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)]">
                Browse stores <ArrowUpRight className="h-4 w-4" />
              </Link>
            </EmptyState>
          </div>
        )}

        <section className="mt-16 overflow-hidden rounded-[2rem] border border-[var(--lx-border)] bg-[var(--lx-surface)] p-8 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--lx-gold)]/25 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-gold)]">Sell on MeCart</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--lx-text)]">Your atelier deserves a wider room.</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--lx-muted)]">Apply once, launch multiple storefronts and run orders, finance and customer care from one workspace.</p>
              </div>
            </div>
            <Link href="/seller/onboarding" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)]">
              <Users className="h-4 w-4" /> Become a seller
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
