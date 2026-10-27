import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Boxes, Sparkles } from "lucide-react";
import { Reveal, RippleButton, Tilt } from "@/components/luxe/primitives";
import { Breadcrumbs, PageHeader } from "@/components/shop/storefront-ui";
import { listCategoriesWithCounts, listSubCategories } from "@/lib/repositories/categories";

export const dynamic = "force-dynamic";

const TONES = [
  "from-[#6366f1]/50 via-[#6366f1]/10 to-transparent",
  "from-[#E6C768]/45 via-[#E6C768]/10 to-transparent",
  "from-[#D4AF37]/45 via-[#D4AF37]/10 to-transparent",
  "from-[#D4AF37]/45 via-[#D4AF37]/10 to-transparent",
  "from-[#34d399]/40 via-[#34d399]/10 to-transparent",
  "from-[#D98B8B]/40 via-[#D98B8B]/10 to-transparent",
] as const;

export default async function CategoriesPage() {
  const [categories, subCategories] = await Promise.all([
    listCategoriesWithCounts(),
    listSubCategories(),
  ]);
  const liveCategories = categories.filter((category) => category.productCount > 0);

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} className="mb-10" />

        <PageHeader
          eyebrow="Browse the archive"
          title={
            <>
              The <span className="lx-serif text-[var(--lx-gold)]">collections</span>
            </>
          }
          description={`${liveCategories.length} living ${liveCategories.length === 1 ? "capsule" : "capsules"}, restocked from real inventory. Each collection is edited by the atelier and delivered with the same care.`}
          aside={
            <div className="lx-glass flex items-center gap-4 rounded-2xl px-5 py-4">
              <Boxes className="h-5 w-5 text-[var(--lx-gold)]" aria-hidden />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                  Live capsules
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--lx-text)]">
                  {liveCategories.length}
                </p>
              </div>
            </div>
          }
        />

        {liveCategories.length ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveCategories.map((category, index) => {
              const children = subCategories.filter((item) => item.categorySlug === category.slug);
              const featured = index === 0;
              return (
                <Reveal
                  key={category.id}
                  delay={(index % 3) * 0.07}
                  className={featured ? "sm:col-span-2" : undefined}
                >
                  <Tilt className="h-full" radiusClass="rounded-[1.75rem]" max={6}>
                    <Link
                      href={`/categories/${category.slug}`}
                      aria-label={`${category.name} — ${category.productCount} pieces`}
                      className="lx-dark-scene group relative flex h-full min-h-[19rem] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0a0c1a] p-6 transition-shadow duration-500 hover:shadow-[0_44px_90px_-50px_rgba(169,120,46,0.55)] sm:p-8"
                    >
                      {category.imageUrl ? (
                        <Image
                          src={category.imageUrl}
                          alt=""
                          fill
                          sizes={featured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
                          className="object-cover opacity-55 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-70"
                        />
                      ) : null}
                      <div className={cnLocal("absolute inset-0 bg-gradient-to-br", TONES[index % TONES.length])} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/45 to-transparent" />

                      <div className="relative z-10 flex items-start justify-between gap-4">
                        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                          {String(index + 1).padStart(2, "0")} / {String(liveCategories.length).padStart(2, "0")}
                        </span>
                        <span className="lx-glass flex h-11 w-11 items-center justify-center rounded-full text-white transition duration-500 group-hover:rotate-6 group-hover:scale-110 group-hover:text-[var(--lx-gold)]">
                          <Sparkles className="h-4 w-4" aria-hidden />
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h2
                          className={
                            featured
                              ? "text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                              : "text-2xl font-semibold tracking-tight text-white"
                          }
                        >
                          {category.name}
                        </h2>
                        {category.description ? (
                          <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-6 text-[var(--lx-muted)]">
                            {category.description}
                          </p>
                        ) : (
                          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--lx-muted)]">
                            A considered edit of {category.name.toLowerCase()} pieces, chosen for form, finish and daily use.
                          </p>
                        )}

                        {children.length ? (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {children.slice(0, 4).map((child) => (
                              <span
                                key={child.id}
                                className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/55"
                              >
                                {child.name}
                              </span>
                            ))}
                            {children.length > 4 ? (
                              <span className="rounded-full border border-white/12 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                                +{children.length - 4}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--lx-cyan)]">
                            {category.productCount} {category.productCount === 1 ? "piece" : "pieces"}
                          </span>
                          <span className="flex items-center gap-2 text-xs font-medium text-white/65 transition group-hover:text-[var(--lx-gold)]">
                            Enter collection
                            <ArrowUpRight className="h-4 w-4" aria-hidden />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="lx-card mt-14 rounded-[2rem] px-6 py-20 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--lx-gold)]">
              The archive is being prepared
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--lx-text)]">Collections land soon.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[var(--lx-muted)]">
              The atelier is curating the first capsules. In the meantime, the full catalogue is live.
            </p>
            <div className="mt-6">
              <RippleButton href="/products" variant="primary">
                Browse all products <ArrowUpRight className="h-4 w-4" aria-hidden />
              </RippleButton>
            </div>
          </div>
        )}

        <div className="lx-card relative mt-16 overflow-hidden rounded-[2rem] p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--lx-gold)_20%,transparent),transparent_68%)] blur-3xl"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--lx-gold)]">
                Between collections
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-3xl">
                The full catalogue is always open.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--lx-muted)]">
                Search every maison, colour and size in one place — live stock, no dead ends.
              </p>
            </div>
            <RippleButton href="/products" variant="primary" size="lg">
              View all products <ArrowUpRight className="h-4 w-4" aria-hidden />
            </RippleButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Local class-joiner keeps the gradient tone list readable without importing client utils. */
function cnLocal(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
