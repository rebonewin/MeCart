/**
 * MeCart database types.
 *
 * `./database.gen.ts` is generated from the live Supabase project
 * (project ref: bckhzvxwjksyvhejreww) and is the source of truth.
 * Regenerate after any migration with:
 *
 *   npx supabase gen types typescript --project-id bckhzvxwjksyvhejreww > types/database.gen.ts
 *
 * This module re-exports those types together with the friendly Row/Enum
 * aliases used across the app.
 */

import type { Database as GeneratedDatabase } from "./database.gen";

export type { Json } from "./database.gen";

export type Database = GeneratedDatabase;

type PublicSchema = Database["public"];
type Tables = PublicSchema["Tables"];
type Enums = PublicSchema["Enums"];

// --- enums ------------------------------------------------------------------
export type AppRole = Enums["app_role"];
export type ProductStatus = Enums["product_status"];
export type OrderStatus = Enums["order_status"];
export type PaymentStatus = Enums["payment_status"];
export type PaymentMethod = Enums["payment_method"];
export type AuditStatus = Enums["audit_status"];
export type ReviewStatus = Enums["review_status"];
export type CartStatus = Enums["cart_status"];
export type CmsStatus = Enums["cms_status"];
export type NotificationType = Enums["notification_type"];
export type TxnType = Enums["txn_type"];

// --- rows -------------------------------------------------------------------
export type ProfileRow = Tables["profiles"]["Row"];
export type RoleRow = Tables["roles"]["Row"];
export type PermissionRow = Tables["permissions"]["Row"];
export type RolePermissionRow = Tables["role_permissions"]["Row"];

export type AdminRow = Tables["admins"]["Row"];
export type CustomerRow = Tables["customers"]["Row"];

export type CategoryRow = Tables["categories"]["Row"];
export type SubCategoryRow = Tables["sub_categories"]["Row"];
export type BrandRow = Tables["brands"]["Row"];

export type ProductRow = Tables["products"]["Row"];
export type ProductImageRow = Tables["product_images"]["Row"];
export type ProductVariantRow = Tables["product_variants"]["Row"];

export type InventoryRow = Tables["inventory"]["Row"];
export type InventoryLogRow = Tables["inventory_logs"]["Row"];

export type AddressRow = Tables["addresses"]["Row"];

export type CartRow = Tables["carts"]["Row"];
export type CartItemRow = Tables["cart_items"]["Row"];
export type WishlistRow = Tables["wishlists"]["Row"];

export type CouponRow = Tables["coupons"]["Row"];
export type CouponUsageRow = Tables["coupon_usage"]["Row"];

export type OrderRow = Tables["orders"]["Row"];
export type OrderItemRow = Tables["order_items"]["Row"];

export type PaymentRow = Tables["payments"]["Row"];
export type TransactionRow = Tables["transactions"]["Row"];

export type ReviewRow = Tables["reviews"]["Row"];
export type NotificationRow = Tables["notifications"]["Row"];

export type ActivityLogRow = Tables["activity_logs"]["Row"];
export type AuditLogRow = Tables["audit_logs"]["Row"];

export type MediaLibraryRow = Tables["media_library"]["Row"];
export type CmsPageRow = Tables["cms_pages"]["Row"];

export type SeoRow = Tables["seo"]["Row"];
export type AnalyticsEventRow = Tables["analytics_events"]["Row"];

export type ShippingZoneRow = Tables["shipping_zones"]["Row"];
export type ShippingMethodRow = Tables["shipping_methods"]["Row"];
export type TaxRuleRow = Tables["tax_rules"]["Row"];

export type SettingRow = Tables["settings"]["Row"];
export type ThemeSettingRow = Tables["theme_settings"]["Row"];
