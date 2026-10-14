import { prisma } from "@/lib/prisma";
import { CouponManager } from "@/components/admin/coupon-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>
      <CouponManager initial={coupons} />
    </div>
  );
}
