# Deployment Guide

MeCart deploys as a Next.js production build on Vercel with a hosted Supabase backend. `deploy-now.ps1` (launched by `deploy-now.bat`) automates the supported Option A flow.

## Prerequisites

- Vercel CLI installed and authenticated (`vercel whoami`)
- A Vercel project (the script links to `born6/me-cart`)
- A Supabase project with production data and migrations applied
- `.env.local` containing the required variables
- Node 20 or later for local preflight checks

## 1. Provision Supabase (production)

Apply every migration in `supabase/migrations/` in filename order before deploying. The verification script depends on seeded reference rows. Then:

- Enable anonymous sign-ins (used for guest carts).
- Enable email/password auth and recovery flows.
- Point recovery email templates at `/auth/confirm?token_hash=...&type=recovery&next=/reset-password` when using a custom SMTP provider.
- Keep the service role key server-side only.
- Confirm reference seed data and storage buckets are present.

## 2. Environment variables

The following names are required in production:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Live Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for auth redirects |
| `ADMIN_EMAIL` | Seeded administrator email |

Not pushed as a runtime variable: `ADMIN_PASSWORD`, `ADMIN_USERNAME`, `SUPABASE_URL`.

## 3. Link and verify environment variables

The script checks the production variables by name:

```powershell
.\deploy-now.bat
```

If any is missing it is added from `.env.local`. `ADMIN_PASSWORD` is used only for seeding and is not pushed as a runtime variable.

## 4. Run the deploy script

Steps performed:

1. Verify Vercel login.
2. Link to `born6/me-cart`.
3. Sync missing environment variables.
4. Cloud build plus production deploy (`vercel deploy --prod --yes`).
5. Print the deployment URL.

## 5. Manual deployment (equivalent)

```bash
vercel link --project me-cart --scope born6 --yes
vercel deploy --prod --yes
```

Use this path for redeploys when the interactive script is unavailable.

## 6. Post-deploy verification

- Load `/` and a product detail page; confirm images and data rendering.
- Sign in at `/login` with the seeded admin account and open `/admin`.
- Place a guest cart and a checkout; confirm order and invoice routes.
- Upload an image through `/api/upload` as staff; confirm bucket visibility.
- Run `npm run verify:supabase` against the production project locally.
- Check `/auth/confirm` resolves with a real recovery link in staging.

## 7. Runtime notes

- `proxy.ts` runs `updateSession` on protected routes (`/admin`, `/checkout`, `/orders`, `/profile`, `/wishlist`, `/login`, `/register`, `/forgot-password`).
- Security headers (CSP, HSTS, frame deny, etc.) are emitted for `/:path*` in `next.config.ts`.
- Remote image patterns allow HTTPS hosts; tighten if a fixed CDN is adopted.
- `connect-src` permits Supabase and selected Git assets for HDRI content.
- The CSP blocks third-party frames via `frame-ancestors 'none'`.

## 8. Rollback

Redeploy a prior production build from the Vercel dashboard, or re-run the script from a known-good commit. Database migrations are not automatically rolled back; apply corrective SQL manually before downgrading.

## 9. Deployment secrets checklist

- `.env` and `.env.local` remain untracked (see `.gitignore`).
- Vercel receives only the allowlisted variables.
- Service role key and admin password are never passed to the browser.
- Custom SMTP credentials stay inside Supabase project settings.