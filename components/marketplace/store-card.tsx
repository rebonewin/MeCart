import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Star } from "lucide-react";
import type { PublicStore } from "@/lib/repositories/marketplace";

export function StoreCard({ store }: { store: PublicStore }) {
  return (
    <article className="lx-card group relative overflow-hidden rounded-[1.75rem]">
      <div className="relative h-40 overflow-hidden bg-[var(--lx-surface-2)]">
        {store.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.banner_url} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${store.brand_primary_color}, #10131c 70%)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-[#101116]/20 to-transparent" />
        {store.is_featured && (
          <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
            Featured
          </span>
        )}
        <div className="absolute -bottom-6 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#101116] bg-[#1A1D24] text-lg font-bold text-[#D4AF37]">
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
          ) : store.name.charAt(0)}
        </div>
      </div>
      <div className="p-5 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/stores/${store.slug}`} className="flex items-center gap-1.5 truncate text-base font-semibold text-[var(--lx-text)] transition hover:text-[var(--lx-gold)]">
              {store.name}
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--lx-cyan)]" aria-hidden />
            </Link>
            <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-[var(--lx-muted)]">
              by {store.vendorName}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--lx-gold)]">
            <Star className="h-3.5 w-3.5 fill-current" /> {store.rating ? Number(store.rating).toFixed(1) : "New"}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--lx-muted)]">
          {store.tagline || store.description || "A new marketplace storefront."}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--lx-border)] pt-3 text-[10px] text-[var(--lx-muted)]">
          <span>{store.product_count} pieces · {store.follower_count} followers</span>
          <Link href={`/stores/${store.slug}`} className="inline-flex items-center gap-1 font-semibold text-[var(--lx-text)] hover:text-[var(--lx-gold)]">
            Visit <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
