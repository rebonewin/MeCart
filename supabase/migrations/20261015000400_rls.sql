-- ============================================================================
-- MeCart Enterprise — 0004 Row Level Security
-- Roles: admin / manager (staff), customer, guest (anon)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- grants (Data API access for anon / authenticated / service_role)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles','roles','permissions','role_permissions','admins','customers',
    'categories','sub_categories','brands','products','product_images','product_variants',
    'inventory','inventory_logs','addresses','carts','cart_items','wishlists',
    'coupons','coupon_usage','orders','order_items','payments','transactions',
    'reviews','notifications','activity_logs','audit_logs','media_library',
    'cms_pages','seo','analytics_events','shipping_zones','shipping_methods',
    'tax_rules','settings','theme_settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- catalog: public read
-- ---------------------------------------------------------------------------
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (deleted_at is null and is_active = true);

drop policy if exists sub_categories_public_read on public.sub_categories;
create policy sub_categories_public_read on public.sub_categories
  for select to anon, authenticated
  using (deleted_at is null and is_active = true);

drop policy if exists brands_public_read on public.brands;
create policy brands_public_read on public.brands
  for select to anon, authenticated
  using (deleted_at is null and is_active = true);

-- staff can read inactive catalog rows in the admin panel
drop policy if exists categories_staff_read on public.categories;
create policy categories_staff_read on public.categories
  for select to authenticated using (public.is_staff());
drop policy if exists sub_categories_staff_read on public.sub_categories;
create policy sub_categories_staff_read on public.sub_categories
  for select to authenticated using (public.is_staff());
drop policy if exists brands_staff_read on public.brands;
create policy brands_staff_read on public.brands
  for select to authenticated using (public.is_staff());

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select to anon, authenticated
  using (deleted_at is null and status = 'ACTIVE');

drop policy if exists products_staff_read on public.products;
create policy products_staff_read on public.products
  for select to authenticated
  using (public.is_staff());

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and p.deleted_at is null and p.status = 'ACTIVE'
  ));

drop policy if exists product_variants_public_read on public.product_variants;
create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated
  using (is_active = true and exists (
    select 1 from public.products p
    where p.id = product_id and p.deleted_at is null and p.status = 'ACTIVE'
  ));

-- staff write on catalog
do $$
declare
  t text;
  tables text[] := array['categories','sub_categories','brands','products','product_images','product_variants'];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %s_staff_insert on public.%I', t, t);
    execute format('create policy %s_staff_insert on public.%I for insert to authenticated with check (public.is_staff())', t, t);
    execute format('drop policy if exists %s_staff_update on public.%I', t, t);
    execute format('create policy %s_staff_update on public.%I for update to authenticated using (public.is_staff())', t, t);
    execute format('drop policy if exists %s_staff_delete on public.%I', t, t);
    execute format('create policy %s_staff_delete on public.%I for delete to authenticated using (public.is_admin())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- roles / permissions / role_permissions / admins
-- ---------------------------------------------------------------------------
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles for select to authenticated using (true);
drop policy if exists roles_admin_write on public.roles;
create policy roles_admin_write on public.roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists permissions_read on public.permissions;
create policy permissions_read on public.permissions for select to authenticated using (true);
drop policy if exists permissions_admin_write on public.permissions;
create policy permissions_admin_write on public.permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select to authenticated using (true);
drop policy if exists role_permissions_admin_write on public.role_permissions;
create policy role_permissions_admin_write on public.role_permissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admins_read on public.admins;
create policy admins_read on public.admins for select to authenticated using (public.is_staff());
drop policy if exists admins_admin_write on public.admins;
create policy admins_admin_write on public.admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
drop policy if exists customers_own_read on public.customers;
create policy customers_own_read on public.customers
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists customers_own_update on public.customers;
create policy customers_own_update on public.customers
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists customers_staff_write on public.customers;
create policy customers_staff_write on public.customers
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
drop policy if exists addresses_own_all on public.addresses;
create policy addresses_own_all on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_staff())
  with check (user_id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- carts / cart_items / wishlists
-- ---------------------------------------------------------------------------
drop policy if exists carts_own_all on public.carts;
create policy carts_own_all on public.carts
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_staff())
  with check (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists cart_items_own_all on public.cart_items;
create policy cart_items_own_all on public.cart_items
  for all to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or public.is_staff())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_id and (c.user_id = (select auth.uid()) or public.is_staff())
  ));

drop policy if exists wishlists_own_all on public.wishlists;
create policy wishlists_own_all on public.wishlists
  for all to authenticated
  using (user_id = (select auth.uid()) or public.is_staff())
  with check (user_id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- coupons / coupon_usage
-- ---------------------------------------------------------------------------
drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select to authenticated
  using ((active = true and deleted_at is null) or public.is_staff());

drop policy if exists coupons_staff_write on public.coupons;
create policy coupons_staff_write on public.coupons
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists coupon_usage_read on public.coupon_usage;
create policy coupon_usage_read on public.coupon_usage
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- orders / order_items / payments / transactions
-- ---------------------------------------------------------------------------
drop policy if exists orders_own_read on public.orders;
create policy orders_own_read on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists orders_own_insert on public.orders;
create policy orders_own_insert on public.orders
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists orders_staff_write on public.orders;
create policy orders_staff_write on public.orders
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_staff())
  ));

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or public.is_staff())
  ));

drop policy if exists payments_staff_update on public.payments;
create policy payments_staff_update on public.payments
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists transactions_read on public.transactions;
create policy transactions_read on public.transactions
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_staff()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews
  for select to anon, authenticated
  using (status = 'APPROVED' or user_id = (select auth.uid()) or public.is_staff());

drop policy if exists reviews_own_insert on public.reviews;
create policy reviews_own_insert on public.reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists reviews_own_update on public.reviews;
create policy reviews_own_update on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists reviews_staff_delete on public.reviews;
create policy reviews_staff_delete on public.reviews
  for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists notifications_staff_insert on public.notifications;
create policy notifications_staff_insert on public.notifications
  for insert to authenticated
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- activity_logs / audit_logs
-- ---------------------------------------------------------------------------
drop policy if exists activity_logs_own_read on public.activity_logs;
create policy activity_logs_own_read on public.activity_logs
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

drop policy if exists activity_logs_insert on public.activity_logs;
create policy activity_logs_insert on public.activity_logs
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()) or public.is_staff());

drop policy if exists audit_logs_staff_read on public.audit_logs;
create policy audit_logs_staff_read on public.audit_logs
  for select to authenticated
  using (public.is_staff());

drop policy if exists audit_logs_staff_insert on public.audit_logs;
create policy audit_logs_staff_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- media_library
-- ---------------------------------------------------------------------------
drop policy if exists media_library_read on public.media_library;
create policy media_library_read on public.media_library
  for select to anon, authenticated using (true);

drop policy if exists media_library_insert on public.media_library;
create policy media_library_insert on public.media_library
  for insert to authenticated
  with check (uploaded_by = (select auth.uid()) or public.is_staff());

drop policy if exists media_library_update on public.media_library;
create policy media_library_update on public.media_library
  for update to authenticated
  using (uploaded_by = (select auth.uid()) or public.is_staff());

drop policy if exists media_library_delete on public.media_library;
create policy media_library_delete on public.media_library
  for delete to authenticated
  using (uploaded_by = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- cms_pages / seo
-- ---------------------------------------------------------------------------
drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_public_read on public.cms_pages
  for select to anon, authenticated
  using ((status = 'PUBLISHED' and deleted_at is null) or public.is_staff());

drop policy if exists cms_pages_staff_write on public.cms_pages;
create policy cms_pages_staff_write on public.cms_pages
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists seo_public_read on public.seo;
create policy seo_public_read on public.seo
  for select to anon, authenticated using (true);

drop policy if exists seo_staff_write on public.seo;
create policy seo_staff_write on public.seo
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert on public.analytics_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

drop policy if exists analytics_events_staff_read on public.analytics_events;
create policy analytics_events_staff_read on public.analytics_events
  for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- inventory / inventory_logs
-- ---------------------------------------------------------------------------
drop policy if exists inventory_staff_all on public.inventory;
create policy inventory_staff_all on public.inventory
  for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists inventory_logs_staff_read on public.inventory_logs;
create policy inventory_logs_staff_read on public.inventory_logs
  for select to authenticated
  using (public.is_staff());

drop policy if exists inventory_logs_staff_insert on public.inventory_logs;
create policy inventory_logs_staff_insert on public.inventory_logs
  for insert to authenticated
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- shipping / tax
-- ---------------------------------------------------------------------------
drop policy if exists shipping_zones_read on public.shipping_zones;
create policy shipping_zones_read on public.shipping_zones
  for select to anon, authenticated using (is_active = true or public.is_staff());
drop policy if exists shipping_zones_staff_write on public.shipping_zones;
create policy shipping_zones_staff_write on public.shipping_zones
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists shipping_methods_read on public.shipping_methods;
create policy shipping_methods_read on public.shipping_methods
  for select to anon, authenticated using (is_active = true or public.is_staff());
drop policy if exists shipping_methods_staff_write on public.shipping_methods;
create policy shipping_methods_staff_write on public.shipping_methods
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists tax_rules_read on public.tax_rules;
create policy tax_rules_read on public.tax_rules
  for select to anon, authenticated using (is_active = true or public.is_staff());
drop policy if exists tax_rules_staff_write on public.tax_rules;
create policy tax_rules_staff_write on public.tax_rules
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- settings / theme_settings
-- ---------------------------------------------------------------------------
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select to anon, authenticated using (is_public = true or public.is_staff());

drop policy if exists settings_staff_write on public.settings;
create policy settings_staff_write on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists theme_settings_read on public.theme_settings;
create policy theme_settings_read on public.theme_settings
  for select to anon, authenticated using (is_public = true or public.is_staff());

drop policy if exists theme_settings_staff_write on public.theme_settings;
create policy theme_settings_staff_write on public.theme_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
