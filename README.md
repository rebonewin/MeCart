# MeCart

Enterprise e-commerce storefront and administration suite built on Next.js 16 (App Router) and Supabase. The product ships with a customer storefront, a full admin console, Supabase Auth backed by row-level security, and a 67-check backend verification suite.

## Stack

- **Framework:** Next.js 16.4.2, React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, Radix-based UI primitives
- **Data:** Supabase (PostgreSQL, Auth, Storage, RPCs)
- **Forms/validation:** react-hook-form, zod
- **Charts/analytics:** recharts
- **3D/UX:** three / @react-three/fiber, framer-motion, gsap, lenis

## Features

### Storefront

- Home with hero scene, categories, deals, recommendations, newsletter
- Product catalog with filters, live search, product detail and quick view
- Cart (guest and authenticated), wishlist, compare, checkout
- Orders, order tracking, invoices, profile, addresses, reviews
- Auth flows: login, register, forgot/reset password, email confirmation

### Admin console (`/admin`)

- Dashboard, products, categories, brands, inventory, orders, payments, customers
- Reviews, coupons, CMS pages, media library, content/SEO
- Analytics, reports, AI insights, notifications, audit logs
- Settings, security, profile, and theme customizer (colors, fonts, presets, history, editor)

## Quick start

```bash
npm install
# create .env and .env.local (see INSTALL.md)
npm run verify:supabase   # optional backend check
npm run dev               # http://localhost:3000
```

Production:

```bash
npm run build
npm run start
```

## Environment variables

Set by name only. Values live in `.env` / `.env.local` and must never be committed.

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client/server/middleware |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and SSR Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts/admin-only operations |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects, robots, metadata |
| `ADMIN_EMAIL` | Admin account + verify script |
| `ADMIN_PASSWORD` | Admin password (read from `.env` only) |
| `ADMIN_USERNAME` | Optional admin username seed |

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start built app |
| `lint` | `eslint` | Lint |
| `format` | `prettier --write .` | Format |
| `typecheck` | `tsc --noEmit` | Type check |
| `seed:admin` | `node scripts/seed-admin.mjs` | Seed/upgrade admin account |
| `verify:supabase` | `node scripts/verify-supabase.mjs` | End-to-end backend verification |

## Repository layout

- `app/` - Next.js routes (storefront under `(shop)`, auth under `(auth)`, admin under `admin`)
- `components/` - UI and feature components
- `lib/` - auth, repositories, services, server actions, Supabase clients, validators
- `supabase/migrations/` - ordered SQL migrations
- `types/` - database types (`database.gen.ts` is the source of truth)
- `scripts/` - admin seeding, verification, e2e user helpers
- `proxy.ts` - auth-aware request proxy for protected routes

## Documentation

- `INSTALL.md` - Local setup
- `DEPLOYMENT.md` - Vercel deployment
- `SECURITY.md` - Security model
- `ADMIN_GUIDE.md` - Admin console modules
- `API_DOCUMENTATION.md` - API and RPC surface
- `DATABASE_SCHEMA.md` - Schema reference
- `SUPABASE_SETUP.md` - Supabase provisioning
- `CONTRIBUTING.md` - Contribution guide
- `CHANGELOG.md` - Release history

## Verification

```bash
npm run typecheck
npm run lint
npm run verify:supabase
```

`verify:supabase` performs anonymous/admin authentication, CRUD across every module, RLS checks, storage uploads, and seeded reference reads.