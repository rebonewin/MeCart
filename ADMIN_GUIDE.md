# Admin Guide

The admin console lives under `/admin` and is protected by `proxy.ts` plus `requireStaff`/`requireAdmin` checks. Sign in at `/login` with a username or email and the admin password.

## Roles

- `admin` - full access, including settings, security, users, and audit logs
- `manager` - catalog, orders, inventory, reports, and content operations
- `customer` - storefront account only
- `guest` - anonymous browsing/cart (backed by Supabase anonymous auth)

Seeded accounts default to `admin` level `owner` (`scripts/seed-admin.mjs`).

## Navigation

- Left rail plus global command palette (search-driven)
- Dark mode by default
- Each page wraps content in the admin shell with consistent breadcrumbs

## Modules

### People and access

- `Dashboard` - KPIs, activity feed, sales chart, quick actions
- `Users` - profiles, roles, activation, delete with confirmations
- `Customers` - customer records, totals, loyalty points, notes
- `Profile` - current admin profile and preferences
- `Security` - security posture view
- `Audit Logs` - action history with IP/browser/OS details
- `Users`/accounts governed by `protect_profile_privileges`

### Catalog

- `Products` - list, create (`/products/new`), edit (`/products/[id]/edit`), status, featured/best-seller/new-arrival flags
- `Categories`, `Sub-categories` - hierarchical catalog structure and ordering
- `Brands` - logos, slugs, active state
- `Inventory` - quantities, reserved stock, low-stock thresholds, locations, change logs
- `Reviews` - moderation states (pending/approved/rejected), deletion
- `Media` - library browser across all buckets, metadata, deletion

### Commerce

- `Orders` - status and payment filters, lifecycle updates
- `Payments` - method, provider, status, transaction linkage
- `Coupons` - percentage/amount, limits, validity windows, usage tracking
- `Reports` - sales and operational reports
- `AI Insights` - analytics-driven insight cards and charts
- `Analytics` - event-driven charts and KPIs
- `Notifications` - system/promotion/security messages per user

### Content and configuration

- `CMS` - page builder (slug, title, excerpt, content blocks, status, publish date)
- `Media` - reusable assets (see above)
- `SEO` - metadata per entity type
- `Settings` - typed key/value store with public/private flags
- `Theme` - visual editor
  - `Colors`, `Fonts`, `Editor`, `Presets`, `History`
- `Notifications` - outbound messages (see above)

### Observability

- `Activity / analytics events` feed charts and insights
- `Audit Logs` records admin mutations
- `Dashboard` aggregates KPIs from orders, products, and customers

## Common workflows

### Publish a product

1. Open `Products -> New`.
2. Fill name, slug, SKU, prices, category, brand, stock and status.
3. Upload gallery images through the picker (bucket allowlist enforced).
4. Save; inventory row is auto-created by trigger.

### Process an order

1. Open `Orders` and filter by status.
2. Review items, totals, payment status.
3. Update lifecycle status (confirmed -> processing -> packed -> shipped -> delivered) or cancel/return.
4. Payment status updates propagate through the payment and transaction tables.

### Manage coupons

1. Create a code with either percent or fixed discount.
2. Set minimum order value, max discount, start/expiry, usage limits.
3. Coupon validation runs through `validate_coupon_code`.

### Moderate reviews

1. Filter by status.
2. Approve or reject.
3. Product rating and counts refresh automatically via trigger.

### Edit CMS content

1. Create or update a page with slug, title, and content blocks.
2. Set status to draft/published/archived and optionally publish date.
3. Manage SEO metadata separately.

### Theme changes

1. Use the editor for colors, fonts, and presets.
2. Preview inside the console.
3. History records prior states for rollback.

## Data safety

- `Settings` keys use upsert semantics on `key`.
- Media upload rejects disallowed buckets for non-staff users.
- Deletions are soft-deletes for records carrying `deleted_at`; hard deletes occur on cascade FKs where configured.
- Audit entries capture IP, user agent, browser, and OS for traceability.

## Verification

Run `npm run verify:supabase` to exercise the full backend, including admin paths and storage policies.<|end|><|start|>write to=assistant<|channel|>analysis<|message|>Created file successfully: MeCart/ADMIN_GUIDE.md.<|end|><|start|><|start|>assistant<|channel|>analysis<|message|>Now API_DOCUMENTATION.<|end|><|start|>Assistant to=write<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
C:\Users\HP\MeCart\API_DOCUMENTATION.md