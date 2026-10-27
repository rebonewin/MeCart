import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { BadgeCheck, MapPin, Package, Search, ShieldCheck, Star, Store as StoreIcon, Truck, Users } from "lucide-react";
import { Breadcrumbs, EmptyState, SectionTitle } from "@/components/shop/storefront-ui";
import { ProductCard } from "@/components/shop/product-card";
import { StoreEngagement } from "@/components/marketplace/store-engagement";
import { getPublicStore } from "@/lib/repositories/marketplace";
import { listProducts } from "@/lib/repositories/products";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicStore(slug);
  if (!data) return { title: "Store not found | MeCart" };
  const { store } = data;
  return {
    title: store.seo_title || `${store.name} | MeCart Marketplace`,
    description: store.seo_description || store.tagline || store.description || `Shop ${store.name} on MeCart.`,
    openGraph: {
      title: store.seo_title || store.name,
      description: store.seo_description || store.tagline || undefined,
      images: store.banner_url ? [{ url: store.banner_url }] : store.logo_url ? [{ url: store.logo_url }] : undefined,
    },
  };
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);
  const data = await getPublicStore(slug);
  if (!data) notFound();
  const { store, vendor } = data;
  const query = (search.q ?? "").trim();
  const sort = (["newest", "price-asc", "price-desc", "rating", "popular"].includes(search.sort ?? "")
    ? search.sort
    : "newest") as "newest" | "price-asc" | "price-desc" | "rating" | "popular";

  const [products, user] = await Promise.all([
    listProducts({ storeId: store.id, search: query || undefined, sort, limit: 60 }),
    getCurrentUser(),
  ]);

  let following = false;
  if (user) {
    const supabase = await createClient();
    const { data: follow } = await supabase
      .from("store_followers")
      .select("id")
      .eq("store_id", store.id)
      .eq("user_id", user.id)
      .maybeSingle();
    following = Boolean(follow);
  }

  return (
    <div className="lx-page">
      <div className="lx-container py-8 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Stores", href: "/stores" },
            { label: store.name },
          ]}
        />
      </div>

      <section className="lx-container">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--lx-border)] bg-[var(--lx-surface)]">
          <div className="relative h-48 overflow-hidden sm:h-64 lg:h-80">
            {store.banner_url ? (
              <Image src={store.banner_url} alt={`${store.name} banner`} fill priority className="object-cover" sizes="100vw" />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: `radial-gradient(circle at 20% 20%, ${store.brand_primary_color}, #101116 72%)` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-[#101116]/30 to-transparent" />
          </div>

          <div className="relative px-5 pb-7 sm:px-8 lg:px-10">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border-2 border-[#101116] bg-[#1A1D24] text-2xl font-bold text-[var(--lx-gold)] shadow-2xl">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt={`${store.name} logo`} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    store.name.charAt(0)
                  )}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-3xl">{store.name}</h1>
                    <BadgeCheck className="h-5 w-5 text-[var(--lx-cyan)]" aria-label="Verified seller" />
                    {store.is_featured && (
                      <span className="rounded-full border border-[var(--lx-gold)]/30 bg-[var(--lx-gold)]/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--lx-gold)]">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--lx-muted)]">
                    by{" "}
                    {vendor?.slug ? (
                      <Link href={`/vendors/${vendor.slug}`} className="text-[var(--lx-text)] underline decoration-[var(--lx-border)] underline-offset-4 hover:decoration-[var(--lx-gold)]">
                        {vendor.display_name}
                      </Link>
                    ) : (
                      store.vendorName
                    )}
                    {store.city ? <span> · <MapPin className="mb-0.5 inline h-3 w-3" /> {store.city}, {store.country}</span> : null}
                  </p>
                </div>
              </div>
              <div className="pb-1">
                <StoreEngagement
                  storeId={store.id}
                  storeName={store.name}
                  storeSlug={store.slug}
                  isAuthenticated={Boolean(user)}
                  initialFollowing={following}
                  followerCount={store.follower_count}
                />
              </div>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--lx-muted)]">
              {store.tagline || store.description || "A MeCart marketplace storefront."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[var(--lx-border)] pt-5 sm:grid-cols-4">
              {[
                { icon: Package, label: "Pieces", value: store.product_count.toLocaleString("en-US") },
                { icon: Star, label: "Rating", value: store.rating ? `${Number(store.rating).toFixed(1)} (${store.review_count})` : "New" },
                { icon: Users, label: "Followers", value: store.follower_count.toLocaleString("en-US") },
                { icon: Truck, label: "Ships from", value: store.country },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--lx-border)] text-[var(--lx-gold)]">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--lx-muted)]">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[var(--lx-text)]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lx-container py-12 sm:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            eyebrow="The collection"
            title={<>{store.name} <span className="lx-serif text-[var(--lx-gold)]">pieces</span></>}
            aside={<p className="max-w-sm text-sm leading-6 text-[var(--lx-muted)]">Every item is owned, priced and fulfilled by this store. MeCart holds payment until delivery is confirmed.</p>}
          />
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form action={`/stores/${store.slug}`} className="lx-glass flex h-11 w-full max-w-md items-center gap-2 rounded-full pl-4 pr-1.5">
            <Search className="h-4 w-4 text-[var(--lx-muted)]" />
            <input
              name="q"
              defaultValue={query}
              placeholder={`Search ${store.name}`}
              className="w-full bg-transparent text-sm text-[var(--lx-text)] outline-none placeholder:text-[var(--lx-muted)]"
            />
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            <Button type="submit" className="h-8 shrink-0 rounded-full bg-[var(--lx-text)] px-3.5 text-xs font-semibold text-[var(--lx-bg)]">Search</Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "newest", label: "Newest" },
              { value: "popular", label: "Popular" },
              { value: "price-asc", label: "Price ↑" },
              { value: "price-desc", label: "Price ↓" },
              { value: "rating", label: "Rated" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`/stores/${store.slug}?${new URLSearchParams({ ...(query ? { q: query } : {}), sort: option.value }).toString()}`}
                className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                  sort === option.value
                    ? "bg-[var(--lx-text)] font-semibold text-[var(--lx-bg)]"
                    : "border border-[var(--lx-border)] text-[var(--lx-muted)] hover:text-[var(--lx-text)]"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              icon={StoreIcon}
              eyebrow={query ? "No matching pieces" : "Collection in preparation"}
              title={query ? `Nothing matches “${query}”` : "This store is still arranging its pieces"}
              description={query ? "Try a shorter search or browse every piece in the store." : "Approved products will appear here as soon as the seller publishes them."}
            >
              <Link href={`/stores/${store.slug}`} className="lx-glass inline-flex h-11 items-center rounded-full px-6 text-sm font-medium text-[var(--lx-text)]">
                View the full store
              </Link>
            </EmptyState>
          </div>
        )}
      </section>

      <section className="lx-container pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Buyer protection", body: "Payment is held by MeCart and released after delivery." },
            { icon: Truck, title: "Seller fulfilment", body: store.shipping_policy || "Tracked dispatch with seller processing windows." },
            { icon: StoreIcon, title: "Returns", body: store.return_policy || "Contact the seller within the marketplace return window." },
          ].map((item) => (
            <div key={item.title} className="lx-card rounded-2xl p-5">
              <item.icon className="h-5 w-5 text-[var(--lx-gold)]" />
              <h3 className="mt-3 text-sm font-semibold text-[var(--lx-text)]">{item.title}</h3>
              <p className="mt-1.5 line-clamp-4 text-xs leading-5 text-[var(--lx-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
