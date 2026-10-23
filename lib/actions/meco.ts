"use server";

import { auth } from "@/lib/auth";
import { toNumber } from "@/lib/repositories/utils";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/types/database";

export type MecoOrderLookup =
  | {
      ok: true;
      order: {
        id: string;
        orderNumber: string;
        status: OrderStatus;
        paymentStatus: PaymentStatus;
        total: number;
        createdAt: string;
        updatedAt: string;
      };
    }
  | { ok: false; reason: "auth" | "invalid" | "not_found" | "unavailable" };

/**
 * Customer-scoped order lookup for the MECO assistant. It never returns another
 * account's order and never exposes payment credentials or a shipping address.
 */
export async function lookupMyOrder(orderNumber: string): Promise<MecoOrderLookup> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, reason: "auth" };

  const clean = orderNumber.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{4,40}$/.test(clean)) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, grand_total, created_at, updated_at")
      .eq("user_id", session.user.id)
      .eq("order_number", clean)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) return { ok: false, reason: "unavailable" };
    if (!data) return { ok: false, reason: "not_found" };

    return {
      ok: true,
      order: {
        id: data.id,
        orderNumber: data.order_number,
        status: data.status,
        paymentStatus: data.payment_status,
        total: toNumber(data.grand_total),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
