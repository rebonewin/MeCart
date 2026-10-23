"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/security/audit";
import type {
  Json,
  VendorPayoutStatus,
  VendorProductApproval,
  VendorReturnStatus,
  VendorStoreStatus,
  VendorVerificationStatus,
} from "@/types/database";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "UNDER_REVIEW"]),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export async function reviewVendor(vendorId: string, input: z.input<typeof decisionSchema>) {
  const staff = await requireStaff();
  const values = decisionSchema.parse(input);
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, display_name, status")
    .eq("id", vendorId)
    .maybeSingle();
  if (!vendor) throw new Error("Vendor not found");

  const status =
    values.decision === "APPROVED"
      ? "APPROVED"
      : values.decision === "REJECTED"
        ? "REJECTED"
        : values.decision === "SUSPENDED"
          ? "SUSPENDED"
          : "UNDER_REVIEW";
  const verification: VendorVerificationStatus =
    values.decision === "APPROVED"
      ? "VERIFIED"
      : values.decision === "REJECTED"
        ? "REJECTED"
        : "PENDING";

  const { error } = await supabase
    .from("vendors")
    .update({
      status,
      verification_status: verification,
      approved_at: values.decision === "APPROVED" ? new Date().toISOString() : null,
      approved_by: values.decision === "APPROVED" ? staff.id : null,
      suspended_at: values.decision === "SUSPENDED" ? new Date().toISOString() : null,
      suspension_reason: values.decision === "SUSPENDED" ? values.notes || "Policy review" : null,
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);

  if (values.decision === "APPROVED") {
    await supabase
      .from("stores")
      .update({ status: "ACTIVE", approved_at: new Date().toISOString(), approved_by: staff.id })
      .eq("vendor_id", vendorId)
      .in("status", ["PENDING_REVIEW", "DRAFT"]);
  }
  if (values.decision === "SUSPENDED") {
    await supabase
      .from("stores")
      .update({ status: "SUSPENDED" })
      .eq("vendor_id", vendorId)
      .eq("status", "ACTIVE");
  }

  await supabase
    .from("vendor_verifications")
    .update({
      status: verification,
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: values.decision === "REJECTED" ? values.notes || "Application rejected" : null,
      notes: values.notes || null,
    })
    .eq("vendor_id", vendorId);

  await supabase.from("vendor_notifications").insert({
    vendor_id: vendorId,
    type: "SYSTEM",
    title:
      values.decision === "APPROVED"
        ? "Marketplace approved"
        : values.decision === "REJECTED"
          ? "Application update"
          : "Account under review",
    body:
      values.decision === "APPROVED"
        ? "Your seller account and stores are now live. Products still require catalogue review."
        : values.notes || "Your marketplace account status has changed.",
    link: "/seller",
    data: { decision: values.decision } as Json,
  });

  await logAudit({
    action: `VENDOR_${values.decision}`,
    resource: `Vendor:${vendorId}`,
    oldValue: vendor.status,
    newValue: status,
  });

  revalidatePath("/admin/marketplace");
  revalidatePath("/admin/marketplace/vendors");
  revalidatePath(`/admin/marketplace/vendors/${vendorId}`);
  revalidatePath("/stores");
  return { ok: true };
}

export async function moderateVendorProduct(
  productId: string,
  approvalStatus: VendorProductApproval,
  notes?: string,
) {
  const staff = await requireStaff();
  if (!["PENDING", "APPROVED", "REJECTED"].includes(approvalStatus)) {
    throw new Error("Invalid approval status");
  }
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, vendor_id, approval_status")
    .eq("id", productId)
    .not("vendor_id", "is", null)
    .maybeSingle();
  if (!product) throw new Error("Marketplace product not found");

  const approved = approvalStatus === "APPROVED";
  const { error } = await supabase
    .from("products")
    .update({
      approval_status: approvalStatus,
      approval_notes: notes || null,
      status: approved ? "ACTIVE" : approvalStatus === "REJECTED" ? "HIDDEN" : "DRAFT",
      approved_at: approved ? new Date().toISOString() : null,
      approved_by: approved ? staff.id : null,
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  if (product.vendor_id) {
    await supabase.from("vendor_notifications").insert({
      vendor_id: product.vendor_id,
      type: "SYSTEM",
      title: approved ? "Product approved" : "Product needs attention",
      body: approved
        ? `${product.name} is now live in the marketplace.`
        : notes || `${product.name} was not approved in its current form.`,
      link: `/seller/products/${productId}/edit`,
      data: { product_id: productId, approval_status: approvalStatus } as Json,
    });
  }

  await logAudit({
    action: `PRODUCT_${approvalStatus}`,
    resource: `Product:${productId}`,
    oldValue: product.approval_status,
    newValue: approvalStatus,
  });

  revalidatePath("/admin/marketplace/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function moderateVendorStore(storeId: string, status: VendorStoreStatus) {
  const staff = await requireStaff();
  if (!["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "CLOSED"].includes(status)) {
    throw new Error("Invalid store status");
  }
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, vendor_id, status")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) throw new Error("Store not found");

  const { error } = await supabase
    .from("stores")
    .update({
      status,
      approved_at: status === "ACTIVE" ? new Date().toISOString() : null,
      approved_by: status === "ACTIVE" ? staff.id : null,
    })
    .eq("id", storeId);
  if (error) throw new Error(error.message);

  await supabase.from("vendor_notifications").insert({
    vendor_id: store.vendor_id,
    type: "SYSTEM",
    title: status === "ACTIVE" ? "Store approved" : "Store status updated",
    body: `${store.name} is now ${status.toLowerCase().replace("_", " ")}.`,
    link: "/seller/stores",
    data: { store_id: storeId, status } as Json,
  });

  await logAudit({
    action: `STORE_${status}`,
    resource: `Store:${storeId}`,
    oldValue: store.status,
    newValue: status,
  });
  revalidatePath("/admin/marketplace/stores");
  revalidatePath("/seller/stores");
  revalidatePath("/stores");
  return { ok: true };
}

export async function setVendorCommission(vendorId: string, rate: number) {
  await requireStaff();
  if (!Number.isFinite(rate) || rate < 0 || rate > 50) {
    throw new Error("Commission must be between 0 and 50 percent");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({ commission_rate: rate })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "VENDOR_COMMISSION_UPDATED",
    resource: `Vendor:${vendorId}`,
    newValue: `${rate}%`,
  });
  revalidatePath("/admin/marketplace/vendors");
  revalidatePath(`/admin/marketplace/vendors/${vendorId}`);
  return { ok: true };
}

export async function processVendorPayout(
  payoutId: string,
  status: VendorPayoutStatus,
  reference?: string,
  notes?: string,
) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("process_vendor_payout", {
    p_payout_id: payoutId,
    p_status: status,
    p_reference: reference ?? undefined,
    p_notes: notes ?? undefined,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketplace/payouts");
  revalidatePath("/seller/finance");
  return { ok: true };
}

export async function resolveVendorReturn(
  returnId: string,
  status: VendorReturnStatus,
  refundAmount?: number,
  notes?: string,
) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("process_vendor_return", {
    p_return_id: returnId,
    p_status: status,
    p_refund_amount: refundAmount ?? undefined,
    p_notes: notes ?? undefined,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketplace/returns");
  revalidatePath("/seller/returns");
  return { ok: true };
}

export async function markVendorNotificationRead(vendorId: string, notificationId: string) {
  await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("vendor_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("vendor_id", vendorId)
    .eq("id", notificationId);
  return { ok: true };
}

export async function assignProductOwnership(
  productId: string,
  input: {
    vendorId: string | null;
    storeId: string | null;
    commissionRate: number | null;
    vendorSku?: string | null;
  },
) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, vendor_id, store_id, commission_rate")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!product) throw new Error("Product not found");

  let storeId = input.storeId || null;
  if (storeId && !input.vendorId) throw new Error("Choose a vendor before a store");
  if (storeId && input.vendorId) {
    const { data: store } = await supabase
      .from("stores")
      .select("id, vendor_id")
      .eq("id", storeId)
      .maybeSingle();
    if (!store || store.vendor_id !== input.vendorId) throw new Error("Store does not belong to that vendor");
  }
  if (!input.vendorId) storeId = null;
  if (input.commissionRate !== null && (input.commissionRate < 0 || input.commissionRate > 50)) {
    throw new Error("Commission must be between 0 and 50 percent");
  }

  const { error } = await supabase
    .from("products")
    .update({
      vendor_id: input.vendorId,
      store_id: storeId,
      vendor_sku: input.vendorId ? input.vendorSku?.trim() || null : null,
      commission_rate: input.vendorId ? input.commissionRate : null,
      approval_status: "APPROVED",
      approved_at: new Date().toISOString(),
      approved_by: staff.id,
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  if (input.vendorId) {
    await supabase.from("vendor_notifications").insert({
      vendor_id: input.vendorId,
      type: "SYSTEM",
      title: "Product ownership assigned",
      body: `${product.name} is now owned by your vendor account.`,
      link: `/seller/products/${productId}/edit`,
      data: { product_id: productId } as Json,
    });
  }

  await logAudit({
    action: "PRODUCT_OWNERSHIP_UPDATED",
    resource: `Product:${productId}`,
    oldValue: `${product.vendor_id ?? "platform"}/${product.store_id ?? "none"}`,
    newValue: `${input.vendorId ?? "platform"}/${storeId ?? "none"}`,
  });
  revalidatePath("/admin/marketplace/ownership");
  revalidatePath("/admin/marketplace/products");
  revalidatePath("/seller/products");
  revalidatePath("/products");
  return { ok: true };
}
