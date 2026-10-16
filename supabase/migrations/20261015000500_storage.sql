-- ============================================================================
-- MeCart Enterprise — 0005 Storage Buckets & Policies
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products',        'products',        true,  10485760, array['image/png','image/jpeg','image/webp','image/avif','image/gif','image/svg+xml']),
  ('product-gallery', 'product-gallery', true,  10485760, array['image/png','image/jpeg','image/webp','image/avif','image/gif']),
  ('categories',      'categories',      true,  5242880,  array['image/png','image/jpeg','image/webp','image/avif','image/svg+xml']),
  ('brands',          'brands',          true,  5242880,  array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('avatars',         'avatars',         true,  5242880,  array['image/png','image/jpeg','image/webp','image/avif','image/gif']),
  ('banners',         'banners',         true,  10485760, array['image/png','image/jpeg','image/webp','image/avif','image/gif','video/mp4']),
  ('cms',             'cms',             true,  10485760, array['image/png','image/jpeg','image/webp','image/avif','application/pdf']),
  ('review-images',   'review-images',   true,  5242880,  array['image/png','image/jpeg','image/webp','image/avif']),
  ('documents',       'documents',       false, 20971520, array['application/pdf','text/csv','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('reports',         'reports',         false, 20971520, array['application/pdf','text/csv','application/json'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- read policies
-- ---------------------------------------------------------------------------
drop policy if exists "mecart_public_buckets_read" on storage.objects;
create policy "mecart_public_buckets_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('products','product-gallery','categories','brands','avatars','banners','cms','review-images'));

drop policy if exists "mecart_private_buckets_staff_read" on storage.objects;
create policy "mecart_private_buckets_staff_read" on storage.objects
  for select to authenticated
  using (bucket_id in ('documents','reports') and public.is_staff());

-- ---------------------------------------------------------------------------
-- upload policies
-- ---------------------------------------------------------------------------
drop policy if exists "mecart_buckets_authenticated_insert" on storage.objects;
create policy "mecart_buckets_authenticated_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('products','product-gallery','categories','brands','avatars','banners','cms','review-images','documents','reports')
  );

-- ---------------------------------------------------------------------------
-- update / delete: owner or staff
-- ---------------------------------------------------------------------------
drop policy if exists "mecart_buckets_owner_update" on storage.objects;
create policy "mecart_buckets_owner_update" on storage.objects
  for update to authenticated
  using (owner = (select auth.uid()) or public.is_staff());

drop policy if exists "mecart_buckets_owner_delete" on storage.objects;
create policy "mecart_buckets_owner_delete" on storage.objects
  for delete to authenticated
  using (owner = (select auth.uid()) or public.is_staff());
