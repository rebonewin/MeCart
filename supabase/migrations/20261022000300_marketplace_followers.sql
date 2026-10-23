-- Keep denormalised follower counts consistent without granting customer writes
-- on the stores table.
create or replace function public.sync_store_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.stores
      set follower_count = follower_count + 1
      where id = new.store_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.stores
      set follower_count = greatest(0, follower_count - 1)
      where id = old.store_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_store_follower_count on public.store_followers;
create trigger sync_store_follower_count
  after insert or delete on public.store_followers
  for each row execute function public.sync_store_follower_count();
