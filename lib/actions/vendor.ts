"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSellerContext, SELLER_VENDOR_COOKIE } from "@/lib/marketplace/context";
import { VENDOR_PERMISSIONS } from "@/lib/marketplace/permissions";
import { logAudit } from "@/lib/security/audit";
import type { Json } from "@/types/database";

const onboardingSchema = z.object({
  displayName: z.string().min(2, "Business name is required").max(120),
  legalName: z.string().max(160).optional().or(z.literal("")),
  email: z.string().email("A valid business email is required"),
  phone: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  country: z.string().min(2).max(2).default("US"),
  businessType: z.string().max(80).optional().or(z.literal("")),
  taxId: z.string().max(80).optional().or(z.literal("")),
  contactName: z.string().max(120).optional().or(z.literal("")),
  storeName: z.string().min(2, "Store name is required").max(120),
  storeTagline: z.string().max(160).optional().or(z.literal("")),
  storeDescription: z.string().max(4000).optional().or(z.literal("")),
  returnPolicy: z.string().max(4000).optional().or(z.literal("")),
  shippingPolicy: z.string().max(4000).optional().or(z.literal("")),
});

export type VendorApplicationInput = z.input<typeof onboardingSchema>;

export async function createVendorApplication(input: VendorApplicationInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please sign in to apply");
  const values = onboardingSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_vendor_application", {
    payload: {
      display_name: values.displayName,
      legal_name: values.legalName || values.displayName,
      email: values.email,
      phone: values.phone || null,
      description: values.description || null,
      country: values.country,
      business_type: values.businessType || null,
      tax_id: values.taxId || null,
      contact_name: values.contactName || null,
      store_name: values.storeName,
      store_slug: values.storeName,
      store_tagline: values.storeTagline || null,
      store_description: values.storeDescription || null,
      return_policy: values.returnPolicy || null,
      shipping_policy: values.shippingPolicy || null,
    } as Json,
  });

  if (error) throw new Error(error.message);
  const result = data as unknown as { vendor_id: string; store_id: string; created: boolean };

  await logAudit({
    action: "VENDOR_APPLICATION_SUBMITTED",
    resource: `Vendor:${result.vendor_id}`,
    newValue: values.displayName,
  });

  revalidatePath("/seller");
  revalidatePath("/admin/marketplace/vendors");
  return { vendorId: result.vendor_id, storeId: result.store_id, created: result.created };
}

const vendorProfileSchema = z.object({
  displayName: z.string().min(2).max(120),
  legalName: z.string().min(2).max(160),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(4000).optional().or(z.literal("")),
  country: z.string().min(2).max(2),
  supportEmail: z.string().email().optional().or(z.literal("")),
  supportPhone: z.string().max(40).optional().or(z.literal("")),
  returnPolicy: z.string().max(6000).optional().or(z.literal("")),
  shippingPolicy: z.string().max(6000).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateVendorProfile(input: z.input<typeof vendorProfileSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.settingsManage)) throw new Error("Permission denied");
  const values = vendorProfileSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("vendors")
    .update({
      display_name: values.displayName,
      legal_name: values.legalName,
      email: values.email,
      phone: values.phone || null,
      description: values.description || null,
      country: values.country,
      support_email: values.supportEmail || null,
      support_phone: values.supportPhone || null,
      return_policy: values.returnPolicy || null,
      shipping_policy: values.shippingPolicy || null,
      logo_url: values.logoUrl || null,
      banner_url: values.bannerUrl || null,
    })
    .eq("id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "VENDOR_PROFILE_UPDATED",
    p_resource: context.vendor.id,
    p_metadata: { displayName: values.displayName } as Json,
  });

  revalidatePath("/seller/settings");
  revalidatePath("/stores");
  return { ok: true };
}

const storeSchema = z.object({
  name: z.string().min(2).max(120),
  tagline: z.string().max(160).optional().or(z.literal("")),
  description: z.string().max(6000).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  country: z.string().min(2).max(2),
  zip: z.string().max(20).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  brandPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4f46e5"),
  brandAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#D4AF37"),
  returnPolicy: z.string().max(6000).optional().or(z.literal("")),
  shippingPolicy: z.string().max(6000).optional().or(z.literal("")),
  seoTitle: z.string().max(180).optional().or(z.literal("")),
  seoDescription: z.string().max(320).optional().or(z.literal("")),
});

export async function updateStoreProfile(storeId: string, input: z.input<typeof storeSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.storesManage)) throw new Error("Permission denied");
  if (!context.stores.some((store) => store.id === storeId)) throw new Error("Store not found");
  const values = storeSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("stores")
    .update({
      name: values.name,
      tagline: values.tagline || null,
      description: values.description || null,
      email: values.email || null,
      phone: values.phone || null,
      city: values.city || null,
      state: values.state || null,
      country: values.country,
      zip: values.zip || null,
      logo_url: values.logoUrl || null,
      banner_url: values.bannerUrl || null,
      brand_primary_color: values.brandPrimaryColor,
      brand_accent_color: values.brandAccentColor,
      return_policy: values.returnPolicy || null,
      shipping_policy: values.shippingPolicy || null,
      seo_title: values.seoTitle || null,
      seo_description: values.seoDescription || null,
    })
    .eq("id", storeId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);

  await supabase.rpc("log_vendor_audit", {
    p_vendor_id: context.vendor.id,
    p_action: "STORE_UPDATED",
    p_resource: storeId,
    p_metadata: { name: values.name } as Json,
  });

  revalidatePath("/seller/stores");
  revalidatePath("/seller/settings");
  revalidatePath(`/stores`);
  return { ok: true };
}

export async function createStore(input: z.input<typeof storeSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.storesManage)) throw new Error("Permission denied");
  const values = storeSchema.parse(input);
  const supabase = await createClient();
  const slugBase = values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = `${slugBase || "store"}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("stores")
    .insert({
      vendor_id: context.vendor.id,
      name: values.name,
      slug,
      tagline: values.tagline || null,
      description: values.description || null,
      email: values.email || context.vendor.email,
      country: values.country,
      status: "DRAFT",
      logo_url: values.logoUrl || null,
      banner_url: values.bannerUrl || null,
      brand_primary_color: values.brandPrimaryColor,
      brand_accent_color: values.brandAccentColor,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/seller/stores");
  return { storeId: data.id };
}

const memberSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["ADMIN", "MANAGER", "ANALYST", "SUPPORT"]),
});

export async function inviteVendorMember(input: z.input<typeof memberSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.membersManage)) throw new Error("Only owners and admins can manage the team");
  const values = memberSchema.parse(input);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", values.email.toLowerCase())
    .maybeSingle();
  if (!profile) throw new Error("That person needs a MeCart account before they can be added");

  const { error } = await supabase.from("vendor_members").insert({
    vendor_id: context.vendor.id,
    user_id: profile.id,
    role: values.role,
    permissions: [],
    status: "ACTIVE",
    invited_by: context.user.id,
    joined_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  await supabase.from("vendor_notifications").insert({
    vendor_id: context.vendor.id,
    user_id: profile.id,
    type: "TEAM",
    title: "Added to a seller workspace",
    body: `${context.vendor.display_name} added you as ${values.role.toLowerCase()}.`,
    link: "/seller",
    data: { role: values.role } as Json,
  });
  revalidatePath("/seller/settings");
  return { ok: true };
}

const memberRoleSchema = z.enum(["OWNER", "ADMIN", "MANAGER", "ANALYST", "SUPPORT"]);

export async function updateVendorMemberRole(memberId: string, role: z.input<typeof memberRoleSchema>) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.membersManage)) throw new Error("Permission denied");
  const nextRole = memberRoleSchema.parse(role);
  if (context.membership.role !== "OWNER" && nextRole === "OWNER") {
    throw new Error("Only an owner can appoint another owner");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_members")
    .update({ role: nextRole })
    .eq("id", memberId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/settings");
  return { ok: true };
}

export async function removeVendorMember(memberId: string) {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(VENDOR_PERMISSIONS.membersManage)) throw new Error("Permission denied");
  if (memberId === context.membership.id) throw new Error("You cannot remove your own membership");
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_members")
    .update({ status: "REMOVED" })
    .eq("id", memberId)
    .eq("vendor_id", context.vendor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/seller/settings");
  return { ok: true };
}

export async function switchVendor(vendorId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_members")
    .select("vendor_id")
    .eq("user_id", user.id)
    .eq("vendor_id", vendorId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!data) throw new Error("Vendor membership not found");

  const store = await cookies();
  store.set(SELLER_VENDOR_COOKIE, vendorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/seller");
  return { ok: true };
}
