/**
 * Marketplace schema augmentation.
 *
 * `database.gen.ts` is generated from the live Supabase project and owns the
 * physical schema. This module layers the marketplace's friendly row aliases
 * on top of it and keeps the public vendor directory view strongly typed for
 * application code. Regenerate `database.gen.ts` after every migration.
 */
import type { Database as GeneratedDatabase, Json } from "./database.gen";

type GeneratedTables = GeneratedDatabase["public"]["Tables"];
type GeneratedViews = GeneratedDatabase["public"]["Views"];
type GeneratedFunctions = GeneratedDatabase["public"]["Functions"];
type GeneratedEnums = GeneratedDatabase["public"]["Enums"];
type GeneratedRelationships<T extends keyof GeneratedTables> =
  GeneratedTables[T]["Relationships"];

export type VendorStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED"
  | "CLOSED";
export type VendorVerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
export type VendorMemberRole = "OWNER" | "ADMIN" | "MANAGER" | "ANALYST" | "SUPPORT";
export type VendorStoreStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "CLOSED";
export type VendorProductApproval = "PENDING" | "APPROVED" | "REJECTED";
export type VendorFulfillmentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type VendorPayoutStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";
export type VendorReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED"
  | "CLOSED"
  | "CANCELLED";
export type VendorLedgerType =
  | "SALE"
  | "COMMISSION"
  | "REFUND"
  | "ADJUSTMENT"
  | "PAYOUT"
  | "RESERVE_RELEASE";
export type VendorMessageSender = "CUSTOMER" | "VENDOR" | "STAFF" | "SYSTEM";
export type VendorConversationStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type VendorRow = {
  id: string;
  owner_id: string;
  slug: string;
  legal_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  country: string;
  currency: string;
  status: VendorStatus;
  verification_status: VendorVerificationStatus;
  commission_rate: number;
  payout_cycle: string;
  business_type: string | null;
  tax_id: string | null;
  support_email: string | null;
  support_phone: string | null;
  return_policy: string | null;
  shipping_policy: string | null;
  metadata: Json;
  rating: number;
  review_count: number;
  follower_count: number;
  product_count: number;
  total_sales: number;
  approved_at: string | null;
  approved_by: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type StoreRow = {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  status: VendorStoreStatus;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string;
  zip: string | null;
  currency: string;
  brand_primary_color: string;
  brand_accent_color: string;
  theme_mode: "LIGHT" | "DARK" | "SYSTEM";
  social_links: Json;
  return_policy: string | null;
  shipping_policy: string | null;
  privacy_policy: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_featured: boolean;
  rating: number;
  review_count: number;
  follower_count: number;
  product_count: number;
  total_sales: number;
  settings: Json;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type VendorMemberRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  role: VendorMemberRole;
  permissions: string[];
  status: "ACTIVE" | "INVITED" | "SUSPENDED" | "REMOVED";
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorVerificationRow = {
  id: string;
  vendor_id: string;
  status: VendorVerificationStatus;
  contact_name: string | null;
  business_registration_url: string | null;
  tax_document_url: string | null;
  identity_document_url: string | null;
  notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorShippingProfileRow = {
  id: string;
  vendor_id: string;
  name: string;
  is_default: boolean;
  processing_min_days: number;
  processing_max_days: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type VendorShippingRateRow = {
  id: string;
  profile_id: string;
  vendor_id: string;
  name: string;
  countries: string[];
  states: string[];
  min_weight: number | null;
  max_weight: number | null;
  rate: number;
  free_over: number | null;
  min_days: number;
  max_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VendorPayoutAccountRow = {
  id: string;
  vendor_id: string;
  provider: "STRIPE" | "PAYPAL" | "BANK";
  account_name: string;
  account_email: string | null;
  account_last4: string | null;
  bank_name: string | null;
  routing_last4: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "DISABLED";
  is_default: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

export type VendorPayoutRow = {
  id: string;
  vendor_id: string;
  payout_number: string;
  period_start: string;
  period_end: string;
  gross_sales: number;
  refunds: number;
  commissions: number;
  adjustments: number;
  net_amount: number;
  status: VendorPayoutStatus;
  method: string;
  reference: string | null;
  notes: string | null;
  requested_by: string | null;
  reviewed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorLedgerEntryRow = {
  id: string;
  vendor_id: string;
  store_id: string | null;
  order_id: string | null;
  order_item_id: string | null;
  payout_id: string | null;
  type: VendorLedgerType;
  amount: number;
  currency: string;
  description: string | null;
  metadata: Json;
  available_at: string;
  created_at: string;
};

export type VendorOrderAllocationRow = {
  id: string;
  order_id: string;
  vendor_id: string;
  store_id: string | null;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  commission_rate: number;
  commission_amount: number;
  vendor_earnings: number;
  fulfillment_status: VendorFulfillmentStatus;
  tracking_number: string | null;
  carrier: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorReturnRow = {
  id: string;
  rma_number: string;
  order_id: string;
  order_item_id: string | null;
  vendor_id: string;
  store_id: string | null;
  user_id: string | null;
  quantity: number;
  reason: string;
  notes: string | null;
  status: VendorReturnStatus;
  refund_amount: number;
  commission_reversal: number;
  resolution_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  received_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorConversationRow = {
  id: string;
  vendor_id: string;
  store_id: string | null;
  customer_id: string;
  order_id: string | null;
  subject: string;
  status: VendorConversationStatus;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: VendorMessageSender;
  body: string;
  attachments: string[];
  read_at: string | null;
  created_at: string;
};

export type VendorNotificationRow = {
  id: string;
  vendor_id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  data: Json;
  read_at: string | null;
  created_at: string;
};

export type VendorAuditLogRow = {
  id: string;
  vendor_id: string;
  actor_id: string | null;
  action: string;
  resource: string | null;
  metadata: Json;
  created_at: string;
};

export type StoreFollowerRow = {
  id: string;
  store_id: string;
  user_id: string;
  created_at: string;
};

export type PublicVendorProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  country: string;
  rating: number;
  review_count: number;
  product_count: number;
  created_at: string;
};

// Existing tables extended by the marketplace migration.
type ProductMarketRow = {
  vendor_id: string | null;
  store_id: string | null;
  vendor_sku: string | null;
  commission_rate: number | null;
  approval_status: VendorProductApproval;
  approval_notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  shipping_profile_id: string | null;
  marketplace_metadata: Json;
};
type ProductMarketInsert = Partial<ProductMarketRow>;

type OrderItemMarketRow = {
  vendor_id: string | null;
  store_id: string | null;
  vendor_sku: string | null;
  commission_rate: number;
  commission_amount: number;
  vendor_earnings: number;
};
type OrderItemMarketInsert = Partial<OrderItemMarketRow>;

type OrderMarketRow = {
  marketplace_order: boolean;
  vendor_count: number;
};

type CouponMarketRow = {
  vendor_id: string | null;
  store_id: string | null;
};

type ReviewMarketRow = {
  vendor_id: string | null;
  store_id: string | null;
  vendor_reply: string | null;
  vendor_replied_at: string | null;
};

type ExtendedTable<Name extends keyof GeneratedTables, Row, Insert> = {
  Row: GeneratedTables[Name]["Row"] & Row;
  Insert: GeneratedTables[Name]["Insert"] & Insert;
  Update: GeneratedTables[Name]["Update"] & Partial<Row>;
  Relationships: GeneratedRelationships<Name>;
};

export type MarketplaceTables = Omit<
  GeneratedTables,
  "products" | "orders" | "order_items" | "coupons" | "reviews"
> & {
  products: ExtendedTable<"products", ProductMarketRow, ProductMarketInsert>;
  orders: ExtendedTable<"orders", OrderMarketRow, Partial<OrderMarketRow>>;
  order_items: ExtendedTable<"order_items", OrderItemMarketRow, OrderItemMarketInsert>;
  coupons: ExtendedTable<"coupons", CouponMarketRow, Partial<CouponMarketRow>>;
  reviews: ExtendedTable<"reviews", ReviewMarketRow, Partial<ReviewMarketRow>>;
  vendors: TableDef<VendorRow>;
  stores: TableDef<StoreRow>;
  vendor_members: TableDef<VendorMemberRow>;
  vendor_verifications: TableDef<VendorVerificationRow>;
  vendor_shipping_profiles: TableDef<VendorShippingProfileRow>;
  vendor_shipping_rates: TableDef<VendorShippingRateRow>;
  vendor_payout_accounts: TableDef<VendorPayoutAccountRow>;
  vendor_payouts: TableDef<VendorPayoutRow>;
  vendor_ledger_entries: TableDef<VendorLedgerEntryRow>;
  vendor_order_allocations: TableDef<VendorOrderAllocationRow>;
  vendor_returns: TableDef<VendorReturnRow>;
  vendor_conversations: TableDef<VendorConversationRow>;
  vendor_messages: TableDef<VendorMessageRow>;
  vendor_notifications: TableDef<VendorNotificationRow>;
  vendor_audit_logs: TableDef<VendorAuditLogRow>;
  store_followers: TableDef<StoreFollowerRow>;
};

type MarketplaceFunctions = GeneratedFunctions & {
  create_vendor_application: { Args: { payload: Json }; Returns: Json };
  request_vendor_payout: { Args: { p_vendor_id: string }; Returns: Json };
  process_vendor_payout: {
    Args: {
      p_payout_id: string;
      p_status: VendorPayoutStatus;
      p_reference?: string | null;
      p_notes?: string | null;
    };
    Returns: undefined;
  };
  process_vendor_return: {
    Args: {
      p_return_id: string;
      p_status: VendorReturnStatus;
      p_refund_amount?: number | null;
      p_notes?: string | null;
    };
    Returns: undefined;
  };
  log_vendor_audit: {
    Args: {
      p_vendor_id: string;
      p_action: string;
      p_resource?: string | null;
      p_metadata?: Json;
    };
    Returns: undefined;
  };
  is_vendor_member: { Args: { p_vendor_id: string }; Returns: boolean };
  is_vendor_admin: { Args: { p_vendor_id: string }; Returns: boolean };
  has_vendor_permission: {
    Args: { p_vendor_id: string; p_permission: string };
    Returns: boolean;
  };
  can_access_vendor_order: { Args: { p_order_id: string }; Returns: boolean };
  can_access_vendor_conversation: { Args: { p_conversation_id: string }; Returns: boolean };
  marketplace_commission_for: {
    Args: { p_vendor_id: string; p_explicit?: number | null };
    Returns: number;
  };
};

type MarketplaceEnums = GeneratedEnums & {
  vendor_status: VendorStatus;
  vendor_verification_status: VendorVerificationStatus;
  vendor_member_role: VendorMemberRole;
  vendor_store_status: VendorStoreStatus;
  vendor_product_approval: VendorProductApproval;
  vendor_fulfillment_status: VendorFulfillmentStatus;
  vendor_payout_status: VendorPayoutStatus;
  vendor_return_status: VendorReturnStatus;
  vendor_ledger_type: VendorLedgerType;
  vendor_message_sender: VendorMessageSender;
  vendor_conversation_status: VendorConversationStatus;
};

type MarketplaceViews = GeneratedViews & {
  public_vendor_profiles: {
    Row: PublicVendorProfileRow;
    Relationships: [];
  };
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables" | "Views" | "Functions" | "Enums"> & {
    Tables: MarketplaceTables;
    Views: MarketplaceViews;
    Functions: MarketplaceFunctions;
    Enums: MarketplaceEnums;
    CompositeTypes: GeneratedDatabase["public"]["CompositeTypes"];
  };
};
