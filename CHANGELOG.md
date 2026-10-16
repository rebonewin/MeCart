# Changelog

All notable changes to MeCart are documented here. Dates follow the repository commit history.

## [1.0.0] - 2026-10-16

### Added

- Storefront: home, catalog, product detail, search, cart, wishlist, compare, checkout, orders, tracking, invoices, profile, reviews, and auth flows.
- Storefront components: hero scene, live search, product cards, quick view, deals, recommendations, newsletter, cinematic layout.
- Admin suite: dashboard, products, categories, brands, inventory, orders, payments, customers, reviews, coupons, CMS, media, SEO, analytics, reports, AI insights, notifications, audit logs, settings, security, profile, and theme customizer.
- Theme module: colors, fonts, presets, editor, and history.
- Supabase-backed data layer: PostgreSQL enums/tables, RLS, triggers, storage buckets, and `SECURITY DEFINER` RPCs (`place_order`, `validate_coupon_code`, `merge_guest_cart`, `check_signup_available`, `is_admin`, `is_staff`, `has_permission`).
- Security headers, auth proxy matcher, audit/activity logging, and upload validation.
- Verification suite (`scripts/verify-supabase.mjs`) covering auth, CRUD, RLS, storage, and seeded data.
- CMS builder page (commit 33b6b38).
- Theme customizer with colors, fonts, presets, editor, and history (commit 1615c15).
- Anonymous guest authentication flow for shared carts and wishlists.
- Shipping, tax, and inventory management data structures.
- SEO and analytics event tracking infrastructure.
- Media library with bucket/path metadata and deletion.
- Notification center and order messaging.
- Reports and AI insights dashboards.

### Changed

- Migrated authentication from bcrypt-based login to Supabase Auth.
- Replaced guest cart merge detection with `auth.users.is_anonymous` to fix dropped guest carts.
- Registration now pre-checks usernames/emails through `check_signup_available` to prevent duplicate-user 500 errors.
- Storage upload policies tightened to customer versus staff boundaries.
- Admin shell updated for premium UI and dark mode.
- Next.js config hardened with broader CSP and strict transport security.
- Login flow redirects users home and admins to the dashboard.

### Fixed

- Manifest icon purpose type for Next.js 16.4.2 (commit 6d918cd).
- Vercel redeploy trigger for the theme route (commit 021f19f).
- Customer aggregation refresh on order changes.
- Customer display name handling across auth profile sync.

### Infrastructure

- Supabase migrations covering extensions, enums, tables, triggers, RLS, storage, and seed data.
- Generated type definitions in `types/database.gen.ts`.
- Deploy script for Vercel production promotion (`deploy-now.ps1`).
- Admin seeding utility (`scripts/seed-admin.mjs`).
- E2E user provisioning helper (`scripts/e2e-users.mjs`).
- Storage buckets and upload policies for ten public/private buckets.
- Search/indexing support via `pg_trgm`.

### Documentation

- Added README, INSTALL, DEPLOYMENT, SECURITY, ADMIN_GUIDE, API_DOCUMENTATION, DATABASE_SCHEMA, SUPABASE_SETUP, CONTRIBUTING, and CHANGELOG documents.

### Migration list (1.0.0)

- `20261015000100_extensions_enums.sql`
- `20261015000200_tables.sql`
- `20261015000300_functions_triggers.sql`
- `20261015000400_rls.sql`
- `20261015000500_storage.sql`
- `20261015000600_seed_reference_data.sql`
- `20261016000100_harden_storage_upload_policies.sql`
- `20261016000200_fix_merge_guest_cart_anonymous.sql`
- `20261016000300_signup_availability_rpc.sql`

### Commit references

- `33b6b38` Add CMS builder page
- `1615c15` Add theme customizer
- `021f19f` Trigger Vercel redeploy for theme route
- `6d918cd` fix: manifest icon purpose type for Next.js 16.4.2
- `c5cb7ab` MeCart Enterprise v1.0 Final Release

### Quality gates

- `npm run typecheck`
- `npm run lint`
- `npm run verify:supabase`

### Notes

- No automated test runner is included; quality gates are `typecheck`, `lint`, and `verify:supabase`.
- Production deployment uses the Vercel flow documented in `DEPLOYMENT.md`.
- All environment values are documented by name only in repository docs.
- Verification suite reports individual check names for failure triage.