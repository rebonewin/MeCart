# Installation Guide

MeCart is a Next.js + Supabase application. This guide covers local setup from a clean clone. No secrets are printed; values are stored only in local `.env` files.

## Prerequisites

- Git
- Node.js 20 or later with npm
- A Supabase project (see `SUPABASE_SETUP.md`)
- `npm install` access
- A password for the seeded admin account (kept in `.env` only)

## 1. Clone

```bash
git clone <repository-url>
cd MeCart
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

Create `.env.local` with these by name:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
ADMIN_EMAIL
```

Create `.env` (or append to `.env.local`) with:

```
ADMIN_PASSWORD
```

Optional:

```
ADMIN_USERNAME
SUPABASE_URL
```

Never commit either file. Keep `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` server-side only.

## 4. Provision Supabase

Apply migrations in filename order from `supabase/migrations/` (0001 through the 0003 series), then regenerate types if needed:

```bash
npx supabase gen types typescript --project-id bckhzvxwjksyvhejreww > types/database.gen.ts
```

See `SUPABASE_SETUP.md` for the full migration and bucket procedure.

## 5. Seed the admin account

```bash
npm run seed:admin
```

Idempotent. Reads `ADMIN_PASSWORD` from `.env` and upserts the admin profile and registry row. Logs in through `/login` with username or email.

## 6. Verify the backend

```bash
npm run verify:supabase
```

Requires `ADMIN_PASSWORD`. Exercises auth, CRUD across every module, RLS, RPCs, and storage.

## 7. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`. Admin console is at `/admin` after sign-in.

Quality checks:

```bash
npm run typecheck
npm run lint
```

## 8. Production-style local run

```bash
npm run build
npm run start
```

## Troubleshooting

- Missing env error on startup: confirm `.env.local` contains both Supabase URL and anon key.
- Sign-in fails: check `ADMIN_EMAIL`/`ADMIN_PASSWORD` and that `seed:admin` completed.
- Upload failures: confirm the target bucket exists in `storage.buckets` and the user has the matching policy (staff vs customer).
- TypeScript errors after schema changes: regenerate `types/database.gen.ts` from the live project and re-run `typecheck`.
- `verify:supabase` failure: review the reported check name; most failures point to a missing migration or RLS policy.