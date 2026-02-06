# Stations / Vehicles list not updating

If adding, editing, or deleting stations or vehicles doesn’t update the list (or you see a red error), do this:

## 1. Run the RLS fix in Supabase

Row Level Security (RLS) policies can block writes and cause “policy” or “permission” errors.

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open the file **`supabase/fix_profiles_rls_recursion.sql`** in this repo.
3. Copy **all** of its contents into a new query and click **Run**.

This fixes policies so superuser/admin/manager can insert, update, and delete stations and vehicles.

## 2. Check your role

Your user must have role **superuser**, **admin**, or **manager** to add/edit/delete.

In Supabase **SQL Editor** run:

```sql
select id, email, role from public.profiles where email = 'YOUR_EMAIL@example.com';
```

If `role` is not one of `superuser`, `admin`, `manager`, set it (e.g. superuser):

```sql
update public.profiles set role = 'superuser' where email = 'YOUR_EMAIL@example.com';
```

## 3. Use “Refresh list” in the app

On **Stations** and **Vehicles** pages there is a **Refresh list** button. Use it after add/edit/delete to refetch from the database.

## 4. If you still see an error

The red error box may mention “policy”, “RLS”, or “permission”. That usually means step 1 (run `fix_profiles_rls_recursion.sql`) is still needed, or your role is not superuser/admin/manager (step 2).
