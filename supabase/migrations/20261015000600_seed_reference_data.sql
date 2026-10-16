-- ============================================================================
-- MeCart Enterprise — 0006 Seed Reference Data
-- Idempotent seeds: roles, permissions, settings, theme, taxonomy, catalog.
-- No customer or demo-order data is created here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
insert into public.roles (name, description, is_system) values
  ('admin',    'Full access to every resource', true),
  ('manager',  'Catalog, orders, customers and content management', true),
  ('customer', 'Storefront customer account', true),
  ('guest',    'Anonymous storefront visitor', true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, resource, action, description) values
  ('dashboard.view',      'dashboard',   'view',    'View admin dashboard'),
  ('products.read',       'products',    'read',    'View products'),
  ('products.create',     'products',    'create',  'Create products'),
  ('products.update',     'products',    'update',  'Update products'),
  ('products.delete',     'products',    'delete',  'Delete products'),
  ('categories.manage',   'categories',  'manage',  'Manage categories'),
  ('brands.manage',       'brands',      'manage',  'Manage brands'),
  ('orders.read',         'orders',      'read',    'View orders'),
  ('orders.update',       'orders',      'update',  'Update order status'),
  ('payments.manage',     'payments',    'manage',  'Manage payments and refunds'),
  ('customers.read',      'customers',   'read',    'View customers'),
  ('customers.update',    'customers',   'update',  'Update customers'),
  ('inventory.manage',    'inventory',   'manage',  'Manage inventory'),
  ('coupons.manage',      'coupons',     'manage',  'Manage coupons'),
  ('reviews.moderate',    'reviews',     'moderate','Moderate reviews'),
  ('media.manage',        'media',       'manage',  'Manage media library'),
  ('cms.manage',          'cms',         'manage',  'Manage CMS pages'),
  ('analytics.view',      'analytics',   'view',    'View analytics and reports'),
  ('notifications.manage','notifications','manage', 'Manage notifications'),
  ('settings.manage',     'settings',    'manage',  'Manage store settings'),
  ('theme.manage',        'theme',       'manage',  'Manage theme'),
  ('security.view',       'security',    'view',    'View audit and security logs'),
  ('users.manage',        'users',       'manage',  'Manage users and roles')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in (
  'dashboard.view','products.read','products.create','products.update',
  'categories.manage','brands.manage','orders.read','orders.update',
  'customers.read','inventory.manage','coupons.manage','reviews.moderate',
  'media.manage','cms.manage','analytics.view','notifications.manage'
)
where r.name = 'manager'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- settings
-- ---------------------------------------------------------------------------
insert into public.settings (key, value, description, is_public) values
  ('store',   '{"name":"MeCart","tagline":"Enterprise E-Commerce","email":"support@mecart.local","phone":"+1 (555) 010-0100","address":"MeCart HQ, Commerce Street 1"}', 'Store identity', true),
  ('commerce','{"currency":"USD","currency_symbol":"$","tax_rate":0.08,"free_shipping_over":null,"shipping_flat_rate":49,"cod_enabled":true}', 'Commerce defaults', true),
  ('checkout','{"guest_checkout":false,"order_prefix":"ORD","invoice_prefix":"INV","payment_provider":"DEMO"}', 'Checkout configuration', false),
  ('security','{"session_timeout_minutes":43200,"password_min_length":8,"max_login_attempts":10,"mfa_required_for_staff":false}', 'Security policy', false),
  ('seo',     '{"meta_title":"MeCart | Enterprise E-Commerce","meta_description":"MeCart modern enterprise eCommerce platform","keywords":["ecommerce","fashion","mecart"]}', 'Default SEO', true),
  ('notifications', '{"order_emails":true,"low_stock_alerts":true,"review_alerts":true}', 'Notification preferences', false),
  ('system',  '{"maintenance_mode":false,"analytics_enabled":true,"version":"2.0.0"}', 'System flags', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- theme_settings
-- ---------------------------------------------------------------------------
insert into public.theme_settings (key, value, description, is_public) values
  ('theme', '{"mode":"light","primary":"#4f46e5","secondary":"#0ea5e9","accent":"#f59e0b","radius":16,"font":"geist","density":"comfortable"}', 'Active storefront theme', true),
  ('header', '{"announcement":"Free shipping on orders over $99","show_search":true,"sticky":true}', 'Header configuration', true),
  ('footer', '{"newsletter":true,"copyright":"© 2026 MeCart. All rights reserved."}', 'Footer configuration', true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, position) values
  ('Men',      'men',      1),
  ('Girls',    'girls',    2),
  ('Baby Boy', 'baby-boy', 3),
  ('Baby Girl','baby-girl',4)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- sub_categories
-- ---------------------------------------------------------------------------
insert into public.sub_categories (category_id, name, slug, position)
select c.id, s.name, s.slug, s.position
from (values
  ('men', 'Jackets',  'jackets',  1),
  ('men', 'T-Shirts', 't-shirts', 2),
  ('men', 'Jeans',    'jeans',    3),
  ('men', 'Sneakers', 'sneakers', 4),
  ('girls', 'Dresses', 'dresses', 1)
) as s(category_slug, name, slug, position)
join public.categories c on c.slug = s.category_slug
on conflict (category_id, slug) do nothing;

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
insert into public.brands (name, slug) values
  ('Nike',              'nike'),
  ('Under Armour',      'under-armour'),
  ('Tommy Hilfiger',    'tommy-hilfiger'),
  ('Alexander McQueen', 'alexander-mcqueen')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- shipping & tax defaults
-- ---------------------------------------------------------------------------
insert into public.shipping_zones (id, name, countries, is_active)
values ('00000000-0000-4000-a000-000000000001', 'Worldwide', '{}', true)
on conflict (id) do nothing;

insert into public.shipping_methods (zone_id, name, description, rate, min_days, max_days, is_active)
select '00000000-0000-4000-a000-000000000001', m.name, m.description, m.rate, m.min_days, m.max_days, true
from (values
  ('Standard Shipping', 'Delivered in 5-7 business days', 49, 5, 7),
  ('Express Shipping',  'Delivered in 2-3 business days', 99, 2, 3)
) as m(name, description, rate, min_days, max_days)
where not exists (select 1 from public.shipping_methods sm where sm.name = m.name);

insert into public.tax_rules (name, country, state, rate, is_active)
select 'Default Tax', null, null, 0.08, true
where not exists (select 1 from public.tax_rules tr where tr.name = 'Default Tax');

-- ---------------------------------------------------------------------------
-- storefront catalog (preserves the existing product lineup)
-- ---------------------------------------------------------------------------
insert into public.products (
  id, name, slug, sku, description, material, country, weight, stock,
  sizes, colors, rating, review_count, status, featured, best_seller, new_arrival,
  original_price, discount_percent, final_price,
  category_id, sub_category_id, brand_id
)
select
  p.id::uuid, p.name, p.slug, p.sku, p.description, p.material, p.country, p.weight, p.stock,
  p.sizes, p.colors, p.rating, p.review_count, 'ACTIVE'::public.product_status,
  p.featured, p.best_seller, p.new_arrival,
  p.original_price, p.discount_percent, p.final_price,
  c.id,
  (select sc.id from public.sub_categories sc where sc.category_id = c.id and sc.slug = p.sub_category_slug),
  b.id
from (values
  ('11111111-1111-4111-a111-111111111101', 'Nike Men''s Soccer Track Jacket', 'nike-mens-soccer-track-jacket', 'SKU-100001',
   'Authentic Nike track jacket with full-zip front, breathable mesh lining, and classic stripe detail.',
   'Polyester', 'Vietnam', 0.45, 42, array['S','M','L','XL'], array['Blue','White'], 4.7, 184,
   true, true, false, 1290, 15, 1096.5, 'men', 'jackets', 'nike'),
  ('11111111-1111-4111-a111-111111111102', 'Under Armour Blue Performance T-Shirt', 'under-armour-blue-performance-tshirt', 'SKU-100002',
   'Under Armour performance tee with moisture-wicking HeatGear fabric and athletic fit.',
   'Polyester', 'China', 0.2, 68, array['XS','S','M','L','XL','XXL'], array['Blue','White','Black'], 4.5, 92,
   false, true, true, 499, 10, 449.1, 'men', 't-shirts', 'under-armour'),
  ('11111111-1111-4111-a111-111111111103', 'Tommy Hilfiger Classic Fit Jeans', 'tommy-hilfiger-classic-fit-jeans', 'SKU-100003',
   'Classic-fit denim jeans by Tommy Hilfiger with straight leg and five-pocket styling.',
   'Denim', 'Bangladesh', 0.55, 30, array['S','M','L','XL','XXL'], array['Blue','Grey'], 4.6, 210,
   false, false, true, 1499, 20, 1199.2, 'men', 'jeans', 'tommy-hilfiger'),
  ('11111111-1111-4111-a111-111111111104', 'Alexander McQueen Velvet Evening Dress', 'alexander-mcqueen-velvet-evening-dress', 'SKU-100004',
   'Luxury velvet evening dress with structured silhouette and signature tailoring.',
   'Silk', 'Italy', 0.6, 12, array['XS','S','M','L'], array['Red','Black','Green'], 4.9, 64,
   true, false, false, 4999, 5, 4749.05, 'girls', 'dresses', 'alexander-mcqueen'),
  ('11111111-1111-4111-a111-111111111105', 'Nike Vaporfly Next White Sneakers', 'nike-vaporfly-next-white-sneakers', 'SKU-100005',
   'Nike Vaporfly Next running sneakers with responsive foam and breathable upper.',
   'Synthetic', 'China', 0.35, 55, array['S','M','L','XL'], array['White','Blue'], 4.8, 420,
   false, true, true, 1899, 12, 1671.12, 'men', 'sneakers', 'nike')
) as p(id, name, slug, sku, description, material, country, weight, stock, sizes, colors, rating,
       review_count, featured, best_seller, new_arrival, original_price, discount_percent, final_price,
       category_slug, sub_category_slug, brand_slug)
join public.categories c on c.slug = p.category_slug
join public.brands b on b.slug = p.brand_slug
on conflict (slug) do nothing;

insert into public.product_images (product_id, url, position, alt)
select
  (img.product_id)::uuid, img.url, img.position, img.alt
from (values
  ('11111111-1111-4111-a111-111111111101', 'https://upload.wikimedia.org/wikipedia/commons/0/06/Blue_Nike_US_N98_Men%27s_Soccer_Track_Jacket_front.JPG', 0, 'Nike Soccer Track Jacket front'),
  ('11111111-1111-4111-a111-111111111101', 'https://upload.wikimedia.org/wikipedia/commons/7/75/Blue_Nike_US_N98_Men%27s_Soccer_Track_Jacket_rear.JPG', 1, 'Nike Soccer Track Jacket rear'),
  ('11111111-1111-4111-a111-111111111101', 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_front_1.JPG', 2, 'Nike Holland N98 front'),
  ('11111111-1111-4111-a111-111111111101', 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_front_2.JPG', 3, 'Nike Holland N98 front 2'),
  ('11111111-1111-4111-a111-111111111101', 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nike_Holland_N98_Men%27s_Soccer_Track_Jacket_rear.JPG', 4, 'Nike Holland N98 rear'),
  ('11111111-1111-4111-a111-111111111102', 'https://upload.wikimedia.org/wikipedia/commons/1/16/Under_Armour_T-Shirt_%28Blue%29.jpg', 0, 'Under Armour Blue T-Shirt'),
  ('11111111-1111-4111-a111-111111111103', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Blauwe_jeans%2C_merk_Tommy_Hilfiger%2C_maat_3334%2C_objectnr_86975-2%281%29.JPG', 0, 'Tommy Hilfiger Jeans'),
  ('11111111-1111-4111-a111-111111111103', 'https://upload.wikimedia.org/wikipedia/commons/4/45/Blauwe_jeans%2C_merk_Tommy_Hilfiger%2C_maat_3334%2C_objectnr_86975-2%282%29.JPG', 1, 'Tommy Hilfiger Jeans detail'),
  ('11111111-1111-4111-a111-111111111104', 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Alexander_McQueen_dress_photo_2011.jpg', 0, 'Alexander McQueen dress'),
  ('11111111-1111-4111-a111-111111111105', 'https://upload.wikimedia.org/wikipedia/commons/8/81/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_01.jpg', 0, 'Nike Vaporfly Next'),
  ('11111111-1111-4111-a111-111111111105', 'https://upload.wikimedia.org/wikipedia/commons/d/d5/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_03.jpg', 1, 'Nike Vaporfly Next side'),
  ('11111111-1111-4111-a111-111111111105', 'https://upload.wikimedia.org/wikipedia/commons/e/e1/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_04.jpg', 2, 'Nike Vaporfly Next detail'),
  ('11111111-1111-4111-a111-111111111105', 'https://upload.wikimedia.org/wikipedia/commons/3/37/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_05.jpg', 3, 'Nike Vaporfly Next rear')
) as img(product_id, url, position, alt)
on conflict (product_id, position) do nothing;

-- ---------------------------------------------------------------------------
-- CMS system pages
-- ---------------------------------------------------------------------------
insert into public.cms_pages (slug, title, excerpt, content, status, template, published_at) values
  ('about', 'About MeCart', 'Premium shopping experience with trusted products and secure checkout.',
   '{"blocks":[{"type":"heading","text":"About MeCart"},{"type":"paragraph","text":"MeCart is a modern enterprise e-commerce platform delivering a premium shopping experience."}]}'::jsonb,
   'PUBLISHED', 'default', now()),
  ('contact', 'Contact Us', 'Get in touch with the MeCart team.',
   '{"blocks":[{"type":"heading","text":"Contact"},{"type":"paragraph","text":"Email support@mecart.local for any question."}]}'::jsonb,
   'PUBLISHED', 'default', now()),
  ('privacy', 'Privacy Policy', 'How MeCart collects and protects your data.',
   '{"blocks":[{"type":"heading","text":"Privacy Policy"},{"type":"paragraph","text":"We respect your privacy and protect your personal data."}]}'::jsonb,
   'PUBLISHED', 'legal', now()),
  ('terms', 'Terms & Conditions', 'The terms that govern the use of MeCart.',
   '{"blocks":[{"type":"heading","text":"Terms & Conditions"},{"type":"paragraph","text":"By using MeCart you agree to these terms."}]}'::jsonb,
   'PUBLISHED', 'legal', now())
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- default SEO records
-- ---------------------------------------------------------------------------
insert into public.seo (entity_type, entity_id, meta_title, meta_description, keywords)
select 'global', null, 'MeCart | Enterprise E-Commerce',
       'MeCart modern enterprise eCommerce platform',
       array['ecommerce','fashion','mecart']
where not exists (select 1 from public.seo where entity_type = 'global' and entity_id is null);
