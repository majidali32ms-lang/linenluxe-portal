-- ============================================================================
-- LinenLuxe Portal — Phase 3 tweak
-- Make signup also capture the phone number into profiles.
-- (The original trigger only copied full_name.) Safe to re-run.
-- Run this once in the Supabase SQL Editor.
-- ============================================================================

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
  return new;
end $$;
