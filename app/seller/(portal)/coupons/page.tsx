import { Tag } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerCoupons } from "@/lib/repositories/seller";
import { money, dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader } from "@/components/seller/ui";
import { SellerCouponForm, SellerCouponToggle } from "@/components/seller/coupon-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons | MeCart Seller" };

export default async function SellerCouponsPage() {
  const context = await requireSellerContext();
  const coupons = await listSellerCoupons(context.vendor.id);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Growth"
        title="Coupons"
        description="Seller-funded offers scoped to your catalogue. Codes cannot be used against another vendor's items."
        actions={<SellerCouponForm />}
      />

      {coupons.length === 0 ? (
        <SellerEmpty title="No coupons yet" description="Create a welcome offer or a seasonal code for your store." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {coupons.map((coupon) => (
            <SellerCard key={coupon.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <Tag className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono text-sm font-bold tracking-[0.12em] text-white">{coupon.code}</p>
                    <p className="mt-1 text-xs text-slate-500">{coupon.description || "Seller offer"}</p>
                  </div>
                </div>
                <SellerCouponToggle couponId={coupon.id} active={coupon.active} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4 text-xs">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">Discount</p>
                  <p className="mt-1 font-semibold text-[#E6C768]">
                    {coupon.discount_percent ? `${coupon.discount_percent}%` : coupon.discount_amount ? money(coupon.discount_amount) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">Used</p>
                  <p className="mt-1 text-slate-300">{coupon.usageCount}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-600">Expires</p>
                  <p className="mt-1 text-slate-300">{coupon.expires_at ? dateLabel(coupon.expires_at) : "No end date"}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <SellerBadge tone={coupon.active ? "success" : "neutral"}>{coupon.active ? "Live" : "Paused"}</SellerBadge>
                {coupon.min_order_value ? <span className="text-[10px] text-slate-600">Min. {money(coupon.min_order_value)}</span> : null}
              </div>
            </SellerCard>
          ))}
        </div>
      )}
    </div>
  );
}
