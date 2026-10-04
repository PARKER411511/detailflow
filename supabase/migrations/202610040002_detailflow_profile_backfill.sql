-- Backfill profiles for Auth users that existed before the DetailFlow schema.
-- This is idempotent and intentionally copies only the display name. Role and
-- admin membership remain explicit database state; user metadata cannot grant
-- staff access.
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u
on conflict (id) do nothing;
