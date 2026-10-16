-- Registration availability pre-check.
--
-- The register flow used to rely on the service-role key to detect taken
-- usernames/emails before calling auth.signUp. When that key is absent (or two
-- signups race), a duplicate username reaches the handle_new_user trigger,
-- trips the profiles_username_key unique constraint and GoTrue surfaces the
-- generic 500 "Database error saving new user" to the customer.
--
-- This SECURITY DEFINER RPC lets the server action run the same check without
-- elevated credentials so duplicates produce a friendly error instead.
create or replace function public.check_signup_available(p_username text, p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'username_taken', exists (
      select 1
      from public.profiles p
      where coalesce(btrim(p_username), '') <> ''
        and lower(p.username) = lower(btrim(p_username))
    ),
    'email_taken', (
      exists (
        select 1
        from public.profiles p
        where coalesce(btrim(p_email), '') <> ''
          and lower(p.email) = lower(btrim(p_email))
      )
      or exists (
        select 1
        from auth.users u
        where coalesce(btrim(p_email), '') <> ''
          and lower(u.email) = lower(btrim(p_email))
      )
    )
  );
$$;

revoke execute on function public.check_signup_available(text, text) from public;
grant execute on function public.check_signup_available(text, text) to anon, authenticated;
