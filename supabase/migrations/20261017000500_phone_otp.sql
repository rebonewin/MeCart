-- MeCart Mobile OTP authentication support

alter table public.profiles
  add column if not exists phone_number text,
  add column if not exists country_code text,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_last_login timestamptz,
  add column if not exists otp_attempts integer not null default 0,
  add column if not exists last_otp_sent_at timestamptz;

create unique index if not exists uq_profiles_phone_number
  on public.profiles (phone_number)
  where phone_number is not null and deleted_at is null;

create table if not exists public.phone_otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  user_id uuid references auth.users (id) on delete cascade,
  purpose text not null check (purpose in ('login', 'registration', 'phone_change', 'phone_verification')),
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

create index if not exists idx_phone_otp_requests_phone_purpose
  on public.phone_otp_requests (phone_number, purpose, requested_at desc);

alter table public.phone_otp_requests enable row level security;

drop policy if exists phone_otp_requests_self_read on public.phone_otp_requests;
create policy phone_otp_requests_self_read
  on public.phone_otp_requests for select
  to authenticated
  using (phone_number = coalesce((select phone from auth.users where id = auth.uid()), ''));

drop policy if exists phone_otp_requests_staff_read on public.phone_otp_requests;
create policy phone_otp_requests_staff_read
  on public.phone_otp_requests for select
  to authenticated
  using (public.is_staff());

drop policy if exists phone_otp_requests_insert_block on public.phone_otp_requests;
create policy phone_otp_requests_insert_block
  on public.phone_otp_requests for insert
  to anon, authenticated
  with check (false);

create or replace function public.create_phone_otp_request(
  p_phone_number text,
  p_purpose text default 'login',
  p_expires_in_seconds integer default 300,
  p_max_resend integer default 5
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.phone_otp_requests%rowtype;
  v_count integer;
  v_last public.phone_otp_requests%rowtype;
begin
  if p_phone_number is null or btrim(p_phone_number) = '' then
    raise exception 'Phone number is required';
  end if;
  if p_purpose not in ('login', 'registration', 'phone_change', 'phone_verification') then
    raise exception 'Invalid OTP purpose';
  end if;
  if p_expires_in_seconds not between 30 and 600 then
    raise exception 'Invalid expiry';
  end if;

  select count(*) into v_count
  from public.phone_otp_requests
  where phone_number = trim(p_phone_number)
    and purpose = p_purpose
    and requested_at > now() - interval '30 minutes';

  if v_count >= 5 then
    raise exception 'Too many verification requests. Please try again later.';
  end if;

  select * into v_last
  from public.phone_otp_requests
  where phone_number = trim(p_phone_number)
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
    update public.phone_otp_requests
    set resend_count = resend_count + 1, last_error = null
    where id = v_last.id
    returning * into v_request;
  else
    insert into public.phone_otp_requests (phone_number, purpose, expires_at)
    values (trim(p_phone_number), p_purpose, now() + make_interval(secs => p_expires_in_seconds))
    returning * into v_request;
  end if;

  update public.profiles
  set last_otp_sent_at = now(), updated_at = now()
  where phone_number = trim(p_phone_number);

  return jsonb_build_object(
    'request_id', v_request.id,
    'expires_at', v_request.expires_at,
    'resend_count', v_request.resend_count
  );
end $$;

grant execute on function public.create_phone_otp_request(text, text, integer, integer) to anon, authenticated, service_role;

create or replace function public.verify_phone_otp_request(
  p_phone_number text,
  p_purpose text,
  p_success boolean,
  p_error text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.phone_otp_requests%rowtype;
begin
  select * into v_request
  from public.phone_otp_requests
  where phone_number = trim(p_phone_number)
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null
  order by requested_at desc
  limit 1;

  if not found then
    raise exception 'No active verification request. Please request a new code.';
  end if;

  if p_success then
    update public.phone_otp_requests
    set verification_attempts = verification_attempts + 1,
        is_verified = true,
        verified_at = now(),
        last_error = null
    where id = v_request.id;
  else
    update public.phone_otp_requests
    set verification_attempts = verification_attempts + 1,
        last_error = p_error
    where id = v_request.id;
  end if;

  update public.profiles
  set otp_attempts = case when p_success then 0 else otp_attempts + 1 end,
      updated_at = now()
  where phone_number = trim(p_phone_number);

  return jsonb_build_object(
    'request_id', v_request.id,
    'attempts', v_request.verification_attempts + 1,
    'expires_at', v_request.expires_at
  );
end $$;

grant execute on function public.verify_phone_otp_request(text, text, boolean, text) to anon, authenticated, service_role;