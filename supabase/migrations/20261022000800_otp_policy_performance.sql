-- Cache auth helpers once per statement in the OTP self-read policies.
-- This removes the two `auth_rls_initplan` performance warnings without
-- changing the policies' effective access rules.

drop policy if exists email_otp_requests_self_read on public.email_otp_requests;
create policy email_otp_requests_self_read
  on public.email_otp_requests for select
  to authenticated
  using (lower(email) = lower(coalesce((select auth.email()), '')));

drop policy if exists phone_otp_requests_self_read on public.phone_otp_requests;
create policy phone_otp_requests_self_read
  on public.phone_otp_requests for select
  to authenticated
  using (
    phone_number = coalesce(
      (select u.phone from auth.users u where u.id = (select auth.uid())),
      ''
    )
  );
