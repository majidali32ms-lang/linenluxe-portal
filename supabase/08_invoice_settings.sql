-- ============================================================================
-- LinenLuxe Portal — E-invoice support
--   1) orders.is_paid  -> payment status (default false = Payment Pending)
--   2) app_settings    -> single-row business settings (VAT 5% on/off, default OFF)
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

-- 1) Payment status on each order
alter table public.orders add column if not exists is_paid boolean not null default false;

-- 2) Global business settings (one row, id = 1)
create table if not exists public.app_settings (
  id          int primary key default 1,
  vat_enabled boolean not null default false,
  updated_at  timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id, vat_enabled)
values (1, false)
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- Any signed-in user can read the flag (customers need it to render their invoice)
drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings for select
  using (auth.uid() is not null);

-- Only staff/admin can change it
drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings for update
  using (public.is_staff()) with check (public.is_staff());

notify pgrst, 'reload schema';
