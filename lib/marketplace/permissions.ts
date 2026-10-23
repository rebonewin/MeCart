export const VENDOR_PERMISSIONS = {
  dashboardRead: "dashboard.read",
  productsRead: "products.read",
  productsManage: "products.manage",
  inventoryManage: "inventory.manage",
  ordersRead: "orders.read",
  ordersManage: "orders.manage",
  returnsManage: "returns.manage",
  shippingManage: "shipping.manage",
  couponsManage: "coupons.manage",
  reviewsManage: "reviews.manage",
  messagesManage: "messages.manage",
  analyticsRead: "analytics.read",
  customersRead: "customers.read",
  storesManage: "stores.manage",
  settingsManage: "settings.manage",
  membersManage: "members.manage",
  payoutsManage: "payouts.manage",
  financeRead: "finance.read",
} as const;

export type VendorPermission = (typeof VENDOR_PERMISSIONS)[keyof typeof VENDOR_PERMISSIONS];

const MANAGER_PERMISSIONS: VendorPermission[] = [
  VENDOR_PERMISSIONS.dashboardRead,
  VENDOR_PERMISSIONS.productsRead,
  VENDOR_PERMISSIONS.productsManage,
  VENDOR_PERMISSIONS.inventoryManage,
  VENDOR_PERMISSIONS.ordersRead,
  VENDOR_PERMISSIONS.ordersManage,
  VENDOR_PERMISSIONS.returnsManage,
  VENDOR_PERMISSIONS.shippingManage,
  VENDOR_PERMISSIONS.couponsManage,
  VENDOR_PERMISSIONS.reviewsManage,
  VENDOR_PERMISSIONS.messagesManage,
  VENDOR_PERMISSIONS.analyticsRead,
  VENDOR_PERMISSIONS.customersRead,
];

const SUPPORT_PERMISSIONS: VendorPermission[] = [
  VENDOR_PERMISSIONS.dashboardRead,
  VENDOR_PERMISSIONS.ordersRead,
  VENDOR_PERMISSIONS.returnsManage,
  VENDOR_PERMISSIONS.messagesManage,
  VENDOR_PERMISSIONS.reviewsManage,
  VENDOR_PERMISSIONS.customersRead,
];

const ANALYST_PERMISSIONS: VendorPermission[] = [
  VENDOR_PERMISSIONS.dashboardRead,
  VENDOR_PERMISSIONS.analyticsRead,
  VENDOR_PERMISSIONS.ordersRead,
  VENDOR_PERMISSIONS.productsRead,
  VENDOR_PERMISSIONS.financeRead,
];

export function hasVendorPermission(
  role: string | null | undefined,
  permissions: string[] | null | undefined,
  permission: VendorPermission | string,
): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  if (permissions?.includes("*") || permissions?.includes(permission)) return true;
  if (role === "MANAGER") return MANAGER_PERMISSIONS.includes(permission as VendorPermission);
  if (role === "SUPPORT") return SUPPORT_PERMISSIONS.includes(permission as VendorPermission);
  if (role === "ANALYST") return ANALYST_PERMISSIONS.includes(permission as VendorPermission);
  return false;
}

/** Passive permission list used to render the seller navigation. */
export function vendorPermissionList(role: string, permissions: string[]): VendorPermission[] {
  return (Object.values(VENDOR_PERMISSIONS) as VendorPermission[]).filter((permission) =>
    hasVendorPermission(role, permissions, permission),
  );
}
