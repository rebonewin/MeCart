-- ============================================================================
-- MeCart Marketplace — seller storage
--
-- Product media is public; verification documents stay private and readable
-- only by the vendor team and marketplace staff.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vendor-assets', 'vendor-assets', true, 10485760,
   array['image/png','image/jpeg','image/webp','image/avif','image/gif']),
  ('vendor-documents', 'vendor-documents', false, 20971520,
   array['application/pdf','image/png','image/jpeg','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mecart_vendor_assets_read" on storage.objects;
create policy "mecart_vendor_assets_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vendor-assets');

drop policy if exists "mecart_vendor_documents_read" on storage.objects;
create policy "mecart_vendor_documents_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vendor-documents'
    and (
      public.is_staff()
      or exists (
        select 1
        from public.vendor_members vm
        where vm.user_id = (select auth.uid())
          and vm.status = 'ACTIVE'
          and (storage.foldername(name))[1] = vm.vendor_id::text
      )
    )
  );

drop policy if exists "mecart_vendor_uploads_insert" on storage.objects;
create policy "mecart_vendor_uploads_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('vendor-assets','vendor-documents')
    and exists (
      select 1
      from public.vendor_members vm
      where vm.user_id = (select auth.uid())
        and vm.status = 'ACTIVE'
        and (storage.foldername(name))[1] = vm.vendor_id::text
    )
  );

drop policy if exists "mecart_vendor_uploads_delete" on storage.objects;
create policy "mecart_vendor_uploads_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('vendor-assets','vendor-documents')
    and exists (
      select 1
      from public.vendor_members vm
      where vm.user_id = (select auth.uid())
        and vm.status = 'ACTIVE'
        and (storage.foldername(name))[1] = vm.vendor_id::text
    )
  );
