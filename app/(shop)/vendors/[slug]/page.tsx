import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Globe2, Star, Store as StoreIcon } from "lucide-react";
import { Breadcrumbs, EmptyState, SectionTitle } from "@/components/shop/storefront-ui";
import { StoreCard } from "@/components/marketplace/store-card";
import { ProductCard } from "@/components/shop/product-card";
import { getPublicVendor } from "@/lib/repositories/marketplace";
import { listProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicVendor(slug);
  if (!data) return { title: "Seller not found | MeCart" };
  return {
    title: `${data.vendor.display_name} | MeCart Marketplace`,
    description: data.vendor.description || `Discover stores and pieces from ${data.vendor.display_name} on MeCart.`,
    openGraph: {
      title: data.vendor.display_name,
      description: data.vendor.description || undefined,
      images: data.vendor.banner_url ? [{ url: data.vendor.banner_url }] : data.vendor.logo_url ? [{ url: data.vendor.logo_url }] : undefined,
    },
  };
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicVendor(slug);
  if (!data) notFound();
  const { vendor, stores } = data;
  const products = await listProducts({ vendorId: vendor.id, limit: 8, sort: "popular" });

  return (
    <div className="lx-page">
      <div className="lx-container py-8 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Stores", href: "/stores" },
            { label: vendor.display_name },
          ]}
        />
      </div>

      <section className="lx-container">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--lx-border)] bg-[var(--lx-surface)]">
          <div className="relative h-48 overflow-hidden sm:h-64">
            {vendor.banner_url ? (
              <Image src={vendor.banner_url} alt="" fill priority className="object-cover" sizes="100vw" />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_15%_15%,rgba(216,180,90,0.25),transparent_55%),linear-gradient(135deg,#12151f,#07090f)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/25 to-transparent" />
          </div>
          <div className="px-5 pb-8 sm:px-8 lg:px-10">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border-2 border-[#07090f] bg-[#0b0e16] text-2xl font-bold text-[var(--lx-gold)] shadow-2xl">
                  {vendor.logo_url ? (
                    <Image src={vendor.logo_url} alt={`${vendor.display_name} logo`} width={96} height={96} className="h-full w-full object-cover" />
                  ) : vendor.display_name.charAt(0)}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-3xl">{vendor.display_name}</h1>
                    <BadgeCheck className="h-5 w-5 text-[var(--lx-cyan)]" aria-label="Verified seller" />
                  </div>
                  <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--lx-muted)]">
                    <Globe2 className="h-3.5 w-3.5" /> {vendor.country}
                    <span className="text-[var(--lx-faint)]">·</span>
                    {vendor.product_count.toLocaleString("en-US")} pieces
                    {vendor.review_count > 0 && (
                      <>
                        <span className="text-[var(--lx-faint)]">·</span>
                        <span className="flex items-center gap-1 text-[var(--lx-gold)]"><Star className="h-3.5 w-3.5 fill-current" /> {Number(vendor.rating).toFixed(1)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Link href="/stores" className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-[var(--lx-text)]">
                Browse all sellers <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--lx-muted)]">
              {vendor.description || "An independent MeCart marketplace seller."}
            </p>
          </div>
        </div>
      </section>

      <section className="lx-container py-12 sm:py-16">
        <SectionTitle
          eyebrow="Storefronts"
          title={<>Shops by <span className="lx-serif text-[var(--lx-gold)]">{vendor.display_name}</span></>}
          aside={<p className="max-w-sm text-sm leading-6 text-[var(--lx-muted)]">One seller can operate several distinct stores, each with its own identity and policies.</p>}
        />
        {stores.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => <StoreCard key={store.id} store={store} />)}
          </div>
        ) : (
          <div className="mt-7">
            <EmptyState icon={StoreIcon} eyebrow="No live stores" title="This seller is preparing a storefront" description="Check back soon for the first collection." />
          </div>
        )}
      </section>

      {products.length > 0 && (
        <section className="lx-container pb-16">
          <SectionTitle eyebrow="Selected pieces" title="From across the seller's stores" aside={<Link href="/products" className="text-sm text-[var(--lx-muted)] hover:text-[var(--lx-text)]">All products</Link>} />
          <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}
    </div>
  );
}
