-- Roles: superuser (see anyone), admin (edit stations/vehicles), general (calculator, bulk, MI, own notes only)
-- Run this AFTER 001_initial_schema.sql or COPY_PASTE_THIS.sql

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('superuser', 'admin', 'manager', 'general', 'user'));

alter table public.profiles alter column role set default 'general';

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 'general');
  return new;
end;
$$ language plpgsql security definer;

update public.profiles set role = 'general' where role = 'user';

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Superuser can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() limit 1) = 'superuser'
  );

create policy "Superuser can read all calculations"
  on public.calculations for select
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid() limit 1) = 'superuser'
  );

drop policy if exists "Admin or manager can insert stations" on public.stations;
create policy "Admin or manager or superuser can insert stations"
  on public.stations for insert to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );

drop policy if exists "Admin or manager can update stations" on public.stations;
create policy "Admin or manager or superuser can update stations"
  on public.stations for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );

drop policy if exists "Admin or manager can delete stations" on public.stations;
create policy "Admin or manager or superuser can delete stations"
  on public.stations for delete to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );

drop policy if exists "Admin or manager can insert vehicles" on public.vehicles;
create policy "Admin or manager or superuser can insert vehicles"
  on public.vehicles for insert to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );

drop policy if exists "Admin or manager can update vehicles" on public.vehicles;
create policy "Admin or manager or superuser can update vehicles"
  on public.vehicles for update to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );

drop policy if exists "Admin or manager can delete vehicles" on public.vehicles;
create policy "Admin or manager or superuser can delete vehicles"
  on public.vehicles for delete to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager', 'superuser'))
  );
