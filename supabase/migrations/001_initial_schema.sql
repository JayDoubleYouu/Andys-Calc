-- Profiles: extend auth.users with username and role
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  role text not null default 'user' check (role in ('user', 'admin', 'manager'))
);

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 'user');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Stations: shared list, only admin/manager can write
create table if not exists public.stations (
  id text primary key,
  name text not null,
  postcode text not null
);

alter table public.stations enable row level security;

create policy "Anyone can read stations"
  on public.stations for select
  to authenticated
  using (true);

create policy "Admin or manager can insert stations"
  on public.stations for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

create policy "Admin or manager can update stations"
  on public.stations for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

create policy "Admin or manager can delete stations"
  on public.stations for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

-- Vehicles: shared list, only admin/manager can write
create table if not exists public.vehicles (
  id text primary key,
  make text not null,
  model text not null,
  mpg integer not null,
  registration text not null
);

alter table public.vehicles enable row level security;

create policy "Anyone can read vehicles"
  on public.vehicles for select
  to authenticated
  using (true);

create policy "Admin or manager can insert vehicles"
  on public.vehicles for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

create policy "Admin or manager can update vehicles"
  on public.vehicles for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

create policy "Admin or manager can delete vehicles"
  on public.vehicles for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
  );

-- Calculations (notes): per-user
create table if not exists public.calculations (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  from_name text not null,
  to_name text not null,
  distance numeric not null,
  time_minutes numeric not null,
  vehicle jsonb not null,
  fuel numeric not null,
  timestamp_ms bigint not null
);

alter table public.calculations enable row level security;

create policy "Users can read own calculations"
  on public.calculations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own calculations"
  on public.calculations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own calculations"
  on public.calculations for delete
  to authenticated
  using (auth.uid() = user_id);

-- Optional: allow update for own calculations (e.g. edit note)
create policy "Users can update own calculations"
  on public.calculations for update
  to authenticated
  using (auth.uid() = user_id);
