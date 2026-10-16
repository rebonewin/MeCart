-- ============================================================================
-- MeCart Enterprise — 0001 Extensions & Enums
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'manager', 'customer', 'guest');
  end if;
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('ACTIVE', 'DRAFT', 'HIDDEN');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('COD', 'UPI', 'CARD', 'NETBANKING');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_status') then
    create type public.audit_status as enum ('SUCCESS', 'FAILED');
  end if;
  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type public.review_status as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
  if not exists (select 1 from pg_type where typname = 'cart_status') then
    create type public.cart_status as enum ('ACTIVE', 'CONVERTED', 'ABANDONED');
  end if;
  if not exists (select 1 from pg_type where typname = 'cms_status') then
    create type public.cms_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum ('ORDER', 'PAYMENT', 'SYSTEM', 'PROMOTION', 'SECURITY', 'REVIEW');
  end if;
  if not exists (select 1 from pg_type where typname = 'txn_type') then
    create type public.txn_type as enum ('CHARGE', 'REFUND', 'ADJUSTMENT', 'PAYOUT');
  end if;
end $$;
