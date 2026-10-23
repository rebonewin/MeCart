import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import type { StoreRow, VendorMemberRow, VendorRow } from "@/types/database";
import {
  hasVendorPermission,
  VENDOR_PERMISSIONS,
  type VendorPermission,
} from "@/lib/marketplace/permissions";

export const SELLER_VENDOR_COOKIE = "mecart-seller-vendor";

export type SellerContext = {
  user: SessionUser;
  vendor: VendorRow;
  membership: VendorMemberRow;
  stores: StoreRow[];
  can: (permission: VendorPermission | string) => boolean;
};

export async function getSellerContext(): Promise<SellerContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("vendor_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE");

  if (error || !memberships?.length) return null;

  const vendorIds = memberships.map((membership) => membership.vendor_id);
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .in("id", vendorIds)
    .is("deleted_at", null);

  if (!vendors?.length) return null;

  const cookieStore = await cookies();
  const selectedVendor = cookieStore.get(SELLER_VENDOR_COOKIE)?.value;
  const vendor =
    vendors.find((item) => item.id === selectedVendor) ??
    vendors.find((item) => item.id === memberships[0].vendor_id) ??
    vendors[0];
  const membership =
    memberships.find((item) => item.vendor_id === vendor.id) ?? memberships[0];

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("vendor_id", vendor.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return {
    user,
    vendor,
    membership,
    stores: stores ?? [],
    can: (permission) =>
      hasVendorPermission(membership.role, membership.permissions, permission),
  };
}

export async function requireSellerContext(
  permission: VendorPermission | string = VENDOR_PERMISSIONS.dashboardRead,
): Promise<SellerContext> {
  const context = await getSellerContext();
  if (!context) throw new Error("Seller access required");
  if (!context.can(permission)) throw new Error("You do not have permission for this action");
  return context;
}

export function isVendorLive(vendor: VendorRow): boolean {
  return vendor.status === "APPROVED";
}

export function sellerHomeForVendor(vendorId: string): string {
  return `/seller?vendor=${vendorId}`;
}
