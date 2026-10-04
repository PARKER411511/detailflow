-- Run this manually in the Supabase SQL editor after creating the Auth user.
-- Replace the email literal before execution. This script never creates users
-- and never grants admin access based on a client-provided request.
do $$
declare
  target_email text := lower(trim('REPLACE_WITH_EXISTING_AUTH_EMAIL'));
  target_id uuid;
begin
  if target_email = '' or target_email = 'replace_with_existing_auth_email' then
    raise exception 'Replace the admin email with an existing Supabase Auth user before running this script';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = target_email
  limit 1;

  if target_id is null then
    raise exception 'No Auth user exists for %; create and verify that user in Supabase Auth first', target_email;
  end if;

  insert into public.admin_members (user_id, note)
  values (target_id, 'Provisioned manually by studio owner')
  on conflict (user_id) do update set note = excluded.note;

  if not exists (select 1 from public.admin_members where user_id = target_id) then
    raise exception 'Admin provisioning did not persist for %', target_email;
  end if;
end
$$;

-- Verify the exact membership without exposing the admin table to clients.
select u.email, a.created_at, a.note
from public.admin_members a
join auth.users u on u.id = a.user_id
where lower(u.email) = lower('REPLACE_WITH_EXISTING_AUTH_EMAIL');
