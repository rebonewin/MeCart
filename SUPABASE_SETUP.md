# Supabase Setup

This guide provisions the MeCart backend (database, auth, storage, RLS) in a Supabase project.

## 1. Create project

- Region close to the app audience
- Note the project ref (`bckhzvxwjksyvhejreww` for the reference project)
- Configure public URL and anon key in `.env.local` by name:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## 2. Apply migrations

Run SQL files in `supabase/migrations/` in filename order:

1. `20261015000100_extensions_enums.sql`
2. `20261015000200_tables.sql`
3. `20261015000300_functions_triggers.sql`
4. `20261015000400_rls.sql`
5. `20261015000500_storage.sql`
6. `20261015000600_seed_reference_data.sql`
7. `20261016000100_harden_storage_upload_policies.sql`
8. `20261016000200_fix_merge_guest_cart_anonymous.sql`
9. `20261016000300_signup_availability_rpc.sql`

The first migration installs `pgcrypto` and `pg_trgm`.

## 3. Authentication configuration

- Enable email/password sign-in.
- Enable anonymous sign-ins (required for guest carts).
- Enable password recovery and set redirect handling to `/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` when using custom SMTP.
- Default templates use the confirmation URL flow handled by `/reset-password`.
- Optional: customize SMTP provider.

## 4. Admin seed

Set `ADMIN_PASSWORD` in `.env` (and optionally `ADMIN_EMAIL`, `ADMIN_USERNAME`). Run:

```bash
npm run seed:admin
```

Creates or updates the admin auth user, profile, and admins registry row.

## 5. Frontend environment

- `NEXT_PUBLIC_SITE_URL` must match the deployed origin for auth redirects.
- Keep `ADMIN_PASSWORD` out of Vercel runtime values.

## 6. Type generation

After schema changes:

```bash
npx supabase gen types typescript --project-id bckhzvxwjksyvhejreww > types/database.gen.ts
npm run typecheck
```

## 7. Storage verification

Confirm all ten buckets exist with their allowlists and that storage policies are active. Upload flows should respect staff vs customer policy boundaries.

## 8. Verification suite

```bash
npm run verify:supabase
```

Checks include:

- Admin/customer sign-in and sign-up triggers
- Anonymous guest sign-in
- RLS for anon and customer reads/writes
- CRUD across catalog, content, orders, payments, and settings
- Coupon RPC acceptance/rejection
- Storage upload and removal across public/private buckets
- Seeded reference row counts

Address any failing check name before releasing.

## 9. Ongoing migrations

- Add new SQL files with timestamped names; never edit applied history in place.
- Include RLS policies and indexes for new tables.
- Update `types/database.ts` aliases when adding tables/enums.
- Re-run the verification suite after changes.