-- ============================================================================
-- LinenLuxe Portal — BUG 1 fix
-- Store a per-order address snapshot so a one-off address typed at checkout is
-- used for THAT booking only (never added to the customer's saved addresses).
-- Also makes every order self-contained (good for invoices) regardless of later
-- edits/deletes to saved addresses. Safe to re-run.
-- Run once in the Supabase SQL Editor.
-- ============================================================================

alter table public.orders add column if not exists address jsonb;

-- (Optional) backfill existing orders' snapshot from their linked saved address,
-- so older orders also display a self-contained address.
update public.orders o
set address = jsonb_build_object(
  'label', a.label, 'line1', a.line1, 'line2', a.line2,
  'area', a.area, 'city', a.city, 'notes', a.notes
)
from public.addresses a
where o.address_id = a.id and o.address is null;
