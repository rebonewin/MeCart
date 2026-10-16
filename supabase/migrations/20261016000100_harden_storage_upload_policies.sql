-- ============================================================================
-- MeCart Enterprise — harden storage upload policies
--
-- Customers may only upload to their own-facing buckets (avatars, review
-- images). Every catalog/content bucket, plus the private documents/reports
-- buckets, is limited to staff (admin/manager). Read/update/delete policies
-- from 0005 remain in force.
-- ============================================================================

drop policy if exists "mecart_buckets_authenticated_insert" on storage.objects;

drop policy if exists "mecart_customer_uploads_insert" on storage.objects;
create policy "mecart_customer_uploads_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars','review-images'));

drop policy if exists "mecart_staff_uploads_insert" on storage.objects;
create policy "mecart_staff_uploads_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('products','product-gallery','categories','brands','banners','cms','documents','reports')
    and public.is_staff()
  );
