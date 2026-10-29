-- ============================================================================
-- LinenLuxe Portal — BUG 2 fix
-- Allow staff/admin to UPDATE order_items, so they can set per-service final
-- rates on an order (each line independently). Customers still can't edit lines.
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

drop policy if exists order_items_update on public.order_items;
create policy order_items_update on public.order_items for update
  using (public.is_staff()) with check (public.is_staff());

notify pgrst, 'reload schema';
