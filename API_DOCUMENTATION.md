# API Documentation

MeCart is primarily a server-rendered Next.js App Router application. State-changing operations run through server actions in `lib/actions/*` and Supabase RPCs. Only two HTTP endpoints are exposed.

## HTTP endpoints

### `POST /api/upload`

Uploads one or more files through Supabase Storage and registers metadata in `media_library`.

- Auth: required (Supabase session cookie)
- Content-Type: `multipart/form-data`
- Fields:
  - `files` (required, one or more `File`)
  - `bucket` (optional; defaults to `products`; must be in `STORAGE_BUCKETS`)
  - `folder` (optional; path segment)
- Response `200`: `{ "urls": string[], "bucket": string }`
- Errors: `401` unauthorized, `400` no files, `500` storage/registration failure
- Policy: object path is `{folder?}/{userId}/{timestamp}-{random}.{ext}`; bucket-level ACLs decide who may upload.

### `GET /auth/confirm`

Email link verification endpoint. Verifies `token_hash` and `type` server-side and sets the session cookie.

- Query: `token_hash`, `type` (EmailOtpType), optional `next` (must start with `/`)
- Success: redirect to `next` (default `/reset-password`)
- Failure: redirect to `/forgot-password?error=invalid_link`
- Used when custom SMTP templates pass `token_hash` instead of the default confirmation URL.

## Server actions

Found under `lib/actions/*`. Each runs on the server with the caller's Supabase session and enforces auth through `requireUser`/`requireStaff`/`requireAdmin`.

- `addresses` - save/delete user addresses
- `auth` - register, login, password reset, profile
- `catalog` - public catalog mutations
- `cms` - CMS page management
- `coupons` - coupon CRUD
- `customers` - customer management
- `media` - media metadata
- `notifications` - user notifications
- `orders` - order operations and lifecycle
- `products` - product CRUD and variants
- `reviews` - review operations
- `settings` - key/value and theme settings
- `theme` - theme persistence
- `catalog/products/orders` detail logic shared from repositories

## Supabase RPCs

| RPC | Caller | Purpose |
|---|---|---|
| `is_admin()` | authenticated | boolean admin check |
| `is_staff()` | authenticated | boolean staff check |
| `has_permission(key)` | authenticated | permission lookup |
| `current_app_role()` | authenticated | current role |
| `check_signup_available(username, email)` | anon/authenticated | friendly duplicate detection during registration |
| `validate_coupon_code(code, subtotal)` | anon/authenticated | validates and prices coupons |
| `merge_guest_cart(from_user)` | authenticated | merges guest cart/wishlist into user account |
| `place_order(payload)` | authenticated | atomic checkout with stock decrement and payment/transaction creation |

## Authentication flow

- Client and server Supabase clients read URL/anon key from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Sessions are stored in cookies managed by `@supabase/ssr` (`lib/supabase/server.ts`, `lib/supabase/middleware.ts`).
- `proxy.ts` refreshes sessions for protected routes.
- Authed server actions call `supabase.auth.getUser()` before mutations.

## Data access conventions

- Reads from repositories in `lib/repositories/*` map Postgres rows to app types.
- Direct table access from the browser follows RLS policies.
- Storage access follows bucket visibility and upload policies.
- Validation errors from RPCs surface as thrown errors; HTTP routes return `{ error }` with an appropriate status.

## Rate and abuse considerations

- Authentication rate limiting is delegated to Supabase Auth.
- Browser-facing input is validated with zod where supported.
- CSP and security headers restrict script and frame origins.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- Server-only (never exposed): `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`