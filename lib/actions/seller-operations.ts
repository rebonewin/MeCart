"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext } from "@/lib/marketplace/context";
import { VENDOR_PERMISSIONS } from "@/lib/marketplace/permissions";
import type {
  Json,
  VendorFulfillmentStatus,
  VendorReturnStatus,
} from "@/types/database";

const fulfillmentSchema = z.object({
  status: z.enum([
    "PENDING",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
  ]),
  carrier: z.string().max(80).optional().or(z.literal("")),
  trackingNumber: z.string().max(120).optional().or(z.literal("")),
  trackingUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateSellerFulfillment(
  allocationId: string,
  input: z.input<typeof fulfillmentSchema>,
) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.ordersManage)) throw new Error("Permission denied");
  const values = fulfillmentSchema.parse(input);
  const supabase = await createClient();

  const { data: allocation } = await supabase
    .from("vendor_order_allocations")
    .select("*")
    .eq("id", allocationId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!allocation) throw new Error("Order allocation not found");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("vendor_order_allocations")
    .update({
      fulfillment_status: values.status as VendorFulfillmentStatus,
      carrier: values.carrier || null,
      tracking_number: values.trackingNumber || null,
      tracking_url: values.trackingUrl || null,
      shipped_at: ["SHIPPED", "DELIVERED"].includes(values.status) ? allocation.shipped_at ?? now : allocation.shipped_at,
      delivered_at: values.status === "DELIVERED" ? allocation.delivered_at ?? now : allocation.delivered_at,
      cancelled_at: values.status === "CANCELLED" ? now : allocation.cancelled_at,
    })
    .eq("id", allocationId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "FULFILLMENT_UPDATED",
    p_resource: allocation.order_id,
    p_metadata: { status: values.status, tracking: values.trackingNumber } as Json,
  });

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${allocation.order_id}`);
  return { ok: true };
}

export async function replyToSellerReview(reviewId: string, reply: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.reviewsManage)) throw new Error("Permission denied");
  const clean = reply.trim();
  if (clean.length < 2 || clean.length > 4000) throw new Error("Reply must be 2–4000 characters");
  const supabase = await createClient();

  const { error } = await supabase
    .from("reviews")
    .update({ vendor_reply: clean, vendor_replied_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  revalidatePath("/seller/reviews");
  return { ok: true };
}

const couponSchema = z.object({
  code: z.string().min(3).max(32),
  description: z.string().max(300).optional().or(z.literal("")),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional().or(z.literal("")),
});

export async function createSellerCoupon(input: z.input<typeof couponSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.couponsManage)) throw new Error("Permission denied");
  const values = couponSchema.parse(input);
  if (!values.discountPercent && !values.discountAmount) {
    throw new Error("Set a percentage or fixed discount");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    vendor_id: context.vendor.id,
    store_id: context.stores[0]?.id ?? null,
    code: values.code.toUpperCase().replace(/\s+/g, ""),
    description: values.description || null,
    discount_percent: values.discountPercent || null,
    discount_amount: values.discountAmount || null,
    min_order_value: values.minOrderValue || null,
    max_discount: values.maxDiscount || null,
    usage_limit: values.usageLimit || null,
    expires_at: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/coupons");
  return { ok: true };
}

export async function toggleSellerCoupon(couponId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.couponsManage)) throw new Error("Permission denied");
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("active")
    .eq("id", couponId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!data) throw new Error("Coupon not found");
  const { error } = await supabase
    .from("coupons")
    .update({ active: !data.active })
    .eq("id", couponId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/coupons");
  return { ok: true };
}

export async function sendSellerMessage(conversationId: string, body: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.messagesManage)) throw new Error("Permission denied");
  const clean = body.trim();
  if (!clean || clean.length > 10000) throw new Error("Message is required");

  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("vendor_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!conversation) throw new Error("Conversation not found");

  const { error } = await supabase.from("vendor_messages").insert({
    conversation_id: conversationId,
    sender_id: context.user.id,
    sender_type: "VENDOR",
    body: clean,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/seller/messages");
  revalidatePath(`/seller/messages/${conversationId}`);
  return { ok: true };
}

export async function markSellerMessagesRead(conversationId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.messagesManage)) throw new Error("Permission denied");
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("vendor_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!conversation) throw new Error("Conversation not found");

  await supabase
    .from("vendor_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_type", "CUSTOMER")
    .is("read_at", null);
  return { ok: true };
}

export async function updateConversationStatus(
  conversationId: string,
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED",
) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.messagesManage)) throw new Error("Permission denied");
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_conversations")
    .update({ status })
    .eq("id", conversationId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/messages");
  revalidatePath(`/seller/messages/${conversationId}`);
  return { ok: true };
}

export async function processSellerReturn(
  returnId: string,
  status: VendorReturnStatus,
  refundAmount?: number,
  notes?: string,
) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.returnsManage)) throw new Error("Permission denied");

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("vendor_returns")
    .select("id")
    .eq("id", returnId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!request) throw new Error("Return not found");

  const { error } = await supabase.rpc("process_vendor_return", {
    p_return_id: returnId,
    p_status: status,
    p_refund_amount: refundAmount ?? undefined,
    p_notes: notes ?? undefined,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/returns");
  return { ok: true };
}

export async function requestSellerPayout() {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.payoutsManage)) throw new Error("Permission denied");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_vendor_payout", {
    p_vendor_id: context.vendor.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/finance");
  revalidatePath("/admin/marketplace/payouts");
  return data as unknown as { payout_id: string; payout_number: string; net_amount: number };
}

export async function savePayoutAccount(input: {
  provider: "STRIPE" | "PAYPAL" | "BANK";
  accountName: string;
  accountEmail?: string;
  accountLast4?: string;
  bankName?: string;
  makeDefault?: boolean;
}) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.payoutsManage)) throw new Error("Permission denied");
  const supabase = await createClient();

  if (input.makeDefault) {
    await supabase
      .from("vendor_payout_accounts")
      .update({ is_default: false })
      .eq("vendor_id", context.vendor.id);
  }

  const { error } = await supabase.from("vendor_payout_accounts").insert({
    vendor_id: context.vendor.id,
    provider: input.provider,
    account_name: input.accountName,
    account_email: input.accountEmail || null,
    account_last4: input.accountLast4?.slice(-4) || null,
    bank_name: input.bankName || null,
    is_default: input.makeDefault ?? true,
    status: "PENDING",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/finance");
  return { ok: true };
}

export async function createSellerShippingProfile(input: {
  name: string;
  processingMinDays: number;
  processingMaxDays: number;
  makeDefault?: boolean;
}) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.shippingManage)) throw new Error("Permission denied");
  const supabase = await createClient();

  if (input.makeDefault) {
    await supabase
      .from("vendor_shipping_profiles")
      .update({ is_default: false })
      .eq("vendor_id", context.vendor.id);
  }

  const { error } = await supabase.from("vendor_shipping_profiles").insert({
    vendor_id: context.vendor.id,
    name: input.name,
    processing_min_days: input.processingMinDays,
    processing_max_days: input.processingMaxDays,
    is_default: input.makeDefault ?? false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/shipping");
  return { ok: true };
}

export async function addSellerShippingRate(input: {
  profileId: string;
  name: string;
  countries: string[];
  rate: number;
  freeOver?: number;
  minDays: number;
  maxDays: number;
}) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.shippingManage)) throw new Error("Permission denied");
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("vendor_shipping_profiles")
    .select("id")
    .eq("id", input.profileId)
    .eq("vendor_id", context.vendor.id)
    .maybeSingle();
  if (!profile) throw new Error("Shipping profile not found");

  const { error } = await supabase.from("vendor_shipping_rates").insert({
    profile_id: input.profileId,
    vendor_id: context.vendor.id,
    name: input.name,
    countries: input.countries,
    rate: input.rate,
    free_over: input.freeOver ?? null,
    min_days: input.minDays,
    max_days: input.maxDays,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seller/shipping");
  return { ok: true };
}

export async function markSellerNotificationRead(notificationId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/notifications");
  revalidatePath("/seller");
  return { ok: true };
}
