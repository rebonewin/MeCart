-- ============================================================================
-- Enterprise Two-Factor Authentication
--
-- * TOTP secrets are stored encrypted (AES-256-GCM) by the application layer.
-- * Recovery codes are stored as HMAC-SHA256 hashes only, one-time use.
-- * Trusted devices are stored as SHA-256 hashes of a random httpOnly cookie.
-- * Every table is service-role only: RLS is enabled with no policies and all
--   grants are revoked from anon/authenticated.
-- ============================================================================

create table if not exists public.user_two_factor (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Primary/default method shown first on the login challenge.
  method text not null default 'totp' check (method in ('totp', 'email', 'sms')),
  enabled boolean not null default false,
  -- Active TOTP secret (encrypted). Never returned to the client after setup.
  encrypted_secret text,
  -- Pending setup state. The active configuration keeps working until the new
  -- method is confirmed, so a failed reconfiguration cannot lock a user out.
  pending_method text check (pending_method in ('totp', 'email', 'sms')),
  pending_encrypted_secret text,
  pending_attempts integer not null default 0,
  pending_contact_sent_at timestamptz,
  secret_verified_at timestamptz,
  enabled_at timestamptz,
  last_used_at timestamptz,
  -- Highest accepted TOTP time-step, used to reject replay of a used code.
  last_totp_step bigint,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.two_factor_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  -- HMAC-SHA256(normalized code) — plaintext codes are never stored.
  code_hash text not null,
  used_at timestamptz,
  used_ip text,
  used_user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, code_hash)
);

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- SHA-256 of the random httpOnly cookie value.
  token_hash text not null unique,
  label text,
  browser text,
  os text,
  ip text,
  location text,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists public.two_factor_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- SHA-256 of the random httpOnly challenge cookie.
  token_hash text not null unique,
  method text,
  attempts integer not null default 0,
  email_send_count integer not null default 0,
  sms_send_count integer not null default 0,
  email_sent_at timestamptz,
  sms_sent_at timestamptz,
  -- Non-sensitive context: post-login redirect, guest cart id, excluded
  -- first-factor methods (e.g. email OTP login excludes email as 2FA).
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.failed_2fa_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  method text,
  reason text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists two_factor_recovery_codes_user_idx
  on public.two_factor_recovery_codes (user_id);
create index if not exists two_factor_recovery_codes_unused_idx
  on public.two_factor_recovery_codes (user_id) where used_at is null;

create index if not exists trusted_devices_user_idx
  on public.trusted_devices (user_id);
create index if not exists trusted_devices_active_idx
  on public.trusted_devices (user_id, expires_at) where revoked_at is null;

create index if not exists two_factor_challenges_user_idx
  on public.two_factor_challenges (user_id, created_at desc);
create index if not exists two_factor_challenges_token_idx
  on public.two_factor_challenges (token_hash);

create index if not exists failed_2fa_attempts_user_idx
  on public.failed_2fa_attempts (user_id, created_at desc);
create index if not exists failed_2fa_attempts_created_idx
  on public.failed_2fa_attempts (created_at desc);

-- ---------------------------------------------------------------------------
-- Lock down direct API access. All reads/writes go through audit-logged server
-- actions using the service-role client.
-- ---------------------------------------------------------------------------
alter table public.user_two_factor enable row level security;
alter table public.two_factor_recovery_codes enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.two_factor_challenges enable row level security;
alter table public.failed_2fa_attempts enable row level security;

revoke all on public.user_two_factor from anon, authenticated;
revoke all on public.two_factor_recovery_codes from anon, authenticated;
revoke all on public.trusted_devices from anon, authenticated;
revoke all on public.two_factor_challenges from anon, authenticated;
revoke all on public.failed_2fa_attempts from anon, authenticated;

grant all on public.user_two_factor to service_role;
grant all on public.two_factor_recovery_codes to service_role;
grant all on public.trusted_devices to service_role;
grant all on public.two_factor_challenges to service_role;
grant all on public.failed_2fa_attempts to service_role;

comment on table public.user_two_factor is
  'Enterprise 2FA state. TOTP secrets are AES-256-GCM encrypted by the app; service-role only.';
comment on table public.two_factor_recovery_codes is
  'One-time recovery codes stored as HMAC-SHA256 hashes; service-role only.';
comment on table public.trusted_devices is
  '30-day trusted browser tokens stored as SHA-256 hashes; service-role only.';
comment on table public.two_factor_challenges is
  'Short-lived login step-up challenges (10 min); service-role only.';
comment on table public.failed_2fa_attempts is
  'Immutable second-factor failure trail for the admin dashboard; service-role only.';
