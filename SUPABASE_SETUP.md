# Supabase setup for Andys Calculator

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Environment variables

Create `.env.local` in the project root with your project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://yfbvonqanfyfjanmehhq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste your anon public key here>
```

Add your **OpenRouteService** key too if you use the calculator:

```
NEXT_PUBLIC_ORS_API_KEY=your-ors-key
```

## 3. Run the database migration

1. In the Supabase dashboard go to **SQL Editor** (left sidebar).
2. Click **New query** and paste the **entire** SQL below.
3. Click **Run** (or press Cmd/Ctrl+Enter). You should see “Success. No rows returned.”
4. This creates:
   - `profiles` (id, username, role) with trigger to create a row on signup
   - `stations` and `vehicles` with RLS (read all; write only for admin/manager)
   - `calculations` with RLS (each user sees only their own notes)

**SQL to paste in the SQL Editor:**

**Important:** Copy only the SQL. Do **not** copy the line that says ` ```sql ` at the start or ` ``` ` at the end—those are markdown only and will cause a "syntax error at or near ```" in Supabase. Easiest: open the file `supabase/migrations/001_initial_schema.sql` in your project and copy everything from that file into the SQL Editor.

```sql
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

create policy "Users can update own calculations"
  on public.calculations for update
  to authenticated
  using (auth.uid() = user_id);
```

## 4. Enable email auth

In **Authentication → Providers**, ensure **Email** is enabled. Configure email templates if you use confirmation.

## 5. (Optional) Three-tier roles: superuser, admin, general

After running the first SQL migration, you can add role tiers. In **SQL Editor**, open **`supabase/COPY_PASTE_002_roles.sql`**, copy its contents (no markdown), paste, and run.

**Roles:**

| Role        | Access |
|------------|--------|
| **superuser** | Can view anyone’s Notes and MI (dropdown to pick user). Can add/edit Stations and Vehicles. Sees all nav links. |
| **admin**     | Can add/edit Stations and Vehicles. Sees Calculator, Stations, Vehicles, Bulk Upload, Notes, MI. |
| **general**   | Sees only Calculator, Bulk Upload, Notes (own), MI (own). No Stations or Vehicles. |

New signups get **general** by default.

**Set roles in SQL** (replace `user-uuid` with the user’s id from **Authentication → Users**):

```sql
-- Make someone superuser (can view anyone's notes/MI)
update public.profiles set role = 'superuser' where id = 'user-uuid';

-- Make someone admin (can edit stations/vehicles)
update public.profiles set role = 'admin' where id = 'user-uuid';

-- Make someone general (default; calculator, bulk, MI, own notes only)
update public.profiles set role = 'general' where id = 'user-uuid';
```

## 6. (Optional) User management and first superuser

Run **`supabase/COPY_PASTE_003_users_and_first_superuser.sql`** in the SQL Editor (after 002). This:

- Adds **email** to profiles (so you can see who signed in).
- Makes the **first person who ever signs up** a **superuser** automatically.
- Lets **superuser and admin** see all users and change roles from the app.

**Where permissions are set**

- In the app: **Users** (nav link, visible only to superuser and admin). There you see everyone who has signed in (email, username, role) and can set each user to **General**, **Admin**, or **Manager**. Role cannot be chosen at sign-in.
- Superuser cannot be assigned from the UI. Only these two can be superuser:
  1. The **first account** that signs up (set automatically).
  2. **You**: if you are not the first signup, set yourself in SQL (replace with your user id from **Authentication → Users**):

```sql
update public.profiles set role = 'superuser' where id = 'your-user-uuid';
```

## 7. Assign admin/manager (if you didn’t run 002)

If you only ran the first migration, new users get role `user`. To allow add/edit of stations and vehicles:

```sql
update public.profiles set role = 'admin' where id = 'user-uuid';
```

## 8. Optional: seed stations and vehicles

The app merges DB data with built-in defaults, so it works without seeding. To prefill the database with the app’s default stations and vehicles, you can run a one-off seed (e.g. from a script or API route) that inserts from `lib/stations.ts` and `lib/vehicles.ts`. Only users with role `admin` or `manager` can insert.
