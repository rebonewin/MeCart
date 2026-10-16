-- ============================================================================
-- MeCart Enterprise — 0002 Tables
-- All application tables with primary keys, foreign keys, constraints, indexes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Order number sequence
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 100001;

-- ---------------------------------------------------------------------------
-- 1. profiles (mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  email       text unique,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        public.app_role not null default 'customer',
  is_active   boolean not null default true,
  last_login_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists profiles_role_idx on public.profiles (role) where deleted_at is null;
create index if not exists profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 2. roles
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. permissions
-- ---------------------------------------------------------------------------
create table if not exists public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  resource    text not null,
  action      text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists permissions_resource_idx on public.permissions (resource);

-- ---------------------------------------------------------------------------
-- role_permissions (join)
-- ---------------------------------------------------------------------------
create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- 4. admins (staff registry linked to profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.profiles (id) on delete cascade,
  level       text not null default 'admin' check (level in ('owner', 'admin', 'manager', 'support')),
  department  text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists admins_level_idx on public.admins (level);

-- ---------------------------------------------------------------------------
-- 5. customers (commerce stats per customer profile)
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references public.profiles (id) on delete cascade,
  marketing_opt_in boolean not null default false,
  total_orders   integer not null default 0,
  total_spent    numeric(12,2) not null default 0,
  loyalty_points integer not null default 0,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index if not exists customers_total_spent_idx on public.customers (total_spent desc);

-- ---------------------------------------------------------------------------
-- 6. categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists categories_slug_idx on public.categories (slug) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- sub_categories
-- ---------------------------------------------------------------------------
create table if not exists public.sub_categories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name        text not null,
  slug        text not null,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (category_id, slug)
);
create index if not exists sub_categories_category_idx on public.sub_categories (category_id);

-- ---------------------------------------------------------------------------
-- 7. brands
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  logo_url    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists brands_slug_idx on public.brands (slug) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- 8. products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  sku             text not null unique,
  description     text not null default '',
  material        text,
  country         text,
  weight          numeric(10,3),
  stock           integer not null default 0 check (stock >= 0),
  sizes           text[] not null default '{}',
  colors          text[] not null default '{}',
  rating          numeric(3,2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count    integer not null default 0,
  status          public.product_status not null default 'ACTIVE',
  featured        boolean not null default false,
  best_seller     boolean not null default false,
  new_arrival     boolean not null default false,
  original_price  numeric(12,2) not null check (original_price >= 0),
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  final_price     numeric(12,2) not null check (final_price >= 0),
  category_id     uuid not null references public.categories (id),
  sub_category_id uuid references public.sub_categories (id),
  brand_id        uuid references public.brands (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_sub_category_idx on public.products (sub_category_id);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_status_idx on public.products (status, created_at desc) where deleted_at is null;
create index if not exists products_featured_idx on public.products (featured) where deleted_at is null and status = 'ACTIVE';
create index if not exists products_best_seller_idx on public.products (best_seller) where deleted_at is null and status = 'ACTIVE';
create index if not exists products_new_arrival_idx on public.products (new_arrival) where deleted_at is null and status = 'ACTIVE';
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index if not exists products_price_idx on public.products (final_price);

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url        text not null,
  alt        text,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, position)
);
create index if not exists product_images_product_idx on public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null,
  sku         text not null unique,
  size        text,
  color       text,
  price       numeric(12,2),
  stock       integer not null default 0 check (stock >= 0),
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- 9. inventory
-- ---------------------------------------------------------------------------
create table if not exists public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  variant_id          uuid references public.product_variants (id) on delete cascade,
  quantity            integer not null default 0 check (quantity >= 0),
  reserved_quantity   integer not null default 0 check (reserved_quantity >= 0),
  low_stock_threshold integer not null default 5,
  location            text default 'main-warehouse',
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  unique (product_id, variant_id)
);
create index if not exists inventory_product_idx on public.inventory (product_id);
create unique index if not exists inventory_main_row_idx on public.inventory (product_id) where variant_id is null;
create index if not exists inventory_low_stock_idx on public.inventory (quantity) where quantity <= 5;

-- ---------------------------------------------------------------------------
-- inventory_logs
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_logs (
  id           uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory (id) on delete set null,
  product_id   uuid not null references public.products (id) on delete cascade,
  variant_id   uuid references public.product_variants (id) on delete set null,
  change       integer not null,
  quantity_after integer not null default 0,
  reason       text not null default 'adjustment',
  reference    text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists inventory_logs_product_idx on public.inventory_logs (product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  label      text,
  name       text not null,
  phone      text not null,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  zip        text not null,
  country    text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists addresses_user_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- carts
-- ---------------------------------------------------------------------------
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     public.cart_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists carts_user_idx on public.carts (user_id);
create unique index if not exists carts_one_active_per_user_idx on public.carts (user_id) where status = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  quantity   integer not null default 1 check (quantity > 0),
  size       text,
  color      text,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (cart_id, product_id, size, color)
);
create index if not exists cart_items_cart_idx on public.cart_items (cart_id);
create index if not exists cart_items_product_idx on public.cart_items (product_id);

-- ---------------------------------------------------------------------------
-- wishlists
-- ---------------------------------------------------------------------------
create table if not exists public.wishlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists wishlists_user_idx on public.wishlists (user_id);

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  description     text,
  discount_percent integer check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  discount_amount numeric(12,2) check (discount_amount is null or discount_amount >= 0),
  min_order_value numeric(12,2),
  max_discount    numeric(12,2),
  usage_limit     integer,
  per_user_limit  integer not null default 1,
  used_count      integer not null default 0,
  starts_at       timestamptz,
  expires_at      timestamptz,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists coupons_code_idx on public.coupons (code) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- coupon_usage
-- ---------------------------------------------------------------------------
create table if not exists public.coupon_usage (
  id         uuid primary key default gen_random_uuid(),
  coupon_id  uuid not null references public.coupons (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  order_id   uuid,
  discount   numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists coupon_usage_coupon_idx on public.coupon_usage (coupon_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  invoice_number   text not null unique,
  user_id          uuid references public.profiles (id) on delete set null,
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  shipping_address text not null,
  billing_address  text,
  city             text not null,
  zip              text not null,
  subtotal         numeric(12,2) not null default 0,
  shipping_cost    numeric(12,2) not null default 0,
  tax              numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  grand_total      numeric(12,2) not null default 0,
  currency         text not null default 'USD',
  status           public.order_status not null default 'PENDING',
  payment_status   public.payment_status not null default 'PENDING',
  coupon_code      text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_created_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name       text not null,
  sku        text not null,
  quantity   integer not null check (quantity > 0),
  size       text,
  color      text,
  price      numeric(12,2) not null,
  total      numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  method         public.payment_method not null,
  provider       text not null default 'DEMO',
  amount         numeric(12,2) not null,
  currency       text not null default 'USD',
  status         public.payment_status not null default 'PENDING',
  transaction_id text unique,
  payment_id     text unique,
  verified_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);

-- ---------------------------------------------------------------------------
-- transactions (money ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid references public.payments (id) on delete set null,
  order_id       uuid references public.orders (id) on delete set null,
  user_id        uuid references public.profiles (id) on delete set null,
  type           public.txn_type not null default 'CHARGE',
  amount         numeric(12,2) not null,
  currency       text not null default 'USD',
  status         text not null default 'SUCCESS',
  reference      text,
  gateway_response jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists transactions_order_idx on public.transactions (order_id);
create index if not exists transactions_created_idx on public.transactions (created_at desc);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  order_id   uuid references public.orders (id) on delete set null,
  author_name text,
  rating     integer not null check (rating between 1 and 5),
  title      text,
  body       text,
  images     text[] not null default '{}',
  status     public.review_status not null default 'APPROVED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc);
create index if not exists reviews_status_idx on public.reviews (status);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       public.notification_type not null default 'SYSTEM',
  title      text not null,
  body       text,
  link       text,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  action     text not null,
  resource   text,
  ip_address text,
  user_agent text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_user_idx on public.activity_logs (user_id, created_at desc);
create index if not exists activity_logs_action_idx on public.activity_logs (action);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  resource   text not null,
  old_value  text,
  new_value  text,
  ip_address text,
  user_agent text,
  os         text,
  browser    text,
  status     public.audit_status not null default 'SUCCESS',
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_admin_idx on public.audit_logs (admin_id, created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- ---------------------------------------------------------------------------
-- media_library
-- ---------------------------------------------------------------------------
create table if not exists public.media_library (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null,
  path        text not null,
  url         text not null,
  name        text,
  alt         text,
  mime_type   text,
  size_bytes  bigint,
  width       integer,
  height      integer,
  folder      text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists media_library_bucket_idx on public.media_library (bucket, folder);

-- ---------------------------------------------------------------------------
-- cms_pages
-- ---------------------------------------------------------------------------
create table if not exists public.cms_pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  content      jsonb not null default '{}'::jsonb,
  status       public.cms_status not null default 'DRAFT',
  template     text not null default 'default',
  cover_image  text,
  published_at timestamptz,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists cms_pages_status_idx on public.cms_pages (status, published_at desc);

-- ---------------------------------------------------------------------------
-- seo
-- ---------------------------------------------------------------------------
create table if not exists public.seo (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null check (entity_type in ('page', 'product', 'category', 'brand', 'global')),
  entity_id        text,
  meta_title       text,
  meta_description text,
  keywords         text[] not null default '{}',
  canonical_url    text,
  og_title         text,
  og_description   text,
  og_image         text,
  no_index         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (entity_type, entity_id)
);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  user_id    uuid references public.profiles (id) on delete set null,
  session_id text,
  path       text,
  referrer   text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_name_idx on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);

-- ---------------------------------------------------------------------------
-- shipping_zones
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_zones (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  countries  text[] not null default '{}',
  states     text[] not null default '{}',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- shipping_methods
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_methods (
  id             uuid primary key default gen_random_uuid(),
  zone_id        uuid references public.shipping_zones (id) on delete set null,
  name           text not null,
  description    text,
  rate           numeric(12,2) not null default 0,
  free_over      numeric(12,2),
  min_days       integer not null default 3,
  max_days       integer not null default 7,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tax_rules
-- ---------------------------------------------------------------------------
create table if not exists public.tax_rules (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  country    text,
  state      text,
  rate       numeric(6,4) not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings (key/value)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  is_public   boolean not null default false,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- theme_settings (key/value)
-- ---------------------------------------------------------------------------
create table if not exists public.theme_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- coupon_usage.order_id FK (added after orders exists)
-- ---------------------------------------------------------------------------
alter table public.coupon_usage
  drop constraint if exists coupon_usage_order_id_fkey;
alter table public.coupon_usage
  add constraint coupon_usage_order_id_fkey foreign key (order_id) references public.orders (id) on delete set null;
