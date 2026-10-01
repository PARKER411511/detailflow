-- Optional, intentionally manual demo seed. Create these Auth users yourself first;
-- no password or insecure account is provisioned by this repository.
-- Replace the email values with the users you deliberately created in Supabase Auth.
do $$
declare
  demo_customer uuid;
  demo_admin uuid;
  service_id uuid;
  bay_id uuid;
  service_price integer;
  slot record;
  timezone_name text;
begin
  select id into demo_customer from auth.users where email = 'demo-customer@example.com';
  select id into demo_admin from auth.users where email = 'demo-admin@example.com';
  if demo_customer is null or demo_admin is null then raise exception 'Create the two demo Auth users intentionally before running this optional seed'; end if;
  insert into public.admin_members (user_id, note) values (demo_admin, 'Optional local demo operator') on conflict (user_id) do nothing;
  select id, price_cents into service_id, service_price from public.services where slug = 'the-refresh' and active;
  select id into bay_id from public.bays where name = 'DetailFlow bay 01';
  select timezone into timezone_name from public.business_settings where id = true;
  select available.starts_at, available.ends_at into slot
  from generate_series(1, 14) as day_offset
  cross join lateral public.get_available_slots(
    'the-refresh',
    ((now() at time zone timezone_name)::date + day_offset)::date
  ) as available
  order by available.starts_at
  limit 1;
  if service_id is null or bay_id is null or slot.starts_at is null then
    raise exception 'The Refresh or an available future slot is missing; apply the migration and check opening hours first';
  end if;
  insert into public.bookings (customer_id, service_id, bay_id, starts_at, ends_at, status, vehicle_description, customer_notes, total_price_cents)
  values (demo_customer, service_id, bay_id, slot.starts_at, slot.ends_at, 'confirmed', '2024 Demo Coupe', 'Optional fictional seed appointment', service_price)
  on conflict do nothing;
end $$;
