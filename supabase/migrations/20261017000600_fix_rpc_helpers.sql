drop function if exists public.pending_otp_request(text, text);
create or replace function public.pending_otp_request(p_email text, p_purpose text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select to_jsonb(t)
  from public.email_otp_requests t
  where lower(email) = lower(trim(p_email))
    and purpose = p_purpose
    and expires_at > now()
    and consumed_at is null
    and is_verified = false
  order by requested_at desc
  limit 1
$$;

create or replace function public.user_has_password(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (
      select u.encrypted_password is not null
         and length(u.encrypted_password) > 0
         and u.encrypted_password <> extensions.crypt('', u.encrypted_password)
      from auth.users u
      where u.id = p_user_id
    ),
    false
  );
$$;