import Link from "next/link";
import { BadgeCheck, ArrowUpRight, Star } from "lucide-react";
import type { PublicVendorProfileRow } from "@/types/database";

export function VendorCard({ vendor }: { vendor: PublicVendorProfileRow }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="lx-card group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)] text-lg font-semibold text-[var(--lx-gold)]">
        {vendor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          vendor.display_name.charAt(0)
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-[var(--lx-text)]">{vendor.display_name}</p>
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--lx-cyan)]" aria-hidden />
        </div>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--lx-muted)]">
          {vendor.description || `${vendor.product_count} pieces · ${vendor.country}`}
        </p>
        <p className="mt-1 flex items-center gap-2 text-[10px] text-[var(--lx-faint)]">
          {vendor.product_count} pieces
          {vendor.review_count > 0 && (
            <span className="flex items-center gap-0.5 text-[var(--lx-gold)]"><Star className="h-2.5 w-2.5 fill-current" /> {Number(vendor.rating).toFixed(1)}</span>
          )}
        </p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--lx-faint)] transition group-hover:text-[var(--lx-gold)]" />
    </Link>
  );
}
