-- ============================================================================
-- MeCart — SMS OTP: block guard across new requests
-- ----------------------------------------------------------------------------
-- A phone that has exhausted its verification attempts must stay blocked for
-- the block window even when the user starts a brand-new OTP request. The
-- original guard only looked at profiles.blocked_until, which does not exist
-- for phones that never completed a login. This migration keeps the block
-- state authoritative on the ledger and re-checks it on every request.
-- ============================================================================

create or replace function public.create_phone_otp_request(
  p_phone_number text,
  p_purpose text default 'login',
  p_expires_in_seconds integer default 300,
  p_max_resend integer default 3,
  p_client_ip text default null,
  p_device_id text default null,
  p_provider text default 'twilio',
  p_signature_nonce text default null,
  p_country_code text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_request public.phone_otp_requests%rowtype;
  v_count integer;
  v_ip_count integer;
  v_device_count integer;
  v_last public.phone_otp_requests%rowtype;
  v_blocked timestamptz;
  v_request_blocked timestamptz;
begin
  if p_phone_number is null or btrim(p_phone_number) = '' then
    raise exception 'Phone number is required';
  end if;
  if trim(p_phone_number) !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Enter a valid E.164 phone number';
  end if;
  if p_purpose not in ('login', 'registration', 'phone_verification', 'phone_change', 'link', 'change', 'reverify') then
    raise exception 'Invalid OTP purpose';
  end if;
  if p_expires_in_seconds not between 60 and 600 then
    raise exception 'Invalid expiry';
  end if;
  if p_max_resend not between 0 and 10 then
    raise exception 'Invalid resend limit';
  end if;

  -- blocked profile numbers stay blocked until the block window passes
  select blocked_until into v_blocked
  from public.profiles
  where phone_number = trim(p_phone_number) and deleted_at is null
  limit 1;

  if v_blocked is not null and v_blocked > now() then
    raise exception 'Too many wrong codes. Try again later.';
  end if;

  -- blocked ledger numbers stay blocked too (login flows have no profile yet)
  select r.blocked_until into v_request_blocked
  from public.phone_otp_requests r
  where r.phone_number = trim(p_phone_number)
    and r.blocked_until is not null
    and r.blocked_until > now()
  order by r.blocked_until desc
  limit 1;

  if v_request_blocked is not null then
    raise exception 'Too many wrong codes. Try again later.';
  end if;

  select count(*) into v_count
  from public.phone_otp_requests
  where phone_number = trim(p_phone_number)
    and purpose = p_purpose
    and requested_at > now() - interval '30 minutes';

  if v_count >= 5 then
    raise exception 'Too many verification requests. Please try again later.';
  end if;

  if p_client_ip is not null then
    select count(*) into v_ip_count
    from public.phone_otp_requests
    where client_ip = p_client_ip
      and requested_at > now() - interval '60 minutes';

    if v_ip_count >= 20 then
      raise exception 'Too many requests from this network. Please try again later.';
    end if;
  end if;

  if p_device_id is not null then
    select count(*) into v_device_count
    from public.phone_otp_requests
    where device_id = p_device_id
      and requested_at > now() - interval '60 minutes';

    if v_device_count >= 10 then
      raise exception 'Too many requests from this device. Please try again later.';
    end if;
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

  if found then
    if v_last.blocked_until is not null and v_last.blocked_until > now() then
      raise exception 'Too many wrong codes. Try again later.';
    end if;

    if v_last.resend_count >= p_max_resend then
      raise exception 'Maximum OTP resend attempts reached. Please request a new code later.';
    end if;

    if v_last.requested_at > now() - interval '60 seconds' then
      raise exception 'Please wait % seconds before requesting another code.',
        greatest(1, ceil(extract(epoch from (v_last.requested_at + interval '60 seconds' - now())))::int);
    end if;

    update public.phone_otp_requests
    set resend_count = resend_count + 1,
        expires_at = now() + make_interval(secs => p_expires_in_seconds),
        client_ip = coalesce(p_client_ip, client_ip),
        device_id = coalesce(p_device_id, device_id),
        provider = coalesce(p_provider, provider),
        signature_nonce = coalesce(p_signature_nonce, signature_nonce),
        country_code = coalesce(p_country_code, country_code),
        last_error = null
    where id = v_last.id
    returning * into v_request;
  else
    insert into public.phone_otp_requests (
      phone_number, purpose, client_ip, device_id, provider,
      signature_nonce, country_code, expires_at
    )
    values (
      trim(p_phone_number), p_purpose, p_client_ip, p_device_id,
      coalesce(p_provider, 'twilio'), p_signature_nonce, p_country_code,
      now() + make_interval(secs => p_expires_in_seconds)
    )
    returning * into v_request;
  end if;

  update public.profiles
  set last_otp_sent_at = now(),
      otp_last_sent = now(),
      updated_at = now()
  where phone_number = trim(p_phone_number) and deleted_at is null;

  return jsonb_build_object(
    'request_id', v_request.id,
    'expires_at', v_request.expires_at,
    'resend_count', v_request.resend_count,
    'max_resend', p_max_resend,
    'cooldown_seconds', 60,
    'provider', v_request.provider
  );
end $$;
