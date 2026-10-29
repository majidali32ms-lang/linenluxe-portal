-- ============================================================================
-- LinenLuxe Portal — Phase 7 fix
-- The original prevent_role_escalation trigger reverted ALL role changes when
-- auth.uid() was NULL (i.e. in the SQL Editor / backend), which blocked staff
-- promotion. This version only blocks a LOGGED-IN non-staff user (the actual
-- app self-escalation attack), and allows privileged SQL/backend changes.
-- Safe to re-run. Run once in the Supabase SQL Editor.
-- ============================================================================

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_staff() then
    new.role = old.role;   -- silently keep the old role
  end if;
  return new;
end $$;

-- Promote a staff account (edit the email):
-- update public.profiles set role = 'staff' where email = 'staff@linenluxelaundry.com';
