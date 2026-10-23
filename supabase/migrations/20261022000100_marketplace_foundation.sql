-- ============================================================================
-- MeCart Marketplace Foundation
-- Multi-vendor ownership, stores, commissions, payouts, shipping, returns,
-- buyer/seller messaging, audit trails and row-level isolation.
--
-- Design notes
--   * Existing Supabase Auth remains the identity source. Vendor membership is
--     layered over profiles/auth.users; existing admin/manager/customer roles
--     and all current commerce flows are preserved.
--   * A vendor can own many stores. Products may be platform-owned (vendor_id
--     null) or vendor-owned. Existing products remain platform-owned.
--   * Financial data is snapshotted onto order_items at purchase time. The
--     ledger is append-only and payout allocation is atomic.
-- ============================================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'vendor_status') then
    create type public.vendor_status as enum
      ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'SUSPENDED', 'REJECTED', 'CLOSED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_verification_status') then
    create type public.vendor_verification_status as enum
      ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_member_role') then
    create type public.vendor_member_role as enum
      ('OWNER', 'ADMIN', 'MANAGER', 'ANALYST', 'SUPPORT');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_store_status') then
    create type public.vendor_store_status as enum
      ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'CLOSED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_product_approval') then
    create type public.vendor_product_approval as enum
      ('PENDING', 'APPROVED', 'REJECTED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_fulfillment_status') then
    create type public.vendor_fulfillment_status as enum
      ('PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_payout_status') then
    create type public.vendor_payout_status as enum
      ('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_return_status') then
    create type public.vendor_return_status as enum
      ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CLOSED', 'CANCELLED');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_ledger_type') then
    create type public.vendor_ledger_type as enum
      ('SALE', 'COMMISSION', 'REFUND', 'ADJUSTMENT', 'PAYOUT', 'RESERVE_RELEASE');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_message_sender') then
    create type public.vendor_message_sender as enum
      ('CUSTOMER', 'VENDOR', 'STAFF', 'SYSTEM');
  end if;

  if not exists (select 1 from pg_type where typname = 'vendor_conversation_status') then
    create type public.vendor_conversation_status as enum
      ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create table if not exists public.vendors (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles (id) on delete restrict,
  slug                text not null unique,
  legal_name          text not null,
  display_name        text not null,
  email               text not null,
  phone               text,
  description         text,
  logo_url            text,
  banner_url          text,
  country             text not null default 'US',
  currency            text not null default 'USD',
  status              public.vendor_status not null default 'PENDING',
  verification_status public.vendor_verification_status not null default 'UNVERIFIED',
  commission_rate     numeric(5,2) not null default 10 check (commission_rate >= 0 and commission_rate <= 50),
  payout_cycle        text not null default 'WEEKLY' check (payout_cycle in ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY')),
  business_type       text,
  tax_id              text,
  support_email       text,
  support_phone       text,
  return_policy       text,
  shipping_policy     text,
  metadata            jsonb not null default '{}'::jsonb,
  rating              numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count        integer not null default 0 check (review_count >= 0),
  follower_count      integer not null default 0 check (follower_count >= 0),
  product_count       integer not null default 0 check (product_count >= 0),
  total_sales         numeric(14,2) not null default 0 check (total_sales >= 0),
  approved_at         timestamptz,
  approved_by         uuid references public.profiles (id) on delete set null,
  suspended_at        timestamptz,
  suspension_reason   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index if not exists vendors_owner_idx on public.vendors (owner_id) where deleted_at is null;
create index if not exists vendors_status_idx on public.vendors (status, created_at desc) where deleted_at is null;
create index if not exists vendors_slug_idx on public.vendors (slug) where deleted_at is null;
create index if not exists vendors_name_trgm_idx on public.vendors using gin (display_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Stores (many per vendor)
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id                   uuid primary key default gen_random_uuid(),
  vendor_id            uuid not null references public.vendors (id) on delete cascade,
  name                 text not null,
  slug                 text not null unique,
  tagline              text,
  description          text,
  logo_url             text,
  banner_url           text,
  status               public.vendor_store_status not null default 'DRAFT',
  email                text,
  phone                text,
  address_line1        text,
  city                 text,
  state                text,
  country              text not null default 'US',
  zip                  text,
  currency             text not null default 'USD',
  brand_primary_color  text not null default '#4f46e5',
  brand_accent_color   text not null default '#f0c46c',
  theme_mode           text not null default 'LIGHT' check (theme_mode in ('LIGHT', 'DARK', 'SYSTEM')),
  social_links         jsonb not null default '{}'::jsonb,
  return_policy        text,
  shipping_policy      text,
  privacy_policy       text,
  seo_title            text,
  seo_description      text,
  is_featured          boolean not null default false,
  rating               numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count         integer not null default 0 check (review_count >= 0),
  follower_count       integer not null default 0 check (follower_count >= 0),
  product_count        integer not null default 0 check (product_count >= 0),
  total_sales          numeric(14,2) not null default 0 check (total_sales >= 0),
  settings             jsonb not null default '{}'::jsonb,
  approved_at          timestamptz,
  approved_by          uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);
create index if not exists stores_vendor_idx on public.stores (vendor_id, status) where deleted_at is null;
create index if not exists stores_status_idx on public.stores (status, is_featured desc, created_at desc) where deleted_at is null;
create index if not exists stores_slug_idx on public.stores (slug) where deleted_at is null;
create index if not exists stores_name_trgm_idx on public.stores using gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Vendor team and verification
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_members (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.vendor_member_role not null default 'MANAGER',
  permissions text[] not null default '{}',
  status      text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'SUSPENDED', 'REMOVED')),
  invited_by  uuid references public.profiles (id) on delete set null,
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (vendor_id, user_id)
);
create index if not exists vendor_members_user_idx on public.vendor_members (user_id, status);
create index if not exists vendor_members_vendor_idx on public.vendor_members (vendor_id, role);

create table if not exists public.vendor_verifications (
  id                        uuid primary key default gen_random_uuid(),
  vendor_id                 uuid not null references public.vendors (id) on delete cascade,
  status                    public.vendor_verification_status not null default 'PENDING',
  contact_name              text,
  business_registration_url text,
  tax_document_url          text,
  identity_document_url     text,
  notes                     text,
  rejection_reason          text,
  reviewed_by               uuid references public.profiles (id) on delete set null,
  reviewed_at               timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index if not exists vendor_verifications_vendor_idx on public.vendor_verifications (vendor_id, created_at desc);
create index if not exists vendor_verifications_status_idx on public.vendor_verifications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Shipping profiles owned by vendors
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_shipping_profiles (
  id                   uuid primary key default gen_random_uuid(),
  vendor_id            uuid not null references public.vendors (id) on delete cascade,
  name                 text not null,
  is_default           boolean not null default false,
  processing_min_days  integer not null default 1 check (processing_min_days >= 0),
  processing_max_days  integer not null default 3 check (processing_max_days >= processing_min_days),
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index if not exists vendor_shipping_profiles_default_idx
  on public.vendor_shipping_profiles (vendor_id) where is_default;
create index if not exists vendor_shipping_profiles_vendor_idx on public.vendor_shipping_profiles (vendor_id);

create table if not exists public.vendor_shipping_rates (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.vendor_shipping_profiles (id) on delete cascade,
  vendor_id    uuid not null references public.vendors (id) on delete cascade,
  name         text not null,
  countries    text[] not null default '{}',
  states       text[] not null default '{}',
  min_weight   numeric(10,3) check (min_weight is null or min_weight >= 0),
  max_weight   numeric(10,3) check (max_weight is null or max_weight >= 0),
  rate         numeric(12,2) not null default 0 check (rate >= 0),
  free_over    numeric(12,2) check (free_over is null or free_over >= 0),
  min_days     integer not null default 3 check (min_days >= 0),
  max_days     integer not null default 7 check (max_days >= min_days),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists vendor_shipping_rates_profile_idx on public.vendor_shipping_rates (profile_id, is_active);
create index if not exists vendor_shipping_rates_vendor_idx on public.vendor_shipping_rates (vendor_id);

-- ---------------------------------------------------------------------------
-- Payout accounts, payout requests and append-only ledger
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_payout_accounts (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors (id) on delete cascade,
  provider       text not null check (provider in ('STRIPE', 'PAYPAL', 'BANK')),
  account_name   text not null,
  account_email  text,
  account_last4  text,
  bank_name      text,
  routing_last4  text,
  status         text not null default 'PENDING' check (status in ('PENDING', 'VERIFIED', 'REJECTED', 'DISABLED')),
  is_default     boolean not null default false,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists vendor_payout_accounts_default_idx
  on public.vendor_payout_accounts (vendor_id) where is_default;
create index if not exists vendor_payout_accounts_vendor_idx on public.vendor_payout_accounts (vendor_id);

create table if not exists public.vendor_payouts (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null references public.vendors (id) on delete cascade,
  payout_number  text not null unique,
  period_start   timestamptz not null,
  period_end     timestamptz not null,
  gross_sales    numeric(14,2) not null default 0,
  refunds        numeric(14,2) not null default 0,
  commissions    numeric(14,2) not null default 0,
  adjustments    numeric(14,2) not null default 0,
  net_amount     numeric(14,2) not null default 0,
  status         public.vendor_payout_status not null default 'PENDING',
  method         text not null default 'BANK',
  reference      text,
  notes          text,
  requested_by   uuid references public.profiles (id) on delete set null,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  processed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists vendor_payouts_vendor_idx on public.vendor_payouts (vendor_id, created_at desc);
create index if not exists vendor_payouts_status_idx on public.vendor_payouts (status, created_at);

create sequence if not exists public.vendor_payout_number_seq start 10001;

create table if not exists public.vendor_ledger_entries (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid not null references public.vendors (id) on delete cascade,
  store_id      uuid references public.stores (id) on delete set null,
  order_id      uuid references public.orders (id) on delete set null,
  order_item_id uuid references public.order_items (id) on delete set null,
  payout_id     uuid references public.vendor_payouts (id) on delete set null,
  type          public.vendor_ledger_type not null,
  amount        numeric(14,2) not null,
  currency      text not null default 'USD',
  description   text,
  metadata      jsonb not null default '{}'::jsonb,
  available_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists vendor_ledger_vendor_idx on public.vendor_ledger_entries (vendor_id, created_at desc);
create index if not exists vendor_ledger_available_idx on public.vendor_ledger_entries (vendor_id, available_at)
  where payout_id is null;
create index if not exists vendor_ledger_order_idx on public.vendor_ledger_entries (order_id);
create index if not exists vendor_ledger_payout_idx on public.vendor_ledger_entries (payout_id);

-- ---------------------------------------------------------------------------
-- Per-vendor order allocation and fulfillment
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_order_allocations (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  vendor_id         uuid not null references public.vendors (id) on delete cascade,
  store_id          uuid references public.stores (id) on delete set null,
  subtotal          numeric(14,2) not null default 0 check (subtotal >= 0),
  shipping_amount   numeric(14,2) not null default 0 check (shipping_amount >= 0),
  tax_amount        numeric(14,2) not null default 0 check (tax_amount >= 0),
  discount_amount   numeric(14,2) not null default 0 check (discount_amount >= 0),
  commission_rate   numeric(5,2) not null default 10 check (commission_rate >= 0 and commission_rate <= 50),
  commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0),
  vendor_earnings   numeric(14,2) not null default 0,
  fulfillment_status public.vendor_fulfillment_status not null default 'PENDING',
  tracking_number   text,
  carrier           text,
  tracking_url      text,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique nulls not distinct (order_id, vendor_id, store_id)
);
create index if not exists vendor_allocations_vendor_idx
  on public.vendor_order_allocations (vendor_id, created_at desc);
create index if not exists vendor_allocations_vendor_status_idx
  on public.vendor_order_allocations (vendor_id, fulfillment_status, created_at desc);
create index if not exists vendor_allocations_order_idx on public.vendor_order_allocations (order_id);
create index if not exists vendor_allocations_store_idx on public.vendor_order_allocations (store_id);

-- ---------------------------------------------------------------------------
-- Returns / RMA
-- ---------------------------------------------------------------------------
create sequence if not exists public.vendor_return_number_seq start 500001;

create table if not exists public.vendor_returns (
  id                 uuid primary key default gen_random_uuid(),
  rma_number         text not null unique,
  order_id           uuid not null references public.orders (id) on delete cascade,
  order_item_id      uuid references public.order_items (id) on delete set null,
  vendor_id          uuid not null references public.vendors (id) on delete cascade,
  store_id           uuid references public.stores (id) on delete set null,
  user_id            uuid references public.profiles (id) on delete set null,
  quantity           integer not null default 1 check (quantity > 0),
  reason             text not null,
  notes              text,
  status             public.vendor_return_status not null default 'REQUESTED',
  refund_amount      numeric(14,2) not null default 0 check (refund_amount >= 0),
  commission_reversal numeric(14,2) not null default 0 check (commission_reversal >= 0),
  resolution_notes   text,
  requested_at       timestamptz not null default now(),
  reviewed_at        timestamptz,
  received_at        timestamptz,
  refunded_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists vendor_returns_vendor_idx on public.vendor_returns (vendor_id, status, created_at desc);
create index if not exists vendor_returns_order_idx on public.vendor_returns (order_id);
create index if not exists vendor_returns_user_idx on public.vendor_returns (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Buyer <-> seller messaging
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_conversations (
  id                   uuid primary key default gen_random_uuid(),
  vendor_id            uuid not null references public.vendors (id) on delete cascade,
  store_id             uuid references public.stores (id) on delete set null,
  customer_id          uuid not null references public.profiles (id) on delete cascade,
  order_id             uuid references public.orders (id) on delete set null,
  subject              text not null,
  status               public.vendor_conversation_status not null default 'OPEN',
  last_message_at      timestamptz not null default now(),
  last_message_preview text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists vendor_conversations_vendor_idx
  on public.vendor_conversations (vendor_id, last_message_at desc);
create index if not exists vendor_conversations_customer_idx
  on public.vendor_conversations (customer_id, last_message_at desc);
create index if not exists vendor_conversations_order_idx on public.vendor_conversations (order_id);

create table if not exists public.vendor_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.vendor_conversations (id) on delete cascade,
  sender_id       uuid references public.profiles (id) on delete set null,
  sender_type     public.vendor_message_sender not null,
  body            text not null check (length(body) between 1 and 10000),
  attachments     text[] not null default '{}',
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists vendor_messages_conversation_idx on public.vendor_messages (conversation_id, created_at);
create index if not exists vendor_messages_unread_idx on public.vendor_messages (conversation_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Seller notifications and audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.vendor_notifications (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete cascade,
  type       text not null default 'SYSTEM',
  title      text not null,
  body       text,
  link       text,
  data       jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists vendor_notifications_vendor_idx
  on public.vendor_notifications (vendor_id, created_at desc);
create index if not exists vendor_notifications_unread_idx
  on public.vendor_notifications (vendor_id) where read_at is null;

create table if not exists public.vendor_audit_logs (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  resource   text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists vendor_audit_vendor_idx on public.vendor_audit_logs (vendor_id, created_at desc);
create index if not exists vendor_audit_action_idx on public.vendor_audit_logs (action);

-- ---------------------------------------------------------------------------
-- Product ownership extensions (existing products remain platform-owned)
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists vendor_id uuid references public.vendors (id) on delete set null;
alter table public.products add column if not exists store_id uuid references public.stores (id) on delete set null;
alter table public.products add column if not exists vendor_sku text;
alter table public.products add column if not exists commission_rate numeric(5,2)
  check (commission_rate is null or (commission_rate >= 0 and commission_rate <= 50));
alter table public.products add column if not exists approval_status public.vendor_product_approval not null default 'APPROVED';
alter table public.products add column if not exists approval_notes text;
alter table public.products add column if not exists submitted_at timestamptz;
alter table public.products add column if not exists approved_at timestamptz;
alter table public.products add column if not exists approved_by uuid references public.profiles (id) on delete set null;
alter table public.products add column if not exists shipping_profile_id uuid references public.vendor_shipping_profiles (id) on delete set null;
alter table public.products add column if not exists marketplace_metadata jsonb not null default '{}'::jsonb;

create index if not exists products_vendor_idx on public.products (vendor_id, created_at desc) where deleted_at is null;
create index if not exists products_store_idx on public.products (store_id, status, created_at desc) where deleted_at is null;
create index if not exists products_approval_idx on public.products (approval_status, submitted_at) where vendor_id is not null;
create index if not exists products_vendor_status_idx on public.products (vendor_id, status) where deleted_at is null;
create unique index if not exists products_vendor_sku_idx on public.products (vendor_id, vendor_sku)
  where vendor_id is not null and vendor_sku is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- Order / item / coupon / review marketplace extensions
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists marketplace_order boolean not null default false;
alter table public.orders add column if not exists vendor_count integer not null default 0 check (vendor_count >= 0);

alter table public.order_items add column if not exists vendor_id uuid references public.vendors (id) on delete set null;
alter table public.order_items add column if not exists store_id uuid references public.stores (id) on delete set null;
alter table public.order_items add column if not exists vendor_sku text;
alter table public.order_items add column if not exists commission_rate numeric(5,2) not null default 0
  check (commission_rate >= 0 and commission_rate <= 50);
alter table public.order_items add column if not exists commission_amount numeric(14,2) not null default 0 check (commission_amount >= 0);
alter table public.order_items add column if not exists vendor_earnings numeric(14,2) not null default 0;

create index if not exists order_items_vendor_idx on public.order_items (vendor_id, created_at desc);
create index if not exists order_items_store_idx on public.order_items (store_id);

alter table public.coupons add column if not exists vendor_id uuid references public.vendors (id) on delete cascade;
alter table public.coupons add column if not exists store_id uuid references public.stores (id) on delete set null;
create index if not exists coupons_vendor_idx on public.coupons (vendor_id, created_at desc) where deleted_at is null;

alter table public.reviews add column if not exists vendor_id uuid references public.vendors (id) on delete set null;
alter table public.reviews add column if not exists store_id uuid references public.stores (id) on delete set null;
alter table public.reviews add column if not exists vendor_reply text;
alter table public.reviews add column if not exists vendor_replied_at timestamptz;
create index if not exists reviews_vendor_idx on public.reviews (vendor_id, created_at desc);
create index if not exists reviews_store_idx on public.reviews (store_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Store followers
-- ---------------------------------------------------------------------------
create table if not exists public.store_followers (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);
create index if not exists store_followers_store_idx on public.store_followers (store_id, created_at desc);
create index if not exists store_followers_user_idx on public.store_followers (user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_vendor_member(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vendor_members m
    where m.vendor_id = p_vendor_id
      and m.user_id = (select auth.uid())
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.is_vendor_admin(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vendor_members m
    where m.vendor_id = p_vendor_id
      and m.user_id = (select auth.uid())
      and m.status = 'ACTIVE'
      and m.role in ('OWNER', 'ADMIN')
  );
$$;

create or replace function public.has_vendor_permission(p_vendor_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vendor_members m
    where m.vendor_id = p_vendor_id
      and m.user_id = (select auth.uid())
      and m.status = 'ACTIVE'
      and (
        m.role in ('OWNER', 'ADMIN')
        or p_permission = any (m.permissions)
        or (
          m.role = 'MANAGER'
          and p_permission in (
            'products.manage', 'inventory.manage', 'orders.manage',
            'returns.manage', 'shipping.manage', 'coupons.manage',
            'reviews.manage', 'messages.manage', 'analytics.read'
          )
        )
        or (
          m.role = 'SUPPORT'
          and p_permission in ('orders.read', 'returns.manage', 'messages.manage', 'reviews.manage')
        )
        or (
          m.role = 'ANALYST'
          and p_permission in ('analytics.read', 'orders.read', 'products.read')
        )
      )
  );
$$;

create or replace function public.can_access_vendor_order(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff() or exists (
    select 1
    from public.vendor_order_allocations a
    where a.order_id = p_order_id
      and public.is_vendor_member(a.vendor_id)
  );
$$;

create or replace function public.can_access_vendor_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff() or exists (
    select 1
    from public.vendor_conversations c
    where c.id = p_conversation_id
      and (c.customer_id = (select auth.uid()) or public.is_vendor_member(c.vendor_id))
  );
$$;

create or replace function public.marketplace_commission_for(p_vendor_id uuid, p_explicit numeric default null)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p_explicit,
    (select v.commission_rate from public.vendors v where v.id = p_vendor_id),
    (select nullif(value->>'rate', '')::numeric from public.settings where key = 'marketplace.default_commission'),
    10
  );
$$;

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------
create or replace function public.marketplace_slugify(p_value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.enforce_product_vendor_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_vendor uuid;
begin
  if new.vendor_id is not null then
    if new.commission_rate is null then
      new.commission_rate := public.marketplace_commission_for(new.vendor_id, null);
    end if;

    if new.store_id is not null then
      select vendor_id into v_store_vendor from public.stores where id = new.store_id;
      if v_store_vendor is null then
        raise exception 'Store not found';
      end if;
      if v_store_vendor <> new.vendor_id then
        raise exception 'Store does not belong to vendor';
      end if;
    end if;
  else
    new.store_id := null;
    new.vendor_sku := null;
    new.approval_status := 'APPROVED';
  end if;

  if new.vendor_id is not null then
    -- Seller-created products always enter the moderation queue. Staff may
    -- create/approve directly. This also overrides the table default APPROVED.
    if not public.is_staff() then
      if tg_op = 'INSERT' then
        new.approval_status := 'PENDING';
        new.approved_at := null;
        new.approved_by := null;
        new.submitted_at := coalesce(new.submitted_at, now());
      elsif new.approval_status is distinct from old.approval_status
         or new.approved_at is distinct from old.approved_at
         or new.approved_by is distinct from old.approved_by then
        raise exception 'Product approval is managed by marketplace staff';
      end if;
    end if;
    new.marketplace_metadata := coalesce(new.marketplace_metadata, '{}'::jsonb);
  end if;

  return new;
end $$;

create or replace function public.protect_product_marketplace_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.commission_rate is distinct from old.commission_rate
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by then
      raise exception 'Product financial and approval fields are managed by marketplace staff';
    end if;
  end if;

  return new;
end $$;

create or replace function public.sync_store_product_counters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.store_id is not null then
    update public.stores
      set product_count = (
        select count(*) from public.products
        where store_id = old.store_id and deleted_at is null and status = 'ACTIVE'
      )
      where id = old.store_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.store_id is not null and
     (tg_op = 'INSERT' or new.store_id <> old.store_id or new.status <> old.status or
      new.deleted_at is distinct from old.deleted_at) then
    update public.stores
      set product_count = (
        select count(*) from public.products
        where store_id = new.store_id and deleted_at is null and status = 'ACTIVE'
      )
      where id = new.store_id;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.vendor_id is not null then
    update public.vendors
      set product_count = (
        select count(*) from public.products
        where vendor_id = old.vendor_id and deleted_at is null and status = 'ACTIVE'
      )
      where id = old.vendor_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.vendor_id is not null and
     (tg_op = 'INSERT' or new.vendor_id <> old.vendor_id or new.status <> old.status or
      new.deleted_at is distinct from old.deleted_at) then
    update public.vendors
      set product_count = (
        select count(*) from public.products
        where vendor_id = new.vendor_id and deleted_at is null and status = 'ACTIVE'
      )
      where id = new.vendor_id;
  end if;

  return coalesce(new, old);
end $$;

create or replace function public.set_review_marketplace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    select vendor_id, store_id into new.vendor_id, new.store_id
    from public.products where id = new.product_id;
  end if;
  return new;
end $$;

create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor uuid := coalesce(new.vendor_id, old.vendor_id);
  v_store uuid := coalesce(new.store_id, old.store_id);
  v_rating numeric(3,2);
  v_count integer;
begin
  if v_vendor is not null then
    select coalesce(round(avg(rating)::numeric, 2), 0), count(*)
      into v_rating, v_count
      from public.reviews
      where vendor_id = v_vendor and status = 'APPROVED';
    update public.vendors set rating = v_rating, review_count = v_count where id = v_vendor;
  end if;

  if v_store is not null then
    select coalesce(round(avg(rating)::numeric, 2), 0), count(*)
      into v_rating, v_count
      from public.reviews
      where store_id = v_store and status = 'APPROVED';
    update public.stores set rating = v_rating, review_count = v_count where id = v_store;
  end if;

  return coalesce(new, old);
end $$;

create or replace function public.snapshot_order_item_marketplace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_vendor uuid;
  v_product_store uuid;
  v_product_sku text;
  v_product_commission numeric(5,2);
  v_rate numeric(5,2);
begin
  select p.vendor_id, p.store_id, coalesce(p.vendor_sku, p.sku), p.commission_rate
    into v_product_vendor, v_product_store, v_product_sku, v_product_commission
  from public.products p
  where p.id = new.product_id;

  new.vendor_id := coalesce(new.vendor_id, v_product_vendor);
  new.store_id := coalesce(new.store_id, v_product_store);
  new.vendor_sku := coalesce(new.vendor_sku, v_product_sku);

  if new.vendor_id is not null then
    -- order_items.commission_rate defaults to 0; only an explicit positive
    -- override should win over the product/vendor rate snapshot.
    v_rate := case
      when new.commission_rate > 0 then new.commission_rate
      else public.marketplace_commission_for(new.vendor_id, v_product_commission)
    end;
    new.commission_rate := v_rate;
    new.commission_amount := round(new.total * v_rate / 100, 2);
    new.vendor_earnings := round(new.total - new.commission_amount, 2);
  else
    new.commission_rate := 0;
    new.commission_amount := 0;
    new.vendor_earnings := 0;
  end if;

  return new;
end $$;

create or replace function public.allocate_vendor_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_count integer;
begin
  if new.vendor_id is null then
    return new;
  end if;

  insert into public.vendor_order_allocations (
    order_id, vendor_id, store_id, subtotal, commission_rate,
    commission_amount, vendor_earnings
  ) values (
    new.order_id, new.vendor_id, new.store_id, new.total, new.commission_rate,
    new.commission_amount, new.vendor_earnings
  )
  on conflict (order_id, vendor_id, store_id) do update set
    subtotal = public.vendor_order_allocations.subtotal + excluded.subtotal,
    commission_amount = public.vendor_order_allocations.commission_amount + excluded.commission_amount,
    vendor_earnings = public.vendor_order_allocations.vendor_earnings + excluded.vendor_earnings,
    commission_rate = excluded.commission_rate,
    updated_at = now();

  update public.orders
    set marketplace_order = true,
        vendor_count = (
          select count(distinct vendor_id)
          from public.order_items
          where order_id = new.order_id and vendor_id is not null
        )
    where id = new.order_id;

  -- Orders paid at checkout are inserted as PAID before their items exist, so
  -- the payment-status trigger cannot see them. Account for those items here.
  if exists (
    select 1 from public.orders
    where id = new.order_id and payment_status = 'PAID'
  ) then
    update public.vendors
      set total_sales = total_sales + new.total
      where id = new.vendor_id;
    if new.store_id is not null then
      update public.stores
        set total_sales = total_sales + new.total
        where id = new.store_id;
    end if;
  end if;

  insert into public.vendor_ledger_entries (
    vendor_id, store_id, order_id, order_item_id, type, amount,
    description, available_at, metadata
  ) values
    (
      new.vendor_id, new.store_id, new.order_id, new.id, 'SALE', new.total,
      'Marketplace sale', now() + interval '7 days',
      jsonb_build_object('order_id', new.order_id, 'quantity', new.quantity)
    ),
    (
      new.vendor_id, new.store_id, new.order_id, new.id, 'COMMISSION', -new.commission_amount,
      'Marketplace commission', now() + interval '7 days',
      jsonb_build_object('rate', new.commission_rate)
    );

  insert into public.vendor_notifications (vendor_id, type, title, body, link, data)
  values (
    new.vendor_id,
    'ORDER',
    'New marketplace order',
    new.name || ' x' || new.quantity || ' was purchased.',
    '/seller/orders/' || new.order_id,
    jsonb_build_object('order_id', new.order_id, 'order_item_id', new.id)
  );

  return new;
end $$;

create or replace function public.sync_marketplace_order_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'PAID' and old.payment_status is distinct from 'PAID' and new.marketplace_order then
    update public.vendors v
      set total_sales = v.total_sales + coalesce(a.subtotal, 0)
      from (
        select vendor_id, sum(subtotal) as subtotal
        from public.vendor_order_allocations
        where order_id = new.id
        group by vendor_id
      ) a
      where a.vendor_id = v.id;

    update public.stores s
      set total_sales = s.total_sales + coalesce(a.subtotal, 0)
      from (
        select store_id, sum(subtotal) as subtotal
        from public.vendor_order_allocations
        where order_id = new.id and store_id is not null
        group by store_id
      ) a
      where a.store_id = s.id;

    update public.vendor_ledger_entries
      set available_at = now() + interval '7 days'
      where order_id = new.id and type in ('SALE', 'COMMISSION') and payout_id is null;
  end if;
  return new;
end $$;

create or replace function public.generate_vendor_rma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rma_number is null or new.rma_number = '' then
    new.rma_number := 'RMA-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('public.vendor_return_number_seq')::text, 6, '0');
  end if;
  return new;
end $$;

create or replace function public.protect_vendor_allocation_financials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff() then
    return new;
  end if;

  if new.order_id <> old.order_id or new.vendor_id <> old.vendor_id or
     new.store_id is distinct from old.store_id or
     new.subtotal <> old.subtotal or
     new.commission_rate <> old.commission_rate or
     new.commission_amount <> old.commission_amount or
     new.vendor_earnings <> old.vendor_earnings then
    raise exception 'Financial allocation fields are read-only for sellers';
  end if;
  return new;
end $$;

create or replace function public.protect_vendor_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor uuid := coalesce(new.vendor_id, old.vendor_id);
  v_remaining integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'OWNER' then
      select count(*) into v_remaining
      from public.vendor_members
      where vendor_id = v_vendor and role = 'OWNER' and status = 'ACTIVE' and id <> old.id;
      if v_remaining = 0 then
        raise exception 'A vendor must retain at least one owner';
      end if;
    end if;
    return old;
  end if;

  if old.role = 'OWNER' and (new.role <> 'OWNER' or new.status <> 'ACTIVE') then
    select count(*) into v_remaining
    from public.vendor_members
    where vendor_id = v_vendor and role = 'OWNER' and status = 'ACTIVE' and id <> old.id;
    if v_remaining = 0 then
      raise exception 'A vendor must retain at least one owner';
    end if;
  end if;

  return new;
end $$;

create or replace function public.touch_vendor_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vendor_conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.body, 180),
      status = case when status = 'CLOSED' then 'OPEN'::public.vendor_conversation_status else status end,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end $$;

create or replace function public.sync_vendor_publication()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'SUSPENDED' and old.status is distinct from 'SUSPENDED' then
    update public.stores set status = 'SUSPENDED' where vendor_id = new.id and status = 'ACTIVE';
    update public.products set status = 'HIDDEN' where vendor_id = new.id and deleted_at is null;
    update public.vendors set suspended_at = now(), suspension_reason = coalesce(suspension_reason, 'Vendor suspended') where id = new.id;
  end if;
  return new;
end $$;

create or replace function public.log_vendor_audit(
  p_vendor_id uuid,
  p_action text,
  p_resource text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_vendor_member(p_vendor_id) or public.is_staff()) then
    raise exception 'Not authorized';
  end if;
  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (p_vendor_id, auth.uid(), p_action, p_resource, coalesce(p_metadata, '{}'::jsonb));
end $$;

-- ---------------------------------------------------------------------------
-- Vendor onboarding RPC
-- ---------------------------------------------------------------------------
create or replace function public.create_vendor_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing_vendor uuid;
  v_existing_store uuid;
  v_vendor_id uuid;
  v_store_id uuid;
  v_display_name text := nullif(trim(payload->>'display_name'), '');
  v_legal_name text := coalesce(nullif(trim(payload->>'legal_name'), ''), v_display_name);
  v_email text := nullif(trim(payload->>'email'), '');
  v_slug text;
  v_store_name text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if v_display_name is null or v_email is null then
    raise exception 'Business name and email are required';
  end if;

  select v.id, s.id into v_existing_vendor, v_existing_store
  from public.vendor_members m
  join public.vendors v on v.id = m.vendor_id
  left join public.stores s on s.vendor_id = v.id and s.deleted_at is null
  where m.user_id = v_user and m.role = 'OWNER' and m.status = 'ACTIVE' and v.deleted_at is null
  order by s.created_at
  limit 1;

  if v_existing_vendor is not null then
    return jsonb_build_object(
      'vendor_id', v_existing_vendor,
      'store_id', v_existing_store,
      'created', false
    );
  end if;

  v_slug := public.marketplace_slugify(coalesce(nullif(payload->>'slug', ''), v_display_name));
  if v_slug = '' then v_slug := 'vendor'; end if;
  if exists (select 1 from public.vendors where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.vendors (
    owner_id, slug, legal_name, display_name, email, phone, description,
    country, business_type, tax_id, status, verification_status
  ) values (
    v_user, v_slug, v_legal_name, v_display_name, v_email,
    nullif(payload->>'phone', ''), nullif(payload->>'description', ''),
    coalesce(nullif(payload->>'country', ''), 'US'),
    nullif(payload->>'business_type', ''), nullif(payload->>'tax_id', ''),
    'PENDING', 'PENDING'
  ) returning id into v_vendor_id;

  insert into public.vendor_members (vendor_id, user_id, role, permissions, status, joined_at)
  values (v_vendor_id, v_user, 'OWNER', array['*'], 'ACTIVE', now())
  on conflict (vendor_id, user_id) do update set role = 'OWNER', status = 'ACTIVE';

  insert into public.vendor_verifications (
    vendor_id, status, contact_name, business_registration_url, tax_document_url, identity_document_url, notes
  ) values (
    v_vendor_id, 'PENDING', nullif(payload->>'contact_name', ''),
    nullif(payload->>'business_registration_url', ''),
    nullif(payload->>'tax_document_url', ''),
    nullif(payload->>'identity_document_url', ''),
    nullif(payload->>'notes', '')
  );

  insert into public.vendor_shipping_profiles (vendor_id, name, is_default)
  values (v_vendor_id, 'Standard shipping', true);

  v_store_name := coalesce(nullif(payload->>'store_name', ''), v_display_name);
  v_slug := public.marketplace_slugify(coalesce(nullif(payload->>'store_slug', ''), v_store_name));
  if v_slug = '' then v_slug := 'store'; end if;
  if exists (select 1 from public.stores where slug = v_slug) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.stores (
    vendor_id, name, slug, tagline, description, email, phone, country,
    status, return_policy, shipping_policy
  ) values (
    v_vendor_id, v_store_name, v_slug,
    nullif(payload->>'store_tagline', ''),
    nullif(payload->>'store_description', ''),
    v_email, nullif(payload->>'phone', ''), coalesce(nullif(payload->>'country', ''), 'US'),
    'PENDING_REVIEW', nullif(payload->>'return_policy', ''), nullif(payload->>'shipping_policy', '')
  ) returning id into v_store_id;

  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (v_vendor_id, v_user, 'VENDOR_APPLICATION_SUBMITTED', v_vendor_id::text,
          jsonb_build_object('store_id', v_store_id));

  insert into public.vendor_notifications (vendor_id, type, title, body, link)
  values (v_vendor_id, 'SYSTEM', 'Application received',
          'Your seller application is under review. You can prepare your store in the meantime.',
          '/seller');

  return jsonb_build_object(
    'vendor_id', v_vendor_id,
    'store_id', v_store_id,
    'created', true
  );
end $$;

-- ---------------------------------------------------------------------------
-- Payout request / processing RPCs
-- ---------------------------------------------------------------------------
create or replace function public.request_vendor_payout(p_vendor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_balance numeric(14,2);
  v_gross numeric(14,2);
  v_commission numeric(14,2);
  v_refunds numeric(14,2);
  v_payout_id uuid;
  v_number text;
  v_pending uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_vendor_admin(p_vendor_id) then
    raise exception 'Only vendor owners or admins can request payouts';
  end if;

  select id into v_pending from public.vendor_payouts
  where vendor_id = p_vendor_id and status in ('PENDING', 'APPROVED', 'PROCESSING')
  order by created_at desc limit 1;
  if v_pending is not null then
    raise exception 'A payout request is already in progress';
  end if;

  select coalesce(sum(amount), 0),
         coalesce(sum(amount) filter (where amount > 0), 0),
         coalesce(abs(sum(amount) filter (where type = 'COMMISSION')), 0),
         coalesce(abs(sum(amount) filter (where type = 'REFUND')), 0)
    into v_balance, v_gross, v_commission, v_refunds
  from public.vendor_ledger_entries
  where vendor_id = p_vendor_id and payout_id is null and available_at <= now();

  if v_balance < 50 then
    raise exception 'Minimum payout is $50.00 (available balance: $%)', to_char(v_balance, 'FM999999990.00');
  end if;

  v_number := 'PAYOUT-' || to_char(now(), 'YYYYMMDD') || '-' ||
    lpad(nextval('public.vendor_payout_number_seq')::text, 6, '0');

  insert into public.vendor_payouts (
    vendor_id, payout_number, period_start, period_end, gross_sales,
    refunds, commissions, net_amount, status, requested_by
  ) values (
    p_vendor_id, v_number,
    coalesce((select min(created_at) from public.vendor_ledger_entries where vendor_id = p_vendor_id and payout_id is null), now() - interval '30 days'),
    now(), v_gross, v_refunds, v_commission, v_balance, 'PENDING', v_user
  ) returning id into v_payout_id;

  update public.vendor_ledger_entries
    set payout_id = v_payout_id
    where vendor_id = p_vendor_id and payout_id is null and available_at <= now();

  insert into public.vendor_notifications (vendor_id, type, title, body, link, data)
  values (p_vendor_id, 'PAYMENT', 'Payout requested',
          format('Payout %s for $%s is awaiting review.', v_number, to_char(v_balance, 'FM999999990.00')),
          '/seller/finance', jsonb_build_object('payout_id', v_payout_id));

  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (p_vendor_id, v_user, 'PAYOUT_REQUESTED', v_payout_id::text,
          jsonb_build_object('amount', v_balance, 'number', v_number));

  return jsonb_build_object('payout_id', v_payout_id, 'payout_number', v_number, 'net_amount', v_balance);
end $$;

create or replace function public.process_vendor_payout(
  p_payout_id uuid,
  p_status public.vendor_payout_status,
  p_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payout public.vendor_payouts%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Staff access required';
  end if;
  if p_status not in ('APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') then
    raise exception 'Invalid payout transition';
  end if;

  select * into v_payout from public.vendor_payouts where id = p_payout_id for update;
  if not found then raise exception 'Payout not found'; end if;

  update public.vendor_payouts
  set status = p_status,
      reference = coalesce(p_reference, reference),
      notes = coalesce(p_notes, notes),
      reviewed_by = auth.uid(),
      processed_at = case when p_status = 'PAID' then now() else processed_at end,
      updated_at = now()
  where id = p_payout_id;

  if p_status in ('FAILED', 'CANCELLED') then
    update public.vendor_ledger_entries set payout_id = null where payout_id = p_payout_id;
  end if;

  insert into public.vendor_notifications (vendor_id, type, title, body, link, data)
  values (
    v_payout.vendor_id, 'PAYMENT',
    case when p_status = 'PAID' then 'Payout sent' else 'Payout updated' end,
    format('Payout %s is now %s.', v_payout.payout_number, p_status),
    '/seller/finance',
    jsonb_build_object('payout_id', p_payout_id, 'status', p_status)
  );

  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (v_payout.vendor_id, auth.uid(), 'PAYOUT_' || p_status, p_payout_id::text,
          jsonb_build_object('reference', p_reference));
end $$;

create or replace function public.process_vendor_return(
  p_return_id uuid,
  p_status public.vendor_return_status,
  p_refund_amount numeric default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.vendor_returns%rowtype;
  v_refund numeric(14,2);
  v_commission_reversal numeric(14,2);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_return from public.vendor_returns where id = p_return_id for update;
  if not found then raise exception 'Return not found'; end if;

  if not (public.is_staff() or public.has_vendor_permission(v_return.vendor_id, 'returns.manage')) then
    raise exception 'Not authorized';
  end if;

  v_refund := coalesce(p_refund_amount, v_return.refund_amount, 0);
  if v_refund < 0 then raise exception 'Refund cannot be negative'; end if;
  select coalesce(round(v_refund * (oi.commission_amount / nullif(oi.total, 0)), 2), 0)
    into v_commission_reversal
  from public.order_items oi
  where oi.id = v_return.order_item_id;

  update public.vendor_returns
  set status = p_status,
      refund_amount = case when p_status = 'REFUNDED' then v_refund else refund_amount end,
      resolution_notes = coalesce(p_notes, resolution_notes),
      reviewed_at = case when p_status in ('APPROVED', 'REJECTED') then now() else reviewed_at end,
      received_at = case when p_status = 'RECEIVED' then now() else received_at end,
      refunded_at = case when p_status = 'REFUNDED' then now() else refunded_at end,
      updated_at = now()
  where id = p_return_id;

  if p_status = 'REFUNDED' then
    insert into public.vendor_ledger_entries (
      vendor_id, store_id, order_id, order_item_id, type, amount, description, available_at, metadata
    ) values (
      v_return.vendor_id, v_return.store_id, v_return.order_id, v_return.order_item_id,
      'REFUND', -v_refund, 'Marketplace return refund', now(),
      jsonb_build_object(
        'return_id', p_return_id,
        'order_id', v_return.order_id,
        'commission_reversal', v_commission_reversal
      )
    );

    insert into public.vendor_notifications (vendor_id, type, title, body, link, data)
    values (
      v_return.vendor_id, 'ORDER', 'Return refunded',
      format('RMA %s was refunded for $%s.', v_return.rma_number, to_char(v_refund, 'FM999999990.00')),
      '/seller/returns',
      jsonb_build_object('return_id', p_return_id, 'commission_reversal', v_commission_reversal)
    );
  end if;

  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (v_return.vendor_id, auth.uid(), 'RETURN_' || p_status, p_return_id::text,
          jsonb_build_object('refund_amount', v_refund, 'commission_reversal', v_commission_reversal));
end $$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists enforce_product_vendor_store on public.products;
create trigger enforce_product_vendor_store
  before insert or update of vendor_id, store_id, commission_rate, vendor_sku, approval_status
  on public.products
  for each row execute function public.enforce_product_vendor_store();

drop trigger if exists protect_product_marketplace_fields on public.products;
create trigger protect_product_marketplace_fields
  before update on public.products
  for each row execute function public.protect_product_marketplace_fields();

drop trigger if exists sync_store_product_counters on public.products;
create trigger sync_store_product_counters
  after insert or update or delete
  on public.products
  for each row execute function public.sync_store_product_counters();

drop trigger if exists set_review_marketplace_owner on public.reviews;
create trigger set_review_marketplace_owner
  before insert or update of product_id on public.reviews
  for each row execute function public.set_review_marketplace_owner();

drop trigger if exists refresh_vendor_rating on public.reviews;
create trigger refresh_vendor_rating
  after insert or update of rating, status, vendor_id, store_id or delete
  on public.reviews
  for each row execute function public.refresh_vendor_rating();

drop trigger if exists snapshot_order_item_marketplace on public.order_items;
create trigger snapshot_order_item_marketplace
  before insert on public.order_items
  for each row execute function public.snapshot_order_item_marketplace();

drop trigger if exists allocate_vendor_order_item on public.order_items;
create trigger allocate_vendor_order_item
  after insert on public.order_items
  for each row execute function public.allocate_vendor_order_item();

drop trigger if exists sync_marketplace_order_paid on public.orders;
create trigger sync_marketplace_order_paid
  after update of payment_status on public.orders
  for each row execute function public.sync_marketplace_order_paid();

drop trigger if exists generate_vendor_rma on public.vendor_returns;
create trigger generate_vendor_rma
  before insert on public.vendor_returns
  for each row execute function public.generate_vendor_rma();

drop trigger if exists protect_vendor_allocation_financials on public.vendor_order_allocations;
create trigger protect_vendor_allocation_financials
  before update on public.vendor_order_allocations
  for each row execute function public.protect_vendor_allocation_financials();

drop trigger if exists protect_vendor_owner_membership on public.vendor_members;
create trigger protect_vendor_owner_membership
  before update or delete on public.vendor_members
  for each row execute function public.protect_vendor_owner_membership();

drop trigger if exists touch_vendor_conversation on public.vendor_messages;
create trigger touch_vendor_conversation
  after insert on public.vendor_messages
  for each row execute function public.touch_vendor_conversation();

drop trigger if exists sync_vendor_publication on public.vendors;
create trigger sync_vendor_publication
  after update of status on public.vendors
  for each row execute function public.sync_vendor_publication();

-- set_updated_at for every new timestamped table
do $$
declare
  t text;
  tables text[] := array[
    'vendors', 'stores', 'vendor_members', 'vendor_verifications',
    'vendor_shipping_profiles', 'vendor_shipping_rates', 'vendor_payout_accounts',
    'vendor_payouts', 'vendor_order_allocations', 'vendor_returns',
    'vendor_conversations'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', t, t);
    execute format(
      'create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'vendors', 'stores', 'vendor_members', 'vendor_verifications',
    'vendor_shipping_profiles', 'vendor_shipping_rates', 'vendor_payout_accounts',
    'vendor_payouts', 'vendor_ledger_entries', 'vendor_order_allocations',
    'vendor_returns', 'vendor_conversations', 'vendor_messages',
    'vendor_notifications', 'vendor_audit_logs', 'store_followers'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- vendors: seller team only. Public storefront reads go through a safe view.
drop policy if exists vendors_member_read on public.vendors;
create policy vendors_member_read on public.vendors
  for select to authenticated
  using (public.is_vendor_member(id) or public.is_staff());

drop policy if exists vendors_member_update on public.vendors;
create policy vendors_member_update on public.vendors
  for update to authenticated
  using (public.has_vendor_permission(id, 'settings.manage') or public.is_staff())
  with check (public.has_vendor_permission(id, 'settings.manage') or public.is_staff());

drop policy if exists vendors_staff_all on public.vendors;
create policy vendors_staff_all on public.vendors
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- stores
drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'ACTIVE'
    and exists (
      select 1 from public.vendors v
      where v.id = vendor_id and v.status = 'APPROVED' and v.deleted_at is null
    )
  );

drop policy if exists stores_vendor_read on public.stores;
create policy stores_vendor_read on public.stores
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists stores_vendor_insert on public.stores;
create policy stores_vendor_insert on public.stores
  for insert to authenticated
  with check (public.has_vendor_permission(vendor_id, 'stores.manage') or public.is_staff());

drop policy if exists stores_vendor_update on public.stores;
create policy stores_vendor_update on public.stores
  for update to authenticated
  using (public.has_vendor_permission(vendor_id, 'stores.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'stores.manage') or public.is_staff());

drop policy if exists stores_staff_all on public.stores;
create policy stores_staff_all on public.stores
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- vendor members
drop policy if exists vendor_members_read on public.vendor_members;
create policy vendor_members_read on public.vendor_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_members_admin_write on public.vendor_members;
create policy vendor_members_admin_write on public.vendor_members
  for all to authenticated
  using (public.is_vendor_admin(vendor_id) or public.is_staff())
  with check (public.is_vendor_admin(vendor_id) or public.is_staff());

-- verifications
drop policy if exists vendor_verifications_read on public.vendor_verifications;
create policy vendor_verifications_read on public.vendor_verifications
  for select to authenticated
  using (public.is_vendor_admin(vendor_id) or public.is_staff());

drop policy if exists vendor_verifications_insert on public.vendor_verifications;
create policy vendor_verifications_insert on public.vendor_verifications
  for insert to authenticated
  with check (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_verifications_staff_all on public.vendor_verifications;
create policy vendor_verifications_staff_all on public.vendor_verifications
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- shipping profiles / rates
drop policy if exists vendor_shipping_profiles_read on public.vendor_shipping_profiles;
create policy vendor_shipping_profiles_read on public.vendor_shipping_profiles
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_shipping_profiles_write on public.vendor_shipping_profiles;
create policy vendor_shipping_profiles_write on public.vendor_shipping_profiles
  for all to authenticated
  using (public.has_vendor_permission(vendor_id, 'shipping.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'shipping.manage') or public.is_staff());

drop policy if exists vendor_shipping_rates_read on public.vendor_shipping_rates;
create policy vendor_shipping_rates_read on public.vendor_shipping_rates
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_shipping_rates_public_read on public.vendor_shipping_rates;
create policy vendor_shipping_rates_public_read on public.vendor_shipping_rates
  for select to anon
  using (is_active = true);

drop policy if exists vendor_shipping_rates_write on public.vendor_shipping_rates;
create policy vendor_shipping_rates_write on public.vendor_shipping_rates
  for all to authenticated
  using (public.has_vendor_permission(vendor_id, 'shipping.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'shipping.manage') or public.is_staff());

-- payout accounts (masked account data only)
drop policy if exists vendor_payout_accounts_read on public.vendor_payout_accounts;
create policy vendor_payout_accounts_read on public.vendor_payout_accounts
  for select to authenticated
  using (public.is_vendor_admin(vendor_id) or public.is_staff());

drop policy if exists vendor_payout_accounts_write on public.vendor_payout_accounts;
create policy vendor_payout_accounts_write on public.vendor_payout_accounts
  for all to authenticated
  using (public.has_vendor_permission(vendor_id, 'payouts.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'payouts.manage') or public.is_staff());

-- payouts
drop policy if exists vendor_payouts_read on public.vendor_payouts;
create policy vendor_payouts_read on public.vendor_payouts
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_payouts_staff_write on public.vendor_payouts;
create policy vendor_payouts_staff_write on public.vendor_payouts
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ledger is read-only for vendors
drop policy if exists vendor_ledger_read on public.vendor_ledger_entries;
create policy vendor_ledger_read on public.vendor_ledger_entries
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

-- allocations
drop policy if exists vendor_allocations_read on public.vendor_order_allocations;
create policy vendor_allocations_read on public.vendor_order_allocations
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_allocations_fulfillment_update on public.vendor_order_allocations;
create policy vendor_allocations_fulfillment_update on public.vendor_order_allocations
  for update to authenticated
  using (public.has_vendor_permission(vendor_id, 'orders.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'orders.manage') or public.is_staff());

-- returns
drop policy if exists vendor_returns_read on public.vendor_returns;
create policy vendor_returns_read on public.vendor_returns
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_vendor_member(vendor_id)
    or public.is_staff()
  );

drop policy if exists vendor_returns_customer_insert on public.vendor_returns;
create policy vendor_returns_customer_insert on public.vendor_returns
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

drop policy if exists vendor_returns_seller_update on public.vendor_returns;
create policy vendor_returns_seller_update on public.vendor_returns
  for update to authenticated
  using (public.has_vendor_permission(vendor_id, 'returns.manage') or public.is_staff())
  with check (public.has_vendor_permission(vendor_id, 'returns.manage') or public.is_staff());

-- conversations
drop policy if exists vendor_conversations_read on public.vendor_conversations;
create policy vendor_conversations_read on public.vendor_conversations
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or public.is_vendor_member(vendor_id)
    or public.is_staff()
  );

drop policy if exists vendor_conversations_insert on public.vendor_conversations;
create policy vendor_conversations_insert on public.vendor_conversations
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    or public.is_vendor_member(vendor_id)
    or public.is_staff()
  );

drop policy if exists vendor_conversations_update on public.vendor_conversations;
create policy vendor_conversations_update on public.vendor_conversations
  for update to authenticated
  using (
    customer_id = (select auth.uid())
    or public.is_vendor_member(vendor_id)
    or public.is_staff()
  )
  with check (
    customer_id = (select auth.uid())
    or public.is_vendor_member(vendor_id)
    or public.is_staff()
  );

-- messages
drop policy if exists vendor_messages_read on public.vendor_messages;
create policy vendor_messages_read on public.vendor_messages
  for select to authenticated
  using (public.can_access_vendor_conversation(conversation_id));

drop policy if exists vendor_messages_insert on public.vendor_messages;
create policy vendor_messages_insert on public.vendor_messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_access_vendor_conversation(conversation_id)
  );

drop policy if exists vendor_messages_read_receipt on public.vendor_messages;
create policy vendor_messages_read_receipt on public.vendor_messages
  for update to authenticated
  using (public.can_access_vendor_conversation(conversation_id))
  with check (public.can_access_vendor_conversation(conversation_id));

-- seller notifications
drop policy if exists vendor_notifications_read on public.vendor_notifications;
create policy vendor_notifications_read on public.vendor_notifications
  for select to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_notifications_update on public.vendor_notifications;
create policy vendor_notifications_update on public.vendor_notifications
  for update to authenticated
  using (public.is_vendor_member(vendor_id) or public.is_staff())
  with check (public.is_vendor_member(vendor_id) or public.is_staff());

drop policy if exists vendor_notifications_staff_insert on public.vendor_notifications;
create policy vendor_notifications_staff_insert on public.vendor_notifications
  for insert to authenticated
  with check (public.is_staff());

-- vendor audit logs are read-only to vendor admins
drop policy if exists vendor_audit_read on public.vendor_audit_logs;
create policy vendor_audit_read on public.vendor_audit_logs
  for select to authenticated
  using (public.is_vendor_admin(vendor_id) or public.is_staff());

-- store followers
drop policy if exists store_followers_read on public.store_followers;
create policy store_followers_read on public.store_followers
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_vendor_member((select vendor_id from public.stores where id = store_id))
    or public.is_staff()
  );

drop policy if exists store_followers_customer_insert on public.store_followers;
create policy store_followers_customer_insert on public.store_followers
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists store_followers_customer_delete on public.store_followers;
create policy store_followers_customer_delete on public.store_followers
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- Existing commerce tables: marketplace-aware policies (additive)
-- ---------------------------------------------------------------------------
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'ACTIVE'
    and approval_status = 'APPROVED'
    and (
      vendor_id is null
      or exists (
        select 1 from public.vendors v
        where v.id = products.vendor_id
          and v.status = 'APPROVED'
          and v.deleted_at is null
      )
    )
    and (
      store_id is null
      or exists (
        select 1 from public.stores s
        where s.id = products.store_id
          and s.status = 'ACTIVE'
          and s.deleted_at is null
      )
    )
  );

drop policy if exists products_vendor_read on public.products;
create policy products_vendor_read on public.products
  for select to authenticated
  using (vendor_id is not null and public.is_vendor_member(vendor_id));

drop policy if exists products_vendor_insert on public.products;
create policy products_vendor_insert on public.products
  for insert to authenticated
  with check (
    vendor_id is not null
    and public.has_vendor_permission(vendor_id, 'products.manage')
  );

drop policy if exists products_vendor_update on public.products;
create policy products_vendor_update on public.products
  for update to authenticated
  using (vendor_id is not null and public.has_vendor_permission(vendor_id, 'products.manage'))
  with check (vendor_id is not null and public.has_vendor_permission(vendor_id, 'products.manage'));

drop policy if exists products_vendor_delete on public.products;
create policy products_vendor_delete on public.products
  for delete to authenticated
  using (vendor_id is not null and public.is_vendor_admin(vendor_id));

-- product images
drop policy if exists product_images_vendor_all on public.product_images;
create policy product_images_vendor_all on public.product_images
  for all to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'products.manage')
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'products.manage')
    )
  );

drop policy if exists product_variants_vendor_all on public.product_variants;
create policy product_variants_vendor_all on public.product_variants
  for all to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'products.manage')
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'products.manage')
    )
  );

-- inventory
drop policy if exists inventory_vendor_all on public.inventory;
create policy inventory_vendor_all on public.inventory
  for all to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'inventory.manage')
    )
  )
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'inventory.manage')
    )
  );

drop policy if exists inventory_logs_vendor_read on public.inventory_logs;
create policy inventory_logs_vendor_read on public.inventory_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.is_vendor_member(p.vendor_id)
    )
  );

drop policy if exists inventory_logs_vendor_insert on public.inventory_logs;
create policy inventory_logs_vendor_insert on public.inventory_logs
  for insert to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.vendor_id is not null
        and public.has_vendor_permission(p.vendor_id, 'inventory.manage')
    )
  );

-- orders: sellers see orders allocated to their vendor
drop policy if exists orders_vendor_read on public.orders;
create policy orders_vendor_read on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.vendor_order_allocations a
      where a.order_id = orders.id and public.is_vendor_member(a.vendor_id)
    )
    or public.is_staff()
  );

drop policy if exists order_items_vendor_read on public.order_items;
create policy order_items_vendor_read on public.order_items
  for select to authenticated
  using (
    (vendor_id is not null and public.is_vendor_member(vendor_id))
    or public.is_staff()
  );

-- coupons
drop policy if exists coupons_vendor_write on public.coupons;
create policy coupons_vendor_write on public.coupons
  for all to authenticated
  using (
    vendor_id is not null and public.has_vendor_permission(vendor_id, 'coupons.manage')
  )
  with check (
    vendor_id is not null and public.has_vendor_permission(vendor_id, 'coupons.manage')
  );

-- reviews: sellers can read and reply to their product reviews
drop policy if exists reviews_vendor_read on public.reviews;
create policy reviews_vendor_read on public.reviews
  for select to authenticated
  using (vendor_id is not null and public.is_vendor_member(vendor_id));

drop policy if exists reviews_vendor_reply on public.reviews;
create policy reviews_vendor_reply on public.reviews
  for update to authenticated
  using (vendor_id is not null and public.has_vendor_permission(vendor_id, 'reviews.manage'))
  with check (vendor_id is not null and public.has_vendor_permission(vendor_id, 'reviews.manage'));

-- ---------------------------------------------------------------------------
-- Safe public storefront view (never exposes tax IDs or bank metadata)
-- ---------------------------------------------------------------------------
create or replace view public.public_vendor_profiles
with (security_invoker = false)
as
select
  id,
  slug,
  display_name,
  description,
  logo_url,
  banner_url,
  country,
  rating,
  review_count,
  product_count,
  created_at
from public.vendors
where status = 'APPROVED' and deleted_at is null;

grant select on public.public_vendor_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Settings + grants
-- ---------------------------------------------------------------------------
insert into public.settings (key, value, description, is_public)
values (
  'marketplace.default_commission',
  '{"rate": 10}'::jsonb,
  'Default marketplace commission percentage',
  true
)
on conflict (key) do nothing;

insert into public.settings (key, value, description, is_public)
values (
  'marketplace.payout_minimum',
  '{"amount": 50}'::jsonb,
  'Minimum vendor payout amount',
  false
)
on conflict (key) do nothing;

grant execute on function public.create_vendor_application(jsonb) to authenticated;
grant execute on function public.request_vendor_payout(uuid) to authenticated;
grant execute on function public.process_vendor_payout(uuid, public.vendor_payout_status, text, text) to authenticated;
grant execute on function public.process_vendor_return(uuid, public.vendor_return_status, numeric, text) to authenticated;
grant execute on function public.log_vendor_audit(uuid, text, text, jsonb) to authenticated;
grant execute on function public.is_vendor_member(uuid) to authenticated;
grant execute on function public.is_vendor_admin(uuid) to authenticated;
grant execute on function public.has_vendor_permission(uuid, text) to authenticated;
grant execute on function public.can_access_vendor_order(uuid) to authenticated;
grant execute on function public.can_access_vendor_conversation(uuid) to authenticated;

revoke execute on function public.create_vendor_application(jsonb) from anon;
revoke execute on function public.request_vendor_payout(uuid) from anon;
revoke execute on function public.log_vendor_audit(uuid, text, text, jsonb) from anon;

commit;
