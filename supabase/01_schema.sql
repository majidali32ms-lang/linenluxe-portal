-- ============================================================================
-- LinenLuxe Portal — Phase 1: Database schema
-- Run this in the Supabase SQL Editor (entire file, one shot).
-- Safe to re-run: it drops and recreates its own objects.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";   -- for gen_random_uuid()

-- ---------- Enums ----------
do $$ begin
  create type public.user_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'booked', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.express_type as enum ('standard', 'next_day', 'same_day');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ---------- profiles (1 row per auth user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- addresses (saved pickup/delivery addresses) ----------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text,                       -- e.g. "Home", "Office"
  line1       text not null,              -- building / villa / street
  line2       text,                       -- apartment / unit / floor
  area        text default 'Al Furjan',
  city        text default 'Dubai',
  emirate     text default 'Dubai',
  notes       text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses(user_id);

-- ---------- services (the 22-item catalog, seeded from the website) ----------
create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,     -- matches website key, e.g. 'dry-cleaning'
  name          text not null,
  tagline       text,
  description   text,
  image_path    text,                     -- website-relative path, copied into app in Phase 4
  unit          text,                     -- 'piece' | 'bag' | 'sq. cm' | 'seat'  (null for quote-only)
  base_price    numeric(10,2),            -- the "From AED X" floor used as the cart unit rate (null for quote-only)
  price_label   text,                     -- exact website label, e.g. 'From AED 15'
  is_quote_only boolean not null default false,  -- Hotel/Restaurant/Commercial -> "Request a quote", never in cart
  category      text,                     -- loose grouping for future filtering
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists services_active_sort_idx on public.services(is_active, sort_order);

-- ---------- orders ----------
create sequence if not exists public.order_number_seq;

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text unique not null default ('LL' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  customer_id       uuid not null references public.profiles(id) on delete restrict,
  address_id        uuid references public.addresses(id) on delete set null,
  status            public.order_status not null default 'booked',

  -- pickup scheduling
  pickup_date       date,
  pickup_slot       text,                 -- e.g. '09:00-12:00'
  notes             text,
  express           public.express_type not null default 'standard',

  -- money (all AED). Cart figures are an ESTIMATE; staff sets final_total after pickup.
  subtotal          numeric(10,2) not null default 0,   -- sum of line_totals
  express_surcharge numeric(10,2) not null default 0,
  discount          numeric(10,2) not null default 0,
  estimated_total   numeric(10,2) not null default 0,   -- subtotal + surcharge - discount
  final_total       numeric(10,2),                       -- null until staff confirms after inspection

  assigned_staff_id uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists orders_status_idx   on public.orders(status);

-- ---------- order_items (cart lines; values snapshotted at order time) ----------
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  service_id   uuid references public.services(id) on delete set null,
  service_name text not null,             -- snapshot, survives later price/name edits
  unit         text,                      -- snapshot
  unit_price   numeric(10,2) not null,    -- snapshot of base_price at order time
  quantity     integer not null check (quantity > 0),
  line_total   numeric(10,2) not null,    -- unit_price * quantity
  created_at   timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------- order_status_history (timeline audit, drives realtime tracking) ----------
create table if not exists public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      public.order_status not null,
  note        text,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Role check helper (SECURITY DEFINER bypasses RLS -> no policy recursion)
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

-- Admin check — used to gate role management (promote/revoke) to owners only.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Auto-create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do nothing;

  -- Save the address entered at signup as the customer's DEFAULT saved address
  if coalesce(new.raw_user_meta_data->>'address_line1', '') <> '' then
    insert into public.addresses (user_id, label, line1, line2, area, city, is_default)
    values (
      new.id,
      'Home',
      new.raw_user_meta_data->>'address_line1',
      nullif(new.raw_user_meta_data->>'address_line2', ''),
      coalesce(nullif(new.raw_user_meta_data->>'address_area', ''), 'Al Furjan'),
      coalesce(nullif(new.raw_user_meta_data->>'address_city', ''), 'Dubai'),
      true
    );
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role management is ADMIN-only: a logged-in non-admin (customer OR staff) cannot
-- change any role. Privileged contexts (SQL editor / backend, auth.uid() NULL) and
-- admins are allowed to assign roles.
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role = old.role;   -- silently keep the old role
  end if;
  return new;
end $$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Record an initial 'booked' history row when an order is created
create or replace function public.log_order_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_status_history (order_id, status, changed_by, note)
  values (new.id, new.status, new.customer_id, 'Order placed');
  return new;
end $$;

drop trigger if exists orders_log_created on public.orders;
create trigger orders_log_created after insert on public.orders
  for each row execute function public.log_order_created();

-- Record a history row whenever status changes
create or replace function public.log_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists orders_log_status_change on public.orders;
create trigger orders_log_status_change after update on public.orders
  for each row execute function public.log_order_status_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.addresses            enable row level security;
alter table public.services             enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;

-- ---- profiles ----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---- addresses (owner full CRUD; staff can read) ----
drop policy if exists addresses_select on public.addresses;
create policy addresses_select on public.addresses for select
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists addresses_insert on public.addresses;
create policy addresses_insert on public.addresses for insert
  with check (user_id = auth.uid());

drop policy if exists addresses_update on public.addresses;
create policy addresses_update on public.addresses for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists addresses_delete on public.addresses;
create policy addresses_delete on public.addresses for delete
  using (user_id = auth.uid());

-- ---- services (any signed-in user reads active catalog; only admin writes) ----
drop policy if exists services_select on public.services;
create policy services_select on public.services for select
  using (is_active or public.is_staff());

drop policy if exists services_write on public.services;
create policy services_write on public.services for all
  using (public.is_staff()) with check (public.is_staff());

-- ---- orders (customer sees/creates own; staff sees/updates all) ----
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select
  using (customer_id = auth.uid() or public.is_staff());

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert
  with check (customer_id = auth.uid());

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update
  using (public.is_staff()) with check (public.is_staff());

-- ---- order_items (tied to the parent order's ownership) ----
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select
  using (
    public.is_staff() or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

-- ---- order_status_history (read for own/staff; only staff writes manual rows) ----
drop policy if exists osh_select on public.order_status_history;
create policy osh_select on public.order_status_history for select
  using (
    public.is_staff() or exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists osh_insert on public.order_status_history;
create policy osh_insert on public.order_status_history for insert
  with check (public.is_staff());

-- ============================================================================
-- REALTIME (Phase 6 live tracking) — publish order + history changes
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.order_status_history;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- DONE. Next: run 02_seed_services.sql to load the 22 services.
-- ============================================================================
