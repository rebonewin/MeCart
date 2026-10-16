import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { AddressRow } from "@/types/database";

export type AddressInput = {
  label?: string | null;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
};

export async function listAddresses(userId: string): Promise<AddressRow[]> {
  const supabase = await createClient();
  return unwrapList(
    await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  );
}

export async function createAddress(userId: string, input: AddressInput) {
  const supabase = await createClient();

  if (input.isDefault) {
    unwrapVoid(await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId));
  }

  unwrapVoid(
    await supabase.from("addresses").insert({
      user_id: userId,
      label: input.label || null,
      name: input.name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      zip: input.zip,
      country: input.country,
      is_default: input.isDefault ?? false,
    }),
  );
}

export async function updateAddress(userId: string, id: string, input: AddressInput) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) throw new Error("Not found");

  if (input.isDefault) {
    unwrapVoid(await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId));
  }

  unwrapVoid(
    await supabase
      .from("addresses")
      .update({
        label: input.label || null,
        name: input.name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        zip: input.zip,
        country: input.country,
        is_default: input.isDefault ?? false,
      })
      .eq("id", id),
  );
}

export async function deleteAddress(userId: string, id: string) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("addresses").delete().eq("id", id).eq("user_id", userId));
}
