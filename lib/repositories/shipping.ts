import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList } from "@/lib/repositories/utils";
import type { ShippingMethodRow, ShippingZoneRow, TaxRuleRow } from "@/types/database";

export async function listShippingMethods(): Promise<ShippingMethodRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase.from("shipping_methods").select("*").eq("is_active", true).order("rate"),
  );
}

export async function listShippingZones(): Promise<ShippingZoneRow[]> {
  const supabase = await createClient();
  return unwrapList(await supabase.from("shipping_zones").select("*").order("name"));
}

export async function listTaxRules(): Promise<TaxRuleRow[]> {
  const supabase = await createClient();
  return unwrapList(await supabase.from("tax_rules").select("*").eq("is_active", true));
}

export async function getDefaultTaxRate(): Promise<number> {
  const rules = await listTaxRules();
  if (!rules.length) return 0.08;
  const global = rules.find((r) => !r.country && !r.state);
  return toNumber((global ?? rules[0]).rate);
}

export async function getDefaultShippingCost(subtotal: number): Promise<number> {
  const methods = await listShippingMethods();
  const standard = methods[0];
  if (!standard) return subtotal > 0 ? 49 : 0;
  if (standard.free_over !== null && subtotal >= toNumber(standard.free_over)) return 0;
  return subtotal > 0 ? toNumber(standard.rate) : 0;
}
