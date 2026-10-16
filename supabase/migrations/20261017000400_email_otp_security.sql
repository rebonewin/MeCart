-- ============================================================================
-- MeCart Email OTP — app-layer security hardening
-- ----------------------------------------------------------------------------
-- Builds on 20261017000200_email_otp_verification + 20261017000300 hardening:
--   * account_status gains the 'email_verified' stage (verified e-mail, no
--     password yet — produced by the OTP-first registration funnel)
--   * per-IP request throttling and a resend that restarts the expiry window
--   * single-use verified requests (replay-proof) and brute-force lockout
--     after 5 failed attempts, mirrored onto the profile counters
--   * ledger RPCs callable by the service role only (server actions)
--   * handle_new_user keeps guest / password accounts out of the verification
--     funnel while OTP-first accounts start as pending_verification
-- ============================================================================

-- ----------------------------------------------------------------------------
-- account status: pending_verification -> email_verified -> active (+ suspended)
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('pending_verification', 'email_verified', 'active', 'suspended'));

comment on column public.profiles.email_verified_at is 'Time when the e-mail was verified through Supabase Auth.';
comment on column public.profiles.last_otp_sent_at is 'Last time a verification code was issued for this e-mail.';
comment on column public.profiles.verification_attempts is 'Attempts counted against the active OTP request.';
comment on column public.profiles.failed_otp_attempts is 'Failed OTP attempt counter (brute-force signal).';
comment on column public.profiles.account_status is 'pending_verification -> email_verified -> active; suspended locks sign-in.';

-- ----------------------------------------------------------------------------
-- helpers
-- ----------------------------------------------------------------------------
create index if not exists idx_email_otp_requests_ip
  on public.email_otp_requests (client_ip, requested_at desc)
  where client_ip is not null;

create index if not exists idx_email_otp_requests_failed
  on public.email_otp_requests (requested_at desc)
  where verification_attempts > 0 and is_verified = false;

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
    and is_verified = false
  order by requested_at desc
  limit 1
$$;

-- True when the auth user already has a password configured. Lets the app
-- route OTP-first accounts to password creation after e-mail verification.
create or replace function public.user_has_password(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = p_user_id
      and u.encrypted_password is not null
      and length(u.encrypted_password) > 0
  )
$$;

-- ----------------------------------------------------------------------------
-- create (or resend) the single active OTP request for a mailbox + purpose.
-- A resend restarts both the 60s cooldown clock and the expiry window because
-- Supabase issues a brand-new code (the previous code stops working).
-- ----------------------------------------------------------------------------
drop function if exists public.create_email_otp_request(text, text, integer, integer);
create or replace function public.create_email_otp_request(
  p_email text,
  p_purpose text,
  p_expires_in_seconds integer default 600,
  p_max_resend integer default 5,
  p_client_ip text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.email_otp_requests%rowtype;
  v_count integer;
  v_ip_count integer;
  v_last public.email_otp_requests%rowtype;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'Email is required';
  end if;
  if p_purpose not in ('registration', 'email_verification', 'password_reset') then
    raise exception 'Invalid OTP purpose';
  end if;
  if p_expires_in_seconds not between 30 and 3600 then
    raise exception 'Invalid expiry';
  end if;

  -- Throttle: maximum new requests per mailbox in a rolling window.
  select count(*) into v_count
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and requested_at > now() - interval '30 minutes';

  if v_count >= 3 then
    raise exception 'Too many verification requests. Please try again later.';
  end if;

  -- Throttle: maximum requests per client IP in a rolling window.
  if coalesce(btrim(p_client_ip), '') <> '' then
    select count(*) into v_ip_count
    from public.email_otp_requests
    where client_ip = btrim(p_client_ip)
      and requested_at > now() - interval '1 hour';

    if v_ip_count >= 15 then
      raise exception 'Too many verification requests from this network. Please try again later.';
    end if;
  end if;

  -- Reuse the single active request for this mailbox when it exists.
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
      requested_at = now(),
      expires_at = now() + make_interval(secs => p_expires_in_seconds),
      client_ip = coalesce(nullif(btrim(coalesce(p_client_ip, '')), ''), client_ip),
      last_error = null
    where id = v_last.id
    returning * into v_request;
  else
    insert into public.email_otp_requests (email, purpose, expires_at, client_ip)
    values (
      lower(trim(p_email)),
      p_purpose,
      now() + make_interval(secs => p_expires_in_seconds),
      nullif(btrim(coalesce(p_client_ip, '')), '')
    )
    returning * into v_request;
  end if;

  update public.profiles
  set last_otp_sent_at = now(), updated_at = now()
  where lower(coalesce(email, '')) = lower(trim(p_email));

  return jsonb_build_object(
    'request_id', v_request.id,
    'expires_at', v_request.expires_at,
    'resend_count', v_request.resend_count,
    'is_resend', found
  );
end $$;

-- ----------------------------------------------------------------------------
-- apply the outcome of a real Supabase verifyOtp() call to the ledger and the
-- profile counters. Success consumes the request (single-use); exhausting the
-- attempt budget locks it until a new code is requested.
-- ----------------------------------------------------------------------------
drop function if exists public.verify_email_otp_request(text, text, boolean, text);
create or replace function public.verify_email_otp_request(
  p_email text,
  p_purpose text,
  p_success boolean,
  p_error text default null,
  p_max_attempts integer default 5
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.email_otp_requests%rowtype;
  v_attempts integer;
  v_locked boolean := false;
begin
  select * into v_request
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null
    and is_verified = false
  order by requested_at desc
  limit 1;

  if not found then
    raise exception 'No active verification request. Please request a new code.';
  end if;

  if v_request.verification_attempts >= p_max_attempts then
    update public.email_otp_requests set consumed_at = now() where id = v_request.id;
    raise exception 'Too many verification attempts. Please request a new code.';
  end if;

  v_attempts := v_request.verification_attempts + 1;

  if p_success then
    update public.email_otp_requests
    set
      verification_attempts = v_attempts,
      is_verified = true,
      verified_at = now(),
      consumed_at = now(),
      last_error = null
    where id = v_request.id;

    update public.profiles
    set
      email_verified_at = coalesce(email_verified_at, now()),
      verification_attempts = greatest(verification_attempts, v_attempts),
      failed_otp_attempts = 0,
      account_status = case
        when account_status = 'pending_verification' then 'email_verified'
        else account_status
      end,
      updated_at = now()
    where lower(coalesce(email, '')) = lower(trim(p_email));
  else
    v_locked := v_attempts >= p_max_attempts;

    update public.email_otp_requests
    set
      verification_attempts = v_attempts,
      consumed_at = case when v_locked then now() else consumed_at end,
      last_error = coalesce(p_error, 'Verification failed')
    where id = v_request.id;

    update public.profiles
    set
      failed_otp_attempts = failed_otp_attempts + 1,
      verification_attempts = greatest(verification_attempts, v_attempts),
      updated_at = now()
    where lower(coalesce(email, '')) = lower(trim(p_email));
  end if;

  return jsonb_build_object(
    'request_id', v_request.id,
    'attempts', v_attempts,
    'remaining_attempts', greatest(0, p_max_attempts - v_attempts),
    'locked', v_locked,
    'verified', p_success,
    'expires_at', v_request.expires_at
  );
end $$;

-- ----------------------------------------------------------------------------
-- access control: ledger writes stay server-side (service role only)
-- ----------------------------------------------------------------------------
revoke execute on function public.create_email_otp_request(text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.create_email_otp_request(text, text, integer, integer, text) to service_role;

revoke execute on function public.verify_email_otp_request(text, text, boolean, text, integer) from public, anon, authenticated;
grant execute on function public.verify_email_otp_request(text, text, boolean, text, integer) to service_role;

revoke execute on function public.consumed_email_otp_request(text, text) from anon, authenticated;
grant execute on function public.consumed_email_otp_request(text, text) to service_role;

revoke execute on function public.pending_otp_request(text, text) from anon, authenticated;
grant execute on function public.pending_otp_request(text, text) to service_role;

revoke execute on function public.user_has_password(uuid) from public, anon, authenticated;
grant execute on function public.user_has_password(uuid) to service_role;

-- ----------------------------------------------------------------------------
-- user provisioning: keep guest + password accounts out of the OTP funnel
-- while OTP-first accounts start as pending_verification.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, username, avatar_url, role, account_status,
    email_verified_at, verification_attempts, failed_otp_attempts, is_active
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
      -- Guest (anonymous) sessions never pass through verification.
      when new.is_anonymous then 'active'
      -- Accounts created with a password and a confirmed e-mail stay usable.
      when new.encrypted_password is not null and new.email_confirmed_at is not null then 'active'
      -- OTP-first sign-ups (and password accounts awaiting confirmation).
      else 'pending_verification'
    end,
    new.email_confirmed_at,
    0,
    0,
    true
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
