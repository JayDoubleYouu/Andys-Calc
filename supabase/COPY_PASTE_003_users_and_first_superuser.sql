-- Add email to profiles, first signup = superuser, allow admin/superuser to manage roles
-- Run AFTER COPY_PASTE_002_roles.sql

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first boolean;
begin
  select (count(*) = 0) into is_first from public.profiles;
  insert into public.profiles (id, username, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    case when is_first then 'superuser' else 'general' end,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

update public.profiles set email = (select email from auth.users where auth.users.id = profiles.id) where email is null;

create policy "Admin can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('superuser', 'admin'))
  );

create policy "Superuser or admin can update profiles"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('superuser', 'admin'))
  )
  with check (
    (role <> 'superuser') or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'superuser')
  );
