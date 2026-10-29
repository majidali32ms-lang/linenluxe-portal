-- ============================================================================
-- LinenLuxe Portal — Restrict role management to ADMIN/OWNER only
-- A regular 'staff' member can manage orders, but CANNOT change anyone's role
-- (promote/revoke) — only 'admin' can. Enforced in the database (not just the UI).
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Only an ADMIN (or a privileged SQL/backend context where auth.uid() is NULL)
-- may change a role. Any logged-in non-admin (customer OR staff) cannot.
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

-- A user may edit their OWN profile; only an admin may edit (e.g. revoke) others.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
-- IMPORTANT: make your OWNER account an admin so you can manage staff.
-- (Staff accounts created earlier are role 'staff' and can't manage access.)
-- Edit the email and run:
--   update public.profiles set role = 'admin' where email = 'OWNER-EMAIL-HERE';
-- ----------------------------------------------------------------------------
