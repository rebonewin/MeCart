import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AiOrderSummary } from "@/lib/ai/types";

export type AiCommerceContext = {
  recentOrders: AiOrderSummary[];
};

const EMPTY_CONTEXT: AiCommerceContext = { recentOrders: [] };

function normalizeStatus(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

/**
 * Server-owned commerce context for the assistant.
 *
 * Client-supplied cart, wishlist and browsing data is useful but not
 * authoritative. Order summaries must be loaded here, scoped by the
 * authenticated user, so a crafted request can never reveal another account's
 * order. Only the minimum fields the model needs are selected; addresses,
 * payment credentials and line-item details stay out of the prompt.
 *
 * The shape is deliberately small so a future implementation can add
 * server-side wishlist preferences, loyalty signals or a RAG retrieval layer
 * without changing the chat route contract.
 */
export async function loadCommerceContext(
  userId: string | null | undefined,
): Promise<AiCommerceContext> {
  if (!userId) return EMPTY_CONTEXT;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "order_number, status, payment_status, grand_total, updated_at",
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error || !data?.length) return EMPTY_CONTEXT;

    return {
      recentOrders: data.map((order) => ({
        orderNumber: order.order_number,
        status: normalizeStatus(order.status),
        paymentStatus: normalizeStatus(order.payment_status),
        total: Number(order.grand_total),
        updatedAt: order.updated_at,
      })),
    };
  } catch {
    // A commerce-context failure must never break the conversation. MECO can
    // still answer from the catalogue and the client shopping context.
    return EMPTY_CONTEXT;
  }
}
