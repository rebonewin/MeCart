# Database Schema

MeCart uses a single Supabase PostgreSQL database. Type definitions are generated into `types/database.gen.ts` from project `bckhzvxwjksyvhejreww`; hand-written aliases live in `types/database.ts`. Regenerate with:

```bash
npx supabase gen types typescript --project-id bckhzvxwjksyvhejreww > types/database.gen.ts
```

Migrations are in `supabase/migrations/` and must be applied in filename order.

## Extensions

- `pgcrypto`, `pg_trgm`

## Enums

| Enum | Values |
|---|---|
| `app_role` | admin, manager, customer, guest |
| `product_status` | ACTIVE, DRAFT, HIDDEN |
| `order_status` | PENDING, CONFIRMED, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED, RETURNED |
| `payment_status` | PENDING, PAID, FAILED, REFUNDED |
| `payment_method` | COD, UPI, CARD, NETBANKING |
| `audit_status` | SUCCESS, FAILED |
| `review_status` | PENDING, APPROVED, REJECTED |
| `cart_status` | ACTIVE, CONVERTED, ABANDONED |
| `cms_status` | DRAFT, PUBLISHED, ARCHIVED |
| `notification_type` | ORDER, PAYMENT, SYSTEM, PROMOTION, SECURITY, REVIEW |
| `txn_type` | CHARGE, REFUND, ADJUSTMENT, PAYOUT |

Sequence: `order_number_seq` starts at 100001.

## Core tables

- `profiles` — id (FK auth.users), username, email, full_name, phone, avatar_url, role, is_active, last_login_at, created_at, updated_at, deleted_at
- `roles` — id, name, description, is_system, created_at, updated_at
- `permissions` — id, key, resource, action, description, created_at, updated_at
- `role_permissions` — role_id, permission_id, created_at
- `admins` — id, user_id (FK profiles), level, department, notes, deleted_at
- `customers` — id, user_id (FK profiles), marketing_opt_in, total_orders, total_spent, loyalty_points, notes, deleted_at

## Catalog

- `categories` — id, name, slug, description, image_url, position, is_active, deleted_at
- `sub_categories` — id, category_id (FK categories), name, slug, position, is_active, deleted_at, unique(category_id, slug)
- `brands` — id, name, slug, description, logo_url, is_active, deleted_at
- `products` — id, name, slug, sku, description, material, country, weight, stock, sizes[], colors[], rating, review_count, status, featured, best_seller, new_arrival, original_price, discount_percent, final_price, category_id, sub_category_id, brand_id, deleted_at
- `product_images` — id, product_id (cascade), url, alt, position, unique(product_id, position)
- `product_variants` — id, product_id (cascade), name, sku, size, color, price, stock, image_url, is_active
- `inventory` — id, product_id, variant_id, quantity, reserved_quantity, low_stock_threshold, location, unique(product_id, variant_id)
- `inventory_logs` — id, inventory_id, product_id, variant_id, change, quantity_after, reason, reference, created_by, created_at

## Commerce

- `addresses` — id, user_id, label, name, phone, line1, line2, city, state, zip, country, is_default
- `carts` — id, user_id (FK profiles), status, unique active cart per user
- `cart_items` — id, cart_id (cascade), product_id, variant_id, quantity, size, color, unit_price, unique nulls not distinct (cart_id, product_id, size, color)
- `wishlists` — id, user_id, product_id, unique(user_id, product_id)
- `coupons` — id, code, description, discount_percent, discount_amount, min_order_value, max_discount, usage_limit, per_user_limit, used_count, starts_at, expires_at, active, deleted_at
- `coupon_usage` — id, coupon_id (cascade), user_id, order_id (FK orders), discount, created_at
- `orders` — id, order_number (unique), invoice_number (unique), user_id, customer_name/email/phone, shipping_address, billing_address, city, zip, subtotal, shipping_cost, tax, discount, grand_total, currency, status, payment_status, coupon_code, notes, deleted_at
- `order_items` — id, order_id (cascade), product_id (set null), name, sku, quantity, size, color, price, total
- `payments` — id, order_id (cascade), method, provider, amount, currency, status, transaction_id (unique), payment_id (unique), verified_at
- `transactions` — id, payment_id, order_id, user_id, type, amount, currency, status, reference, gateway_response

## Engagement and content

- `reviews` — id, product_id (cascade), user_id, order_id, author_name, rating 1-5, title, body, images[], status
- `notifications` — id, user_id, type, title, body, link, data, read_at
- `activity_logs` — id, user_id, action, resource, ip_address, user_agent, metadata, created_at
- `audit_logs` — id, admin_id, action, resource, old_value, new_value, ip_address, user_agent, os, browser, status
- `media_library` — id, bucket, path, url, name, alt, mime_type, size_bytes, width, height, folder, uploaded_by, unique(bucket, path)
- `cms_pages` — id, slug (unique), title, excerpt, content (jsonb), status, template, cover_image, published_at, created_by, deleted_at
- `seo` — id, entity_type, entity_id, meta_title, meta_description, keywords[], canonical_url, og_*, no_index, unique(entity_type, entity_id)

## Operations and settings

- `analytics_events` — id, name, user_id, session_id, path, referrer, properties (jsonb), created_at
- `shipping_zones` — id, name, countries[], states[], is_active
- `shipping_methods` — id, zone_id, name, description, rate, free_over, min_days, max_days, is_active
- `tax_rules` — id, name, country, state, rate, is_active
- `settings` — key (PK), value (jsonb), description, is_public, updated_at
- `theme_settings` — key (PK), value (jsonb), description, is_public, updated_at

## Functions and RPCs

- Triggers/util: `set_updated_at`, `handle_new_user`, `handle_new_product`, `handle_inventory_update`, `refresh_product_rating`, `refresh_customer_stats`, `sync_admin_registry`, `protect_profile_privileges`
- Security helpers: `current_app_role`, `is_staff`, `is_admin`, `has_permission`
- Business RPCs: `validate_coupon_code`, `merge_guest_cart`, `place_order`, `check_signup_available`

## Storage buckets

| Bucket | Public | Size limit (bytes) | Notes |
|---|---|---|---|
| products | yes | 10,485,760 | staff uploads |
| product-gallery | yes | 10,485,760 | staff uploads |
| categories | yes | 5,242,880 | staff uploads |
| brands | yes | 5,242,880 | staff uploads |
| avatars | yes | 5,242,880 | customer + staff uploads |
| banners | yes | 10,485,760 | staff uploads |
| cms | yes | 10,485,760 | staff uploads |
| review-images | yes | 5,242,880 | customer + staff uploads |
| documents | no | 20,971,520 | staff only |
| reports | no | 20,971,520 | staff only |

MIME allowlists and upload policies are defined in the storage migration and hardened policy.