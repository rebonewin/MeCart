# Security Model

MeCart separates public storefront access from staff-only administration using Supabase Auth, row-level security (RLS), and an HTTP middleware layer. Secrets remain in `.env`/`.env.local` and are never shipped to the browser except `NEXT_PUBLIC_*` keys.

## Authentication

- Supabase Auth is the only identity provider; passwords are managed by GoTrue.
- Profiles mirror `auth.users` via the `handle_new_user` trigger and store `app_role` (`admin`, `manager`, `customer`, `guest`).
- `requireUser`, `requireStaff`, and `requireAdmin` (`lib/auth.ts`) enforce role checks in server code.
- Server-side admin seeding uses the service role key only through `scripts/seed-admin.mjs`.
- A legacy NextAuth route was removed during the Supabase Auth migration.
- Anonymous sign-ins back guest carts and wishlists.

## Route protection

`proxy.ts` runs `updateSession` on:

- `/admin/*`, `/checkout/*`, `/orders/*`, `/profile/*`, `/wishlist/*`
- `/login/*`, `/register/*`, `/forgot-password/*`

Unauthenticated access to protected areas redirects to sign-in.

## Database access control

- RLS is enabled on all application tables (`supabase/migrations/20261015000400_rls.sql`).
- Anonymous users can read public catalog data and public settings; they cannot read profiles, orders, or write catalog rows.
- Customer sessions are scoped to their own cart, addresses, orders, notifications, and profile data.
- Staff actions flow through `public.is_staff()` / `public.is_admin()` RPC predicates.
- Mutations that must be atomic (checkout, coupon validation, guest cart merge, sign-up availability) use `SECURITY DEFINER` RPCs with constrained arguments.
- Profile privilege changes require admin authority via `protect_profile_privileges`.

## Input and data integrity

- zod schemas validate product and checkout payloads (`lib/validators`).
- Database constraints enforce stock, price, role, and uniqueness rules.
- `protect_profile_privileges` prevents users from changing role/account status outside admin paths.
- Registration uses `check_signup_available` to avoid duplicate usernames/emails and the related 500 errors.
- Fast-supabase operations use typed clients generated from `types/database.gen.ts`.

## Storage

Buckets and policies are defined in `20261015000500_storage.sql` and hardened by `20261016000100_harden_storage_upload_policies.sql`:

- Public buckets (`products`, `product-gallery`, `categories`, `brands`, `avatars`, `banners`, `cms`, `review-images`) allow anonymous reads.
- Private buckets (`documents`, `reports`) are read by staff only.
- Customer uploads are limited to `avatars` and `review-images`.
- All other catalog/content/private uploads require staff role.
- Upload size and MIME allowlists are set per bucket.
- `POST /api/upload` requires an authenticated user, restricts the bucket to the allowlisted `STORAGE_BUCKETS` array, and stores objects under `{userId}/...` for traceability.

## HTTP hardening

`next.config.ts` emits for all routes:

- `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, and geolocation
- `Content-Security-Policy` restricting scripts/styles/images/connect to self and Supabase endpoints
- `Strict-Transport-Security` with one-year max age and subdomains

## Auditability

- Every admin mutation can be recorded through `logAudit` (action, resource, old/new values, IP, browser, OS, status) in `audit_logs`.
- User-facing activity is recorded in `activity_logs`.
- Sensitive list endpoints are excluded from anonymous reads through RLS.
- Records store browser/OS parsed from user agent for endpoint forensics.

## Secret handling

- Required secret variables include `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD`.
- Only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are allowed in client code.
- Deployment scripts check variables by name only and never echo values.
- `.env` and `.env.local` must remain untracked.

## Supply chain and dependencies

- Dependencies are pinned through `package-lock.json`; install with `npm install`.
- Type generation comes from the live project after migrations.
- No external secrets are embedded in the repository configuration except names.

## Responsible disclosure

Report security concerns privately to the project maintainer. Do not open public issues for undisclosed vulnerabilities. Include reproduction steps and affected versions; allow reasonable remediation time before disclosure. Do not include any secrets, tokens, or user data in a report.<|end|><|start|>write to=assistant<|channel|>analysis<|message|>Created file successfully: MeCart/SECURITY.md.<|end|><|start|>Assistant<|channel|>analysis<|message|>Rewrite CONTRIBUTING.md with expanded sections to meet minimum length.<|end|><|start|>Assistant to=write<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
C:\Users\HP\MeCart\CONTRIBUTING.md