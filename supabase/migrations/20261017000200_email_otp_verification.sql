-- ============================================================================
-- MeCart Email OTP verification support
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profile fields storing verification state
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists email_verified_at timestamptz,
  add column if not exists verification_attempts integer not null default 0,
  add column if not exists last_otp_sent_at timestamptz,
  add column if not exists failed_otp_attempts integer not null default 0,
  add column if not exists account_status text not null default 'pending_verification'
    check (account_status in ('pending_verification', 'active', 'suspended'));

comment on column public.profiles.email_verified_at is 'Time when e-mail was verified through Supabase Auth.';
comment on column public.profiles.account_status is 'pending_verification/account locked until password creation, active after successful login lifecycle.';

-- Existing accounts created by the legacy flow remain usable.
update public.profiles
set
  account_status = 'active',
  email_verified_at = coalesce(email_verified_at, created_at)
where is_active = true;

-- ----------------------------------------------------------------------------
-- OTP request ledger used for throttling / replay / brute-force protection
-- ----------------------------------------------------------------------------
create table if not exists public.email_otp_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  purpose text not null check (purpose in ('registration', 'password_reset')),
  client_ip text,
  requested_at timestamptz not null default now(),
  expires_at timestamptz not null,
  resend_count integer not null default 0,
  verification_attempts integer not null default 0,
  is_verified boolean not null default false,
  verified_at timestamptz,
  consumed_at timestamptz,
  last_error text
);

create index if not exists idx_email_otp_requests_email_purpose
  on public.email_otp_requests (lower(email), purpose, requested_at desc);

alter table public.email_otp_requests enable row level security;

drop policy if exists email_otp_requests_self_read on public.email_otp_requests;
create policy email_otp_requests_self_read
  on public.email_otp_requests for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.email(), '')));

drop policy if exists email_otp_requests_staff_read on public.email_otp_requests;
create policy email_otp_requests_staff_read
  on public.email_otp_requests for select
  to authenticated
  using (public.is_staff());

drop policy if exists email_otp_requests_insert_block on public.email_otp_requests;
create policy email_otp_requests_insert_block
  on public.email_otp_requests for insert
  to anon, authenticated
  with check (false);

-- ----------------------------------------------------------------------------
-- helper functions
-- ----------------------------------------------------------------------------
create or replace function public.pending_otp_request(p_email text, p_purpose text)
returns public.email_otp_requests
language sql stable security definer set search_path = public
as $$
  select *
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null
  order by requested_at desc
  limit 1
$$;

create or replace function public.create_email_otp_request(
  p_email text,
  p_purpose text,
  p_expires_in_seconds integer default 600,
  p_max_resend integer default 3
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.email_otp_requests%rowtype;
  v_count integer;
  v_last public.email_otp_requests%rowtype;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email is required';
  end if;
  if p_expires_in_seconds not between 30 and 3600 then
    raise exception 'Invalid expiry';
  end if;

  -- Throttle: maximum requests in rolling window.
  select count(*) into v_count
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and requested_at > now() - interval '30 minutes';

  if v_count >= 3 then
    raise exception 'Too many verification requests. Please try again later.';
  end if;

  -- Enforce resend spacing for the latest active request.
  select * into v_last
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and is_verified = false
    and consumed_at is null
    and expires_at > now()
  order by requested_at desc
  limit 1;

  if found and v_last.resend_count >= p_max_resend then
    raise exception 'Maximum OTP resend attempts reached. Please wait before retrying.';
  end if;

  if found and v_last.requested_at > now() - interval '60 seconds' then
    raise exception 'Please wait before requesting another code.';
  end if;

  if found then
    update public.email_otp_requests
    set
      resend_count = resend_count + 1,
      last_error = null
    where id = v_last.id
    returning * into v_request;
  else
    insert into public.email_otp_requests (email, purpose, expires_at)
    values (trim(p_email), p_purpose, now() + make_interval(secs => p_expires_in_seconds))
    returning * into v_request;
  end if;

  return jsonb_build_object(
    'request_id', v_request.id,
    'expires_at', v_request.expires_at,
    'resend_count', v_request.resend_count
  );
end $$;

create or replace function public.verify_email_otp_request(
  p_email text,
  p_purpose text,
  p_success boolean,
  p_error text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.email_otp_requests%rowtype;
begin
  select * into v_request
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null
  order by requested_at desc
  limit 1;

  if not found then
    raise exception 'No active verification request. Please request a new code.';
  end if;

  if p_success then
    update public.email_otp_requests
    set
      verification_attempts = verification_attempts + 1,
      is_verified = true,
      verified_at = now(),
      last_error = null
    where id = v_request.id;
  else
    update public.email_otp_requests
    set
      verification_attempts = verification_attempts + 1,
      last_error = p_error
    where id = v_request.id;
  end if;

  return jsonb_build_object(
    'request_id', v_request.id,
    'attempts', v_request.verification_attempts + 1,
    'expires_at', v_request.expires_at
  );
end $$;

create or replace function public.consumed_email_otp_request(
  p_email text,
  p_purpose text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.email_otp_requests
  set consumed_at = now()
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null;
end $$;

revoke execute on function public.verify_email_otp_request(text, text, boolean, text) from anon;
grant execute on function public.verify_email_otp_request(text, text, boolean, text) to authenticated, service_role;

revoke execute on function public.consumed_email_otp_request(text, text) from anon;
grant execute on function public.consumed_email_otp_request(text, text) to authenticated, service_role;

revoke execute on function public.pending_otp_request(text, text) from anon;
grant execute on function public.pending_otp_request(text, text) to authenticated, service_role;

-- Registration begins before a session exists; use only rate-limited server-side actions.
grant execute on function public.create_email_otp_request(text, text, integer, integer) to anon, authenticated, service_role;
-- ---------------------------------------------------------------------------
-- Keep user provisioning aligned with email OTP verification.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, username, avatar_url, role, account_status,
    email_verified_at, verification_attempts, failed_otp_attempts
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'customer',
    case when new.email_confirmed_at is null then 'pending_verification' else 'active' end,
    new.email_confirmed_at,
    0,
    0
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
