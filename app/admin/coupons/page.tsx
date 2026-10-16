import { CouponManager } from "@/components/admin/coupon-manager";
import { listCoupons } from "@/lib/repositories/coupons";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>
      <CouponManager
        initial={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          discountPercent: c.discount_percent,
          discountAmount: c.discount_amount,
          active: c.active,
        }))}
      />
    </div>
  );
}
