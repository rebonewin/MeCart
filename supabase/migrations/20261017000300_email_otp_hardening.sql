-- Harden OTP request purposes + anonymous auth profile creation.

alter table public.profiles
  alter column email drop not null;

alter table public.email_otp_requests
  drop constraint if exists email_otp_requests_purpose_check;

alter table public.email_otp_requests
  add constraint email_otp_requests_purpose_check
  check (purpose in ('registration', 'email_verification', 'password_reset'));

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
    case when new.email_confirmed_at is null then 'pending_verification' else 'active' end,
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

-- RPC is idempotent; recreate with normalized purpose validation.
create or replace function public.create_email_otp_request(
  p_email text,
  p_purpose text,
  p_expires_in_seconds integer default 600,
  p_max_resend integer default 5
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
  if p_purpose not in ('registration', 'email_verification', 'password_reset') then
    raise exception 'Invalid OTP purpose';
  end if;
  if p_expires_in_seconds not between 30 and 3600 then
    raise exception 'Invalid expiry';
  end if;

  select count(*) into v_count
  from public.email_otp_requests
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and requested_at > now() - interval '30 minutes';

  if v_count >= 5 then
    raise exception 'Too many verification requests. Please try again later.';
  end if;

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

  update public.profiles
  set last_otp_sent_at = now(), updated_at = now()
  where lower(email) = lower(trim(p_email));

  return jsonb_build_object(
    'request_id', v_request.id,
    'expires_at', v_request.expires_at,
    'resend_count', v_request.resend_count
  );
end $$;

grant execute on function public.create_email_otp_request(text, text, integer, integer) to anon, authenticated, service_role;