-- ============================================================================
-- LinenLuxe Portal — Customer price transparency
-- Preserve each line's ORIGINAL estimated rate so the customer can see
-- estimate -> final when staff change a service's rate after inspection.
-- (Staff edits change unit_price/line_total; est_unit_price stays the original.)
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

alter table public.order_items add column if not exists est_unit_price numeric(10,2);

-- Backfill existing lines: assume current rate was the estimate (no change shown).
update public.order_items set est_unit_price = unit_price where est_unit_price is null;

notify pgrst, 'reload schema';
