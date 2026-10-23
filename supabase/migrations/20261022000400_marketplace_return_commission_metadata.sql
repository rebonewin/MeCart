-- Ensure the return refund ledger and audit trail capture the commission
-- reversal amount calculated by the marketplace finance function.
create or replace function public.process_vendor_return(
  p_return_id uuid,
  p_status public.vendor_return_status,
  p_refund_amount numeric default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.vendor_returns%rowtype;
  v_refund numeric(14,2);
  v_commission_reversal numeric(14,2);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_return from public.vendor_returns where id = p_return_id for update;
  if not found then raise exception 'Return not found'; end if;

  if not (public.is_staff() or public.has_vendor_permission(v_return.vendor_id, 'returns.manage')) then
    raise exception 'Not authorized';
  end if;

  v_refund := coalesce(p_refund_amount, v_return.refund_amount, 0);
  if v_refund < 0 then raise exception 'Refund cannot be negative'; end if;
  select coalesce(round(v_refund * (oi.commission_amount / nullif(oi.total, 0)), 2), 0)
    into v_commission_reversal
  from public.order_items oi
  where oi.id = v_return.order_item_id;

  update public.vendor_returns
  set status = p_status,
      refund_amount = case when p_status = 'REFUNDED' then v_refund else refund_amount end,
      resolution_notes = coalesce(p_notes, resolution_notes),
      reviewed_at = case when p_status in ('APPROVED', 'REJECTED') then now() else reviewed_at end,
      received_at = case when p_status = 'RECEIVED' then now() else received_at end,
      refunded_at = case when p_status = 'REFUNDED' then now() else refunded_at end,
      updated_at = now()
  where id = p_return_id;

  if p_status = 'REFUNDED' then
    insert into public.vendor_ledger_entries (
      vendor_id, store_id, order_id, order_item_id, type, amount, description, available_at, metadata
    ) values (
      v_return.vendor_id, v_return.store_id, v_return.order_id, v_return.order_item_id,
      'REFUND', -v_refund, 'Marketplace return refund', now(),
      jsonb_build_object(
        'return_id', p_return_id,
        'order_id', v_return.order_id,
        'commission_reversal', v_commission_reversal
      )
    );

    insert into public.vendor_notifications (vendor_id, type, title, body, link, data)
    values (
      v_return.vendor_id, 'ORDER', 'Return refunded',
      format('RMA %s was refunded for $%s.', v_return.rma_number, to_char(v_refund, 'FM999999990.00')),
      '/seller/returns',
      jsonb_build_object('return_id', p_return_id, 'commission_reversal', v_commission_reversal)
    );
  end if;

  insert into public.vendor_audit_logs (vendor_id, actor_id, action, resource, metadata)
  values (v_return.vendor_id, auth.uid(), 'RETURN_' || p_status, p_return_id::text,
          jsonb_build_object('refund_amount', v_refund, 'commission_reversal', v_commission_reversal));
end $$;
