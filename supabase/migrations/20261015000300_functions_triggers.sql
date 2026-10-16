-- ============================================================================
-- MeCart Enterprise — 0003 Functions & Triggers
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  t text;
  tables text[] := array[
    'profiles','roles','permissions','admins','customers','categories','sub_categories',
    'brands','products','product_variants','inventory','addresses','carts','cart_items',
    'coupons','orders','payments','reviews','media_library','cms_pages','seo',
    'shipping_zones','shipping_methods','tax_rules','settings','theme_settings'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists set_%s_updated_at on public.%I', t, t);
    execute format('create trigger set_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'manager'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false)
$$;

create or replace function public.has_permission(p_key text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id
    join public.permissions p on p.id = rp.permission_id
    where r.name = public.current_app_role()::text and p.key = p_key
  )
$$;

-- ---------------------------------------------------------------------------
-- new auth user -> profile + customer row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    nullif(new.raw_user_meta_data->>'username', ''),
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;

  insert into public.customers (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- product insert -> inventory row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_product()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.inventory (product_id, quantity)
  values (new.id, coalesce(new.stock, 0))
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_product_created on public.products;
create trigger on_product_created
  after insert on public.products
  for each row execute function public.handle_new_product();

-- ---------------------------------------------------------------------------
-- inventory quantity change -> sync products.stock + log
-- ---------------------------------------------------------------------------
create or replace function public.handle_inventory_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.quantity is distinct from old.quantity then
    if new.variant_id is null then
      update public.products set stock = new.quantity where id = new.product_id;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_inventory_updated on public.inventory;
create trigger on_inventory_updated
  after update on public.inventory
  for each row execute function public.handle_inventory_update();

-- ---------------------------------------------------------------------------
-- reviews -> aggregate product rating
-- ---------------------------------------------------------------------------
create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  pid uuid;
begin
  if tg_op = 'DELETE' then
    pid := old.product_id;
  else
    pid := new.product_id;
  end if;
  update public.products p
  set rating = coalesce(agg.avg_rating, 0),
      review_count = coalesce(agg.cnt, 0)
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*) as cnt
    from public.reviews
    where product_id = pid and status = 'APPROVED'
  ) agg
  where p.id = pid;
  return null;
end $$;

drop trigger if exists on_review_changed on public.reviews;
create trigger on_review_changed
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();

-- ---------------------------------------------------------------------------
-- orders -> customer aggregates
-- ---------------------------------------------------------------------------
create or replace function public.refresh_customer_stats()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  uid uuid;
begin
  if tg_op = 'DELETE' then
    uid := old.user_id;
  else
    uid := new.user_id;
  end if;

  if uid is not null then
    update public.customers c
    set total_orders = agg.cnt,
        total_spent = agg.total
    from (
      select count(*) as cnt, coalesce(sum(grand_total), 0) as total
      from public.orders
      where user_id = uid and deleted_at is null and payment_status = 'PAID'
    ) agg
    where c.user_id = uid;
  end if;
  return null;
end $$;

drop trigger if exists on_order_changed on public.orders;
create trigger on_order_changed
  after insert or update or delete on public.orders
  for each row execute function public.refresh_customer_stats();

-- ---------------------------------------------------------------------------
-- staff sync: profiles.role change -> admins registry
-- ---------------------------------------------------------------------------
create or replace function public.sync_admin_registry()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role in ('admin', 'manager') then
    insert into public.admins (user_id, level)
    values (new.id, case when new.role = 'admin' then 'admin' else 'manager' end)
    on conflict (user_id) do update set level = excluded.level, deleted_at = null;
  elsif old.role in ('admin', 'manager') and new.role not in ('admin', 'manager') then
    update public.admins set deleted_at = now() where user_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_profile_role_changed on public.profiles;
create trigger on_profile_role_changed
  after update of role on public.profiles
  for each row execute function public.sync_admin_registry();

-- ---------------------------------------------------------------------------
-- prevent privilege escalation via profile self-update
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_claims jsonb;
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  if coalesce(v_claims->>'role', '') = 'service_role' then
    return new;
  end if;

  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active or new.deleted_at is distinct from old.deleted_at)
     and not public.is_admin() then
    raise exception 'Only administrators can change role or account status';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- validate_coupon_code (callable by any signed-in user)
-- ---------------------------------------------------------------------------
create or replace function public.validate_coupon_code(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  c public.coupons%rowtype;
  v_discount numeric(12,2) := 0;
begin
  select * into c from public.coupons
  where upper(code) = upper(trim(p_code)) and active = true and deleted_at is null
  limit 1;

  if not found then
    raise exception 'Invalid coupon';
  end if;
  if c.starts_at is not null and c.starts_at > now() then
    raise exception 'Coupon not yet active';
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    raise exception 'Coupon expired';
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    raise exception 'Coupon limit reached';
  end if;
  if c.min_order_value is not null and p_subtotal < c.min_order_value then
    raise exception 'Minimum order value not met';
  end if;

  if c.discount_percent is not null then
    v_discount := v_discount + p_subtotal * (c.discount_percent / 100.0);
  end if;
  if c.discount_amount is not null then
    v_discount := v_discount + c.discount_amount;
  end if;
  if c.max_discount is not null and v_discount > c.max_discount then
    v_discount := c.max_discount;
  end if;
  if v_discount > p_subtotal then
    v_discount := p_subtotal;
  end if;

  return jsonb_build_object(
    'coupon_id', c.id,
    'code', c.code,
    'discount', round(v_discount, 2)
  );
end $$;

-- ---------------------------------------------------------------------------
-- merge_guest_cart: merge an anonymous cart into the signed-in user's cart
-- ---------------------------------------------------------------------------
create or replace function public.merge_guest_cart(p_from_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  to_user uuid := auth.uid();
  from_is_anonymous boolean;
  from_cart uuid;
  to_cart uuid;
begin
  if to_user is null then
    raise exception 'Not authenticated';
  end if;
  if p_from_user = to_user then
    return;
  end if;

  select coalesce((raw_app_meta_data->>'is_anonymous')::boolean, false)
    into from_is_anonymous
    from auth.users where id = p_from_user;

  if not coalesce(from_is_anonymous, false) then
    raise exception 'Only anonymous carts can be merged';
  end if;

  select id into from_cart from public.carts where user_id = p_from_user and status = 'ACTIVE' limit 1;
  if from_cart is null then
    return;
  end if;

  insert into public.carts (user_id, status) values (to_user, 'ACTIVE')
  on conflict (user_id) where status = 'ACTIVE' do nothing;

  select id into to_cart from public.carts where user_id = to_user and status = 'ACTIVE' limit 1;

  insert into public.cart_items (cart_id, product_id, variant_id, quantity, size, color, unit_price)
  select to_cart, ci.product_id, ci.variant_id, ci.quantity, ci.size, ci.color, ci.unit_price
  from public.cart_items ci
  where ci.cart_id = from_cart
  on conflict (cart_id, product_id, size, color)
  do update set quantity = public.cart_items.quantity + excluded.quantity;

  delete from public.cart_items where cart_id = from_cart;
  delete from public.carts where id = from_cart and user_id = p_from_user;

  insert into public.wishlists (user_id, product_id)
  select to_user, w.product_id from public.wishlists w where w.user_id = p_from_user
  on conflict (user_id, product_id) do nothing;
  delete from public.wishlists where user_id = p_from_user;
end $$;

-- ---------------------------------------------------------------------------
-- place_order (atomic checkout, callable by authenticated users)
-- ---------------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_items jsonb := coalesce(payload->'items', '[]'::jsonb);
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12,2) := 0;
  v_tax numeric(12,2);
  v_shipping numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_coupon jsonb;
  v_coupon_code text := nullif(payload->>'coupon_code', '');
  v_method public.payment_method := coalesce((payload->>'payment_method')::public.payment_method, 'COD');
  v_payment_status public.payment_status;
  v_order_status public.order_status;
  v_order_id uuid;
  v_order_number text := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
  v_invoice_number text := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(currval('public.order_number_seq')::text, 6, '0');
  v_txn_id text;
  v_pay_id text;
  v_total numeric(12,2);
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_array_length(v_items) = 0 then
    raise exception 'Cart is empty';
  end if;
  if nullif(trim(coalesce(payload->>'customer_name', '')), '') is null
     or nullif(trim(coalesce(payload->>'customer_email', '')), '') is null
     or nullif(trim(coalesce(payload->>'customer_phone', '')), '') is null
     or nullif(trim(coalesce(payload->>'shipping_address', '')), '') is null
     or nullif(trim(coalesce(payload->>'city', '')), '') is null
     or nullif(trim(coalesce(payload->>'zip', '')), '') is null then
    raise exception 'Missing checkout fields';
  end if;

  -- validate stock and compute subtotal from the database (never trust client prices)
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid and deleted_at is null
    for update;

    if not found then
      raise exception 'Product not found';
    end if;
    if v_product.status <> 'ACTIVE' then
      raise exception 'Product unavailable: %', v_product.name;
    end if;
    if v_product.stock < v_qty then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + v_product.final_price * v_qty;
  end loop;

  v_tax := round(v_subtotal * 0.08, 2);
  v_shipping := case when v_subtotal > 0 then 49 else 0 end;

  if v_coupon_code is not null then
    v_coupon := public.validate_coupon_code(v_coupon_code, v_subtotal);
    v_discount := (v_coupon->>'discount')::numeric;
  end if;

  v_total := round(v_subtotal + v_tax + v_shipping - v_discount, 2);
  if v_total < 0 then v_total := 0; end if;

  -- demo payment gateway: COD stays pending, everything else succeeds
  if v_method = 'COD' then
    v_payment_status := 'PENDING';
    v_order_status := 'PENDING';
  else
    v_payment_status := 'PAID';
    v_order_status := 'CONFIRMED';
  end if;

  insert into public.orders (
    order_number, invoice_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, billing_address, city, zip, subtotal, shipping_cost, tax, discount,
    grand_total, status, payment_status, coupon_code, notes
  ) values (
    v_order_number, v_invoice_number, v_user, payload->>'customer_name', payload->>'customer_email',
    payload->>'customer_phone', payload->>'shipping_address', nullif(payload->>'billing_address', ''),
    payload->>'city', payload->>'zip', v_subtotal, v_shipping, v_tax, v_discount,
    v_total, v_order_status, v_payment_status, v_coupon_code, nullif(payload->>'notes', '')
  ) returning id into v_order_id;

  -- order items + stock decrement
  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;

    insert into public.order_items (order_id, product_id, name, sku, quantity, size, color, price, total)
    values (
      v_order_id, v_product.id, v_product.name, v_product.sku, v_qty,
      nullif(v_item->>'size', ''), nullif(v_item->>'color', ''),
      v_product.final_price, round(v_product.final_price * v_qty, 2)
    );

    update public.inventory
    set quantity = quantity - v_qty
    where product_id = v_product.id and variant_id is null and quantity >= v_qty;

    if not found then
      -- fallback: keep product stock consistent even without inventory row
      update public.products set stock = stock - v_qty where id = v_product.id;
    end if;

    insert into public.inventory_logs (product_id, change, quantity_after, reason, reference, created_by)
    select v_product.id, -v_qty, coalesce(i.quantity, v_product.stock), 'order', v_order_number, v_user
    from public.inventory i where i.product_id = v_product.id and i.variant_id is null
    union all
    select v_product.id, -v_qty, v_product.stock - v_qty, 'order', v_order_number, v_user
    where not exists (select 1 from public.inventory i where i.product_id = v_product.id and i.variant_id is null);
  end loop;

  -- payment + transaction
  v_txn_id := 'TXN-' || extract(epoch from now())::bigint || '-' || floor(random() * 100000)::int;
  v_pay_id := 'PAY-' || extract(epoch from now())::bigint || '-' || floor(random() * 100000)::int;

  insert into public.payments (order_id, method, amount, status, transaction_id, payment_id, verified_at)
  values (v_order_id, v_method, v_total, v_payment_status, v_txn_id, v_pay_id,
          case when v_payment_status = 'PAID' then now() else null end);

  if v_payment_status = 'PAID' then
    insert into public.transactions (payment_id, order_id, user_id, type, amount, status, reference)
    select p.id, v_order_id, v_user, 'CHARGE', v_total, 'SUCCESS', v_txn_id
    from public.payments p where p.transaction_id = v_txn_id;
  end if;

  -- coupon usage
  if v_coupon is not null then
    update public.coupons set used_count = used_count + 1 where id = (v_coupon->>'coupon_id')::uuid;
    insert into public.coupon_usage (coupon_id, user_id, order_id, discount)
    values ((v_coupon->>'coupon_id')::uuid, v_user, v_order_id, v_discount);
  end if;

  -- customer notification
  insert into public.notifications (user_id, type, title, body, link, data)
  values (
    v_user, 'ORDER', 'Order placed',
    'Your order ' || v_order_number || ' has been placed successfully.',
    '/orders/' || v_order_id,
    jsonb_build_object('order_number', v_order_number, 'total', v_total)
  );

  -- activity log
  insert into public.activity_logs (user_id, action, resource, metadata)
  values (v_user, 'ORDER_CREATED', v_order_id::text,
          jsonb_build_object('order_number', v_order_number, 'total', v_total, 'payment_status', v_payment_status));

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'invoice_number', v_invoice_number,
    'payment_id', v_pay_id,
    'transaction_id', v_txn_id,
    'payment_status', v_payment_status,
    'order_status', v_order_status,
    'grand_total', v_total
  );
end $$;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke execute on function public.merge_guest_cart(uuid) from anon;
grant execute on function public.place_order(jsonb) to authenticated;
grant execute on function public.validate_coupon_code(text, numeric) to anon, authenticated;
grant execute on function public.merge_guest_cart(uuid) to authenticated;
