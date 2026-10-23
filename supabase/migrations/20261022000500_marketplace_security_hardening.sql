-- Marketplace security hardening
-- 1. Remove ad-hoc password debugging RPCs that leaked auth metadata.
-- 2. Remove RPC access from trigger-only functions.
-- 3. Keep the public vendor directory safe without a SECURITY DEFINER view.
-- 4. Pin search_path on helper functions flagged by the advisor.

drop function if exists public.debug_pw(uuid);
drop function if exists public.debug2_pw(uuid);

-- Trigger functions never need to be called through PostgREST. Triggers still
-- execute them with the table owner's privileges.
revoke execute on function public.allocate_vendor_order_item() from public, anon, authenticated;
revoke execute on function public.enforce_product_vendor_store() from public, anon, authenticated;
revoke execute on function public.generate_vendor_rma() from public, anon, authenticated;
revoke execute on function public.handle_inventory_update() from public, anon, authenticated;
revoke execute on function public.handle_new_product() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_product_marketplace_fields() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.protect_vendor_allocation_financials() from public, anon, authenticated;
revoke execute on function public.protect_vendor_owner_membership() from public, anon, authenticated;
revoke execute on function public.refresh_customer_stats() from public, anon, authenticated;
revoke execute on function public.refresh_product_rating() from public, anon, authenticated;
revoke execute on function public.refresh_vendor_rating() from public, anon, authenticated;
revoke execute on function public.set_review_marketplace_owner() from public, anon, authenticated;
revoke execute on function public.snapshot_order_item_marketplace() from public, anon, authenticated;
revoke execute on function public.sync_admin_registry() from public, anon, authenticated;
revoke execute on function public.sync_marketplace_order_paid() from public, anon, authenticated;
revoke execute on function public.sync_store_follower_count() from public, anon, authenticated;
revoke execute on function public.sync_store_product_counters() from public, anon, authenticated;
revoke execute on function public.sync_vendor_publication() from public, anon, authenticated;
revoke execute on function public.touch_vendor_conversation() from public, anon, authenticated;
revoke execute on function public.track_password_set() from public, anon, authenticated;

-- OTP and privilege helpers are invoked only by service-role server actions.
revoke execute on function public.create_email_otp_request(text, text, integer, integer, text) from public, anon, authenticated;
revoke execute on function public.verify_email_otp_request(text, text, boolean, text, integer) from public, anon, authenticated;
revoke execute on function public.consumed_email_otp_request(text, text) from public, anon, authenticated;
revoke execute on function public.pending_otp_request(text, text) from public, anon, authenticated;
revoke execute on function public.create_phone_otp_request(text, text, integer, integer, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.verify_phone_otp_request(text, text, boolean, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.pending_phone_otp_request(text, text) from public, anon, authenticated;
revoke execute on function public.expire_stale_phone_otp_requests(integer) from public, anon, authenticated;
revoke execute on function public.user_has_password(uuid) from public, anon, authenticated;

-- Marketplace financial helpers are internal implementation details.
revoke execute on function public.marketplace_commission_for(uuid, numeric) from public, anon, authenticated;
revoke execute on function public.process_vendor_payout(uuid, public.vendor_payout_status, text, text) from public, anon;
revoke execute on function public.process_vendor_return(uuid, public.vendor_return_status, numeric, text) from public, anon;
revoke execute on function public.request_vendor_payout(uuid) from public, anon;
revoke execute on function public.create_vendor_application(jsonb) from public, anon;

-- Keep the public directory limited to approved sellers and safe columns while
-- avoiding a SECURITY DEFINER view. The function is the only privileged layer.
create or replace function public.marketplace_public_vendor_directory()
returns table (
  id uuid,
  slug text,
  display_name text,
  description text,
  logo_url text,
  banner_url text,
  country text,
  rating numeric,
  review_count integer,
  product_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    v.id,
    v.slug,
    v.display_name,
    v.description,
    v.logo_url,
    v.banner_url,
    v.country,
    v.rating,
    v.review_count,
    v.product_count,
    v.created_at
  from public.vendors v
  where v.status = 'APPROVED'
    and v.deleted_at is null;
$$;

revoke all on function public.marketplace_public_vendor_directory() from public;
grant execute on function public.marketplace_public_vendor_directory() to anon, authenticated;

drop view if exists public.public_vendor_profiles;
create view public.public_vendor_profiles
with (security_invoker = true)
as
select * from public.marketplace_public_vendor_directory();

grant select on public.public_vendor_profiles to anon, authenticated;

-- Pin search_path for helpers without one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.marketplace_slugify(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Re-assert the trusted RPC surface after the revokes above.
grant execute on function public.create_vendor_application(jsonb) to authenticated;
grant execute on function public.request_vendor_payout(uuid) to authenticated;
grant execute on function public.process_vendor_payout(uuid, public.vendor_payout_status, text, text) to authenticated;
grant execute on function public.process_vendor_return(uuid, public.vendor_return_status, numeric, text) to authenticated;
grant execute on function public.log_vendor_audit(uuid, text, text, jsonb) to authenticated;
