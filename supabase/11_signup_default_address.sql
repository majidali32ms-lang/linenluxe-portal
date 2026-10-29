-- ============================================================================
-- LinenLuxe Portal — Save the signup address as the customer's DEFAULT address
-- The signup form now collects a pickup address; this trigger stores it as the
-- customer's default saved address (so checkout pre-fills it automatically).
-- Runs as SECURITY DEFINER, so it works even with email confirmation ON.
-- Safe to re-run. Run once in the Supabase SQL Editor.
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
