-- DetailFlow hosted Supabase security verification (rollback-only)
--
-- Run this in the SQL Editor only after all committed migrations have been
-- installed. It uses three fixed, disposable Auth fixtures with
-- @example.invalid addresses and no passwords. It never calls the Auth API,
-- grants an existing user admin access, or touches rows outside these IDs.
-- The single transaction ends with ROLLBACK, then read-only counts confirm
-- that the fixtures and their records are gone.

begin;

create temporary table df_hosted_verify_state (
  customer_one uuid not null,
  customer_two uuid not null,
  admin_user uuid not null,
  service_slug text not null,
  service_price_cents integer not null,
  service_duration_minutes integer not null,
  primary_starts_at timestamptz,
  primary_ends_at timestamptz,
  alternate_starts_at timestamptz,
  alternate_ends_at timestamptz,
  booking_one uuid,
  booking_two uuid,
  booking_three uuid
);

insert into df_hosted_verify_state (customer_one, customer_two, admin_user, service_slug, service_price_cents, service_duration_minutes)
select
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid,
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid,
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid,
  s.slug,
  s.price_cents,
  s.duration_minutes
from public.services s
where s.active
order by s.display_order, s.id
limit 1;

do $$
begin
  if not exists (select 1 from df_hosted_verify_state) then
    raise exception 'hosted verification requires at least one active service';
  end if;
  if exists (
    select 1
    from auth.users
    where id in (
      'f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid,
      'f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid,
      'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid
    )
    or email in ('detailflow-hosted-customer-one@example.invalid', 'detailflow-hosted-customer-two@example.invalid', 'detailflow-hosted-admin@example.invalid')
  ) then
    raise exception 'hosted verification fixture ID or email already exists; refusing to write';
  end if;
  if exists (
    select 1 from public.admin_members
    where user_id = 'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid
  ) then
    raise exception 'hosted verification admin fixture already exists; refusing to write';
  end if;
end;
$$;

-- These are direct disposable database fixtures, not Auth API accounts. No
-- password or password hash is supplied, and all rows roll back below.
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid, 'authenticated', 'authenticated', 'detailflow-hosted-customer-one@example.invalid', now(), jsonb_build_object('full_name', 'DetailFlow Hosted Customer One'), now(), now()),
  ('f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid, 'authenticated', 'authenticated', 'detailflow-hosted-customer-two@example.invalid', now(), jsonb_build_object('full_name', 'DetailFlow Hosted Customer Two'), now(), now()),
  ('f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid, 'authenticated', 'authenticated', 'detailflow-hosted-admin@example.invalid', now(), jsonb_build_object('full_name', 'DetailFlow Hosted Admin Fixture'), now(), now());

insert into public.admin_members (user_id, note)
values ('f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid, 'Temporary hosted verification fixture');

grant select, insert, update on df_hosted_verify_state to authenticated;

do $$
begin
  if (select count(*) from public.profiles where id in (
    'f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid,
    'f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid,
    'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid
  )) <> 3 then
    raise exception 'new-user profile trigger/backfill did not create all fixture profiles';
  end if;
  raise notice 'PASS fixture Auth rows and profiles are isolated and disposable';
end;
$$;

-- Select two non-overlapping, future slots through the real availability RPC.
-- The second slot starts at least 30 minutes after the first service ends.
with settings as (
  select timezone, booking_horizon_days from public.business_settings where id = true
), candidate_dates as (
  select ((now() at time zone settings.timezone)::date + day_offset.n)::date as local_date
  from settings
  cross join lateral generate_series(1, settings.booking_horizon_days) as day_offset(n)
), candidate_slots as (
  select slots.starts_at, slots.ends_at
  from candidate_dates
  cross join df_hosted_verify_state state
  cross join lateral public.get_available_slots(state.service_slug, candidate_dates.local_date) slots
  where slots.starts_at > now() + interval '26 hours'
), primary_slot as (
  select starts_at, ends_at from candidate_slots order by starts_at limit 1
), alternate_slot as (
  select candidate_slots.starts_at, candidate_slots.ends_at
  from candidate_slots
  cross join primary_slot
  where candidate_slots.starts_at >= primary_slot.ends_at + interval '30 minutes'
  order by candidate_slots.starts_at
  limit 1
)
update df_hosted_verify_state state
set primary_starts_at = primary_slot.starts_at,
    primary_ends_at = primary_slot.ends_at,
    alternate_starts_at = alternate_slot.starts_at,
    alternate_ends_at = alternate_slot.ends_at
from primary_slot, alternate_slot;

do $$
begin
  if exists (select 1 from df_hosted_verify_state where primary_starts_at is null or alternate_starts_at is null) then
    raise exception 'hosted verification could not find two future non-overlapping availability slots';
  end if;
end;
$$;

-- Customer one creates the first booking through the customer RPC. The RPC
-- derives service price and duration; no client-supplied price is accepted.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
with created as (
  select created_booking.id
  from df_hosted_verify_state state
  cross join lateral public.create_booking(state.service_slug, state.primary_starts_at, 'Hosted verification vehicle', 'Hosted verification note') created_booking
)
update df_hosted_verify_state state
set booking_one = created.id
from created;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
do $$
declare
  state record;
  own_count integer;
  stored_price integer;
  stored_minutes integer;
begin
  select * into state from df_hosted_verify_state;
  select count(*)::integer, max(total_price_cents), round(extract(epoch from max(ends_at - starts_at)) / 60)::integer
    into own_count, stored_price, stored_minutes
  from public.bookings where id = state.booking_one;
  if own_count <> 1 or stored_price <> state.service_price_cents or stored_minutes <> state.service_duration_minutes then
    raise exception 'customer booking did not persist server-derived price/duration';
  end if;
  raise notice 'PASS customer own-read and stored price/duration';
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_two::text from df_hosted_verify_state), true);
do $$
declare
  state record;
  visible_count integer;
begin
  select * into state from df_hosted_verify_state;
  select count(*)::integer into visible_count from public.bookings where id = state.booking_one;
  if visible_count <> 0 then
    raise exception 'customer isolation failed: second customer can read first customer booking';
  end if;
  raise notice 'PASS customer-to-customer booking read isolation';
end;
$$;
reset role;

-- Direct table writes, admin membership writes, staff RPCs, and private notes
-- are denied for a normal authenticated customer.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
do $$
declare
  state record;
  succeeded boolean := false;
  note_read_succeeded boolean := false;
  admin_call_succeeded boolean := false;
  ignored_note text;
begin
  select * into state from df_hosted_verify_state;
  begin
    insert into public.bookings (customer_id, service_id, bay_id, starts_at, ends_at, vehicle_description, total_price_cents)
    select state.customer_one, services.id, bays.id, state.alternate_starts_at, state.alternate_ends_at, 'Direct DML must fail', services.price_cents
    from public.services, public.bays
    where services.slug = state.service_slug and bays.active
    limit 1;
    succeeded := true;
  exception when insufficient_privilege then null;
  end;
  if succeeded then raise exception 'customer direct booking INSERT unexpectedly succeeded'; end if;

  succeeded := false;
  begin
    update public.bookings
    set total_price_cents = 0, status = 'cancelled'::public.booking_status
    where id = state.booking_one;
    succeeded := true;
  exception when insufficient_privilege then null;
  end;
  if succeeded then raise exception 'customer direct booking price/status UPDATE unexpectedly succeeded'; end if;

  succeeded := false;
  begin
    insert into public.admin_members (user_id) values (state.customer_one);
    succeeded := true;
  exception when insufficient_privilege then null;
  end;
  if succeeded then raise exception 'customer self-admin INSERT unexpectedly succeeded'; end if;

  begin
    select b.admin_notes into ignored_note from public.bookings b where b.id = state.booking_one;
    note_read_succeeded := true;
  exception when insufficient_privilege then null;
  end;
  if note_read_succeeded then raise exception 'customer staff-note read unexpectedly succeeded'; end if;

  begin
    perform public.admin_update_booking(state.booking_one, 'requested'::public.booking_status, 'Customer must not write staff notes');
    admin_call_succeeded := true;
  exception when others then
    if sqlstate not in ('P0001', '42501') then raise; end if;
  end;
  if admin_call_succeeded then raise exception 'customer admin booking RPC unexpectedly succeeded'; end if;
  raise notice 'PASS direct DML, self-admin, staff-note, and admin RPC denials';
end;
$$;
reset role;

-- The fixture admin confirms the booking and writes a private note. The
-- customer then observes the status transition through its normal projection.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select admin_user::text from df_hosted_verify_state), true);
with confirmed as (
  select confirmed_booking.id
  from df_hosted_verify_state state
  cross join lateral public.admin_update_booking(state.booking_one, 'confirmed'::public.booking_status, 'Hosted verification staff note') confirmed_booking
)
select count(*) as admin_confirmation_rows from confirmed;
do $$
declare
  state record;
  detail record;
begin
  select * into state from df_hosted_verify_state;
  select * into detail from public.admin_get_booking(state.booking_one);
  if detail.status <> 'confirmed'::public.booking_status or detail.admin_notes <> 'Hosted verification staff note' then
    raise exception 'admin confirmation or staff note did not persist';
  end if;
  raise notice 'PASS admin confirmation and private staff note';
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
do $$
declare
  state record;
  visible_status public.booking_status;
begin
  select * into state from df_hosted_verify_state;
  select status into visible_status from public.bookings where id = state.booking_one;
  if visible_status <> 'confirmed'::public.booking_status then
    raise exception 'customer did not observe admin confirmation';
  end if;
  raise notice 'PASS customer record reflects admin confirmation';
end;
$$;
reset role;

-- A second customer cannot overlap the confirmed booking; the shared GiST
-- exclusion constraint must surface SQLSTATE 23P01 through the RPC.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_two::text from df_hosted_verify_state), true);
do $$
declare
  state record;
  succeeded boolean := false;
begin
  select * into state from df_hosted_verify_state;
  begin
    perform * from public.create_booking(state.service_slug, state.primary_starts_at, 'Overlap must fail', '');
    succeeded := true;
  exception when exclusion_violation then null;
  end;
  if succeeded then raise exception 'overlapping booking unexpectedly succeeded'; end if;
  raise notice 'PASS overlapping booking rejected with exclusion constraint';
end;
$$;
reset role;

-- Rescheduling releases the original interval. Cancellation then releases the
-- moved interval; a second customer proves each interval can be booked again.
set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
with moved as (
  select moved_booking.id
  from df_hosted_verify_state state
  cross join lateral public.update_my_booking(state.booking_one, 'reschedule', state.alternate_starts_at) moved_booking
)
select count(*) as reschedule_rows from moved;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_two::text from df_hosted_verify_state), true);
with created as (
  select created_booking.id
  from df_hosted_verify_state state
  cross join lateral public.create_booking(state.service_slug, state.primary_starts_at, 'Released original slot', '') created_booking
)
update df_hosted_verify_state state
set booking_two = created.id
from created;
with cancelled as (
  select cancelled_booking.id
  from df_hosted_verify_state state
  cross join lateral public.update_my_booking(state.booking_two, 'cancel', null) cancelled_booking
)
select count(*) as cancellation_rows from cancelled;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_one::text from df_hosted_verify_state), true);
with cancelled as (
  select cancelled_booking.id
  from df_hosted_verify_state state
  cross join lateral public.update_my_booking(state.booking_one, 'cancel', null) cancelled_booking
)
select count(*) as moved_cancellation_rows from cancelled;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select customer_two::text from df_hosted_verify_state), true);
with created as (
  select created_booking.id
  from df_hosted_verify_state state
  cross join lateral public.create_booking(state.service_slug, state.alternate_starts_at, 'Released moved slot', '') created_booking
)
update df_hosted_verify_state state
set booking_three = created.id
from created;
reset role;

do $$
declare
  state record;
begin
  select * into state from df_hosted_verify_state;
  if (select status from public.bookings where id = state.booking_one) <> 'cancelled'::public.booking_status
     or (select status from public.bookings where id = state.booking_two) <> 'cancelled'::public.booking_status
     or (select count(*) from public.occupancy where source_id in (state.booking_one, state.booking_two)) <> 0
     or (select count(*) from public.occupancy where source_id = state.booking_three) <> 1 then
    raise exception 'reschedule/cancel did not release and recreate the expected occupancy intervals';
  end if;
  raise notice 'PASS reschedule and cancellation release occupancy intervals';
end;
$$;

reset role;
do $$
begin
  raise notice 'PASS all hosted verification assertions; rolling back every fixture and mutation';
end;
$$;

rollback;

select 'remaining fixture Auth users' as check_name,
       count(*)::bigint as remaining_rows
from auth.users
where email in ('detailflow-hosted-customer-one@example.invalid', 'detailflow-hosted-customer-two@example.invalid', 'detailflow-hosted-admin@example.invalid')
union all
select 'remaining fixture profiles', count(*)::bigint
from public.profiles
where id in (
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid,
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid,
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid
)
union all
select 'remaining fixture admin memberships', count(*)::bigint
from public.admin_members
where user_id = 'f4c8e9e0-7b9a-4cc3-9a4b-000000000003'::uuid
union all
select 'remaining fixture bookings', count(*)::bigint
from public.bookings
where customer_id in (
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000001'::uuid,
  'f4c8e9e0-7b9a-4cc3-9a4b-000000000002'::uuid
);
