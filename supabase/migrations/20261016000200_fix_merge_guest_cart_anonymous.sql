-- fix merge_guest_cart: detect anonymous users via auth.users.is_anonymous
-- raw_app_meta_data no longer carries the flag (it is empty for anonymous
-- users), which made every merge fail with 'Only anonymous carts can be
-- merged' and silently dropped guest carts at sign-in.
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

  select coalesce(u.is_anonymous, false)
    into from_is_anonymous
    from auth.users u where u.id = p_from_user;

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
