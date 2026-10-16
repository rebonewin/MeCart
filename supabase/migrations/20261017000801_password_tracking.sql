alter table public.profiles
  add column if not exists password_set_at timestamptz;

create or replace function public.track_password_set()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (old.encrypted_password is distinct from new.encrypted_password)
     and new.encrypted_password is not null
     and length(new.encrypted_password) > 0 then
    update public.profiles
    set password_set_at = now(), updated_at = now()
    where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_password_changed on auth.users;
create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.track_password_set();

-- accounts created with a password should be marked immediately
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, username, avatar_url, role, account_status,
    email_verified_at, verification_attempts, failed_otp_attempts, is_active,
    password_set_at,
    phone_number, country_code, phone_verified, phone_verified_at, phone_last_login,
    otp_attempts, last_otp_sent_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'guest-' || substr(new.id::text, 1, 8)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'customer',
    case
      when new.is_anonymous then 'active'
      when new.encrypted_password is not null and new.email_confirmed_at is not null then 'active'
      else 'pending_verification'
    end,
    new.email_confirmed_at,
    0,
    0,
    true,
    null,
    new.phone,
    nullif(new.raw_user_meta_data->>'country_code',''),
    (new.phone is not null and (new.phone_confirmed_at is not null)),
    new.phone_confirmed_at,
    case when new.phone is not null and new.phone_confirmed_at is not null then now() else null end,
    0,
    now()
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

create or replace function public.user_has_password(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select password_set_at is not null from public.profiles where id = p_user_id), false);
$$;