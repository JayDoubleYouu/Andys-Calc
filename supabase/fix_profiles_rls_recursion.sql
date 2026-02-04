-- Fix: "infinite recursion detected in policy for relation profiles"
-- Cause: Policies on profiles were reading from profiles to check role, causing recursion.
-- Fix: Use a SECURITY DEFINER function to get current user's role (bypasses RLS).
-- Run this in Supabase Dashboard → SQL Editor.

-- 1. Function that returns the current user's role (does not trigger RLS on profiles)
create or replace function public.get_my_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  select role into r from public.profiles where id = auth.uid() limit 1;
  return coalesce(r, 'general');
end;
$$;

-- 2. Drop all existing policies on profiles that cause recursion
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Superuser can read all profiles" on public.profiles;
drop policy if exists "Admin can read all profiles" on public.profiles;
drop policy if exists "Superuser or admin can update profiles" on public.profiles;

-- 3. Recreate profiles policies using get_my_role() (no recursion)
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Superuser or admin can read all profiles"
  on public.profiles for select
  to authenticated
  using (public.get_my_role() in ('superuser', 'admin'));

create policy "Superuser or admin can update profiles"
  on public.profiles for update
  to authenticated
  using (public.get_my_role() in ('superuser', 'admin'))
  with check (
    (role <> 'superuser') or (public.get_my_role() = 'superuser')
  );

-- 4. Fix calculations policy (it also queried profiles)
drop policy if exists "Superuser can read all calculations" on public.calculations;
create policy "Superuser can read all calculations"
  on public.calculations for select
  to authenticated
  using (public.get_my_role() = 'superuser');

-- 5. Fix stations/vehicles policies to use get_my_role() (avoids any recursion when reading profiles elsewhere)
drop policy if exists "Admin or manager or superuser can insert stations" on public.stations;
drop policy if exists "Admin or manager or superuser can update stations" on public.stations;
drop policy if exists "Admin or manager or superuser can delete stations" on public.stations;
create policy "Admin or manager or superuser can insert stations"
  on public.stations for insert to authenticated
  with check (public.get_my_role() in ('admin', 'manager', 'superuser'));
create policy "Admin or manager or superuser can update stations"
  on public.stations for update to authenticated
  using (public.get_my_role() in ('admin', 'manager', 'superuser'));
create policy "Admin or manager or superuser can delete stations"
  on public.stations for delete to authenticated
  using (public.get_my_role() in ('admin', 'manager', 'superuser'));

drop policy if exists "Admin or manager or superuser can insert vehicles" on public.vehicles;
drop policy if exists "Admin or manager or superuser can update vehicles" on public.vehicles;
drop policy if exists "Admin or manager or superuser can delete vehicles" on public.vehicles;
create policy "Admin or manager or superuser can insert vehicles"
  on public.vehicles for insert to authenticated
  with check (public.get_my_role() in ('admin', 'manager', 'superuser'));
create policy "Admin or manager or superuser can update vehicles"
  on public.vehicles for update to authenticated
  using (public.get_my_role() in ('admin', 'manager', 'superuser'));
create policy "Admin or manager or superuser can delete vehicles"
  on public.vehicles for delete to authenticated
  using (public.get_my_role() in ('admin', 'manager', 'superuser'));
