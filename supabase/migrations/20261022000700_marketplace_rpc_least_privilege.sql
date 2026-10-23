-- Least-privilege cleanup for marketplace RPCs that require a signed-in actor.
-- `log_vendor_audit` already enforces vendor membership or staff status, but
-- anonymous callers have no reason to reach it through PostgREST.

revoke execute on function public.log_vendor_audit(uuid, text, text, jsonb) from public, anon;
grant execute on function public.log_vendor_audit(uuid, text, text, jsonb) to authenticated;
