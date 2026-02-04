-- Grant superuser (superadmin) to j.gwilson@outlook.com
-- Run this in Supabase Dashboard → SQL Editor

-- Update by email (uses profiles.email if set)
update public.profiles
set role = 'superuser'
where email = 'j.gwilson@outlook.com';

-- If no row updated, the user may not have a profile yet (e.g. hasn't signed up).
-- Then update by auth.users email (links profile to auth user):
update public.profiles p
set role = 'superuser'
from auth.users u
where p.id = u.id and u.email = 'j.gwilson@outlook.com';

-- Confirm the change (optional)
select id, username, email, role from public.profiles where email = 'j.gwilson@outlook.com';
