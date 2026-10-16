import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { CouponRow } from "@/types/database";

export type CouponWithUsage = CouponRow & { usageCount: number };

export async function listCoupons(): Promise<CouponWithUsage[]> {
  const supabase = await createClient();
  const coupons = unwrapList(
    await supabase
      .from("coupons")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );

  const { data: usage } = await supabase.from("coupon_usage").select("coupon_id");
  const usageMap = new Map<string, number>();
  for (const row of usage ?? []) {
    usageMap.set(row.coupon_id, (usageMap.get(row.coupon_id) ?? 0) + 1);
  }

  return coupons.map((c) => ({ ...c, usageCount: usageMap.get(c.id) ?? c.used_count }));
}

export async function createCoupon(input: {
  code: string;
  description?: string | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  minOrderValue?: number | null;
  usageLimit?: number | null;
  expiresAt?: string | null;
}) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase.from("coupons").insert({
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      discount_percent: input.discountPercent ?? null,
      discount_amount: input.discountAmount ?? null,
      min_order_value: input.minOrderValue ?? null,
      usage_limit: input.usageLimit ?? null,
      expires_at: input.expiresAt ?? null,
    }),
  );
}

export async function toggleCoupon(id: string) {
  const supabase = await createClient();
  const { data: coupon } = await supabase.from("coupons").select("active").eq("id", id).maybeSingle();
  if (!coupon) throw new Error("Not found");
  unwrapVoid(await supabase.from("coupons").update({ active: !coupon.active }).eq("id", id));
}

export async function deleteCoupon(id: string) {
  const supabase = await createClient();
  unwrapVoid(
    await supabase
      .from("coupons")
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq("id", id),
  );
}

export type CouponValidation = { code: string; discount: number; couponId: string };

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_coupon_code", {
    p_code: code,
    p_subtotal: subtotal,
  });
  if (error) throw new Error(error.message);
  const result = data as unknown as { coupon_id: string; code: string; discount: number };
  return { code: result.code, couponId: result.coupon_id, discount: toNumber(result.discount) };
}
