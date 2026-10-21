import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/shop/storefront-ui";
import { getCategoryPageData } from "@/lib/services/storefront";
import { getCategoryBySlug } from "@/lib/repositories/categories";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} | MeCart` : "Collection | MeCart",
    description: category?.description ?? "Explore the MeCart atelier collection.",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ subcategory?: string }>;
}) {
  const { slug } = await params;
  const { subcategory } = await searchParams;
  const { products, categories, category } = await getCategoryPageData(slug);

  if (!category) notFound();

  const subMap = new Map<string, { name: string; count: number }>();
  products.forEach((product) => {
    if (!product.subCategorySlug) return;
    const current = subMap.get(product.subCategorySlug);
    subMap.set(product.subCategorySlug, {
      name: product.subCategoryName || current?.name || product.subCategorySlug,
      count: (current?.count ?? 0) + 1,
    });
  });

  const subs = [...subMap.entries()].map(([value, meta]) => ({ value, ...meta }));
  const activeSub = subcategory && subMap.has(subcategory) ? subcategory : "";
  const visible = activeSub ? products.filter((product) => product.subCategorySlug === activeSub) : products;
  const others = categories.filter((item) => item.slug !== category.slug).slice(0, 3);

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Collections", href: "/categories" },
            { label: category.name },
          ]}
          className="mb-10"
        />

        <section className="lx-dark-scene relative isolate overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0a0c1a]">
          {category.imageUrl ? (
            <Image
              src={category.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-45"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#05060e] via-[#05060e]/80 to-[#05060e]/25" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(240,196,108,0.2),transparent_68%)] blur-3xl"
          />

          <div className="relative z-10 flex flex-col gap-10 p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-14">
            <div className="max-w-2xl">
              <p className="lx-eyebrow">Collection</p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4rem] lg:leading-[0.98]">
                {category.name}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--lx-muted)] sm:text-base">
                {category.description ??
                  `A considered edit of ${category.name.toLowerCase()} pieces — chosen for form, finish and everyday use.`}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="lx-glass inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-cyan)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {category.productCount} {category.productCount === 1 ? "piece" : "pieces"} live
                </span>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 text-xs text-white/60 transition hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  All collections
                </Link>
              </div>
            </div>

            <div className="lx-glass hidden min-w-52 flex-col gap-1 rounded-2xl p-5 sm:flex">
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                Atelier note
              </p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Edited in small batches. Restocked from live inventory, never from a lookbook.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-6 border-b border-[var(--lx-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
              {activeSub ? subMap.get(activeSub)?.name : "The edit"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--lx-text)]">
              {visible.length} {visible.length === 1 ? "piece" : "pieces"} in this collection
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex w-fit items-center gap-2 text-sm text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
          >
            Search the full catalogue <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {subs.length ? (
          <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            <Link
              href={`/categories/${category.slug}`}
              className={cn("lx-chip whitespace-nowrap", !activeSub && "lx-chip-active")}
            >
              All pieces
              <span className="text-[10px] opacity-60">{products.length}</span>
            </Link>
            {subs.map((item) => (
              <Link
                key={item.value}
                href={`/categories/${category.slug}?subcategory=${encodeURIComponent(item.value)}`}
                className={cn("lx-chip whitespace-nowrap", activeSub === item.value && "lx-chip-active")}
              >
                {item.name}
                <span className="text-[10px] opacity-60">{item.count}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {visible.length ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              icon={PackageSearch}
              eyebrow="Between drops"
              title="This capsule is being restocked."
              description="The atelier is preparing the next edit. Browse the live catalogue while you wait."
            >
              <Link
                href="/products"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)] transition hover:-translate-y-0.5"
              >
                Browse all products <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </EmptyState>
          </div>
        )}

        {others.length ? (
          <section className="mt-20">
            <PageHeader
              eyebrow="Keep exploring"
              title={
                <>
                  Other <span className="lx-serif text-[var(--lx-gold)]">capsules</span>
                </>
              }
              description="Three more edits from the archive, each pulled from live stock."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {others.map((item) => (
                <Link
                  key={item.id}
                  href={`/categories/${item.slug}`}
                  className="lx-card group flex items-center justify-between gap-4 rounded-2xl p-5 transition hover:-translate-y-1"
                >
                  <div>
                    <p className="text-base font-medium text-[var(--lx-text)]">{item.name}</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                      {item.productCount} pieces
                    </p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition group-hover:border-[var(--lx-gold)]/60 group-hover:text-[var(--lx-gold)]">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
