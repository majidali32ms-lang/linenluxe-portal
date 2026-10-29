-- ============================================================================
-- LinenLuxe Portal — Payment method on the order/invoice
-- 'cod' = Cash on Delivery (default) | 'online' = Online
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

alter table public.orders add column if not exists payment_method text not null default 'cod';

notify pgrst, 'reload schema';
