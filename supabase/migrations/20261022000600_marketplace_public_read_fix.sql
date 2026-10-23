-- Public marketplace read-path correction.
--
-- RLS policies cannot safely use `exists (select ... from public.vendors)` for
-- anonymous visitors: the subquery is itself filtered by vendors RLS, which has
-- no public select policy. The result was that active stores and vendor-owned
-- products disappeared from the storefront. These security-definer predicates
-- perform only the narrow publication check and expose nothing else.

create or replace function public.marketplace_public_vendor_exists(p_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vendors v
    where v.id = p_vendor_id
      and v.status = 'APPROVED'
      and v.deleted_at is null
  );
$$;

revoke all on function public.marketplace_public_vendor_exists(uuid) from public;
grant execute on function public.marketplace_public_vendor_exists(uuid) to anon, authenticated;

create or replace function public.marketplace_public_store_exists(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.stores s
    join public.vendors v on v.id = s.vendor_id
    where s.id = p_store_id
      and s.status = 'ACTIVE'
      and s.deleted_at is null
      and v.status = 'APPROVED'
      and v.deleted_at is null
  );
$$;

revoke all on function public.marketplace_public_store_exists(uuid) from public;
grant execute on function public.marketplace_public_store_exists(uuid) to anon, authenticated;

drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'ACTIVE'
    and public.marketplace_public_vendor_exists(vendor_id)
  );

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (
    deleted_at is null
    and status = 'ACTIVE'
    and approval_status = 'APPROVED'
    and (vendor_id is null or public.marketplace_public_vendor_exists(vendor_id))
    and (store_id is null or public.marketplace_public_store_exists(store_id))
  );
