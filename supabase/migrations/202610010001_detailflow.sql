-- DetailFlow schedule schema. Run with Supabase CLI: supabase db push
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.booking_status as enum ('requested', 'confirmed', 'in_service', 'completed', 'cancelled');
create type public.occupancy_kind as enum ('booking', 'blocked');

create table public.business_settings (
  id boolean primary key default true check (id),
  studio_name text not null default 'DetailFlow',
  timezone text not null default 'America/New_York',
  currency char(3) not null default 'USD',
  booking_horizon_days integer not null default 60 check (booking_horizon_days between 1 and 365),
  slot_minutes integer not null default 30 check (slot_minutes in (15, 30, 60)),
  cancellation_hours integer not null default 24 check (cancellation_hours >= 0),
  updated_at timestamptz not null default now()
);
insert into public.business_settings (id) values (true) on conflict (id) do nothing;

create table public.bays (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true
);
insert into public.bays (name) values ('DetailFlow bay 01') on conflict (name) do nothing;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  eyebrow text not null default '',
  description text not null,
  details text not null default '',
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 2880),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opening_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  check ((closed and opens_at is null and closes_at is null) or (not closed and opens_at is not null and closes_at is not null and opens_at < closes_at))
);
insert into public.opening_hours (weekday, opens_at, closes_at, closed) values
  (0, null, null, true), (1, null, null, true), (2, '08:00', '18:00', false),
  (3, '08:00', '18:00', false), (4, '08:00', '18:00', false),
  (5, '08:00', '18:00', false), (6, '08:00', '18:00', false)
on conflict (weekday) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('DF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_id uuid not null references auth.users(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  bay_id uuid not null references public.bays(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'requested',
  vehicle_description text not null,
  customer_notes text not null default '',
  admin_notes text not null default '',
  total_price_cents integer not null check (total_price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  bay_id uuid not null references public.bays(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- The single source of truth for bay occupancy. Both customer bookings and admin blocks
-- are mirrored here by triggers, so the exclusion constraint covers both classes.
create table public.occupancy (
  id uuid primary key default gen_random_uuid(),
  bay_id uuid not null references public.bays(id) on delete restrict,
  kind public.occupancy_kind not null,
  source_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  period tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  status text not null default 'active' check (status in ('active', 'released')),
  created_at timestamptz not null default now(),
  unique (kind, source_id),
  check (ends_at > starts_at)
);
alter table public.occupancy add constraint occupancy_bay_period_no_overlap exclude using gist (bay_id with =, period with &&) where (status = 'active');
create index occupancy_period_gist on public.occupancy using gist (period);
create index bookings_customer_starts on public.bookings (customer_id, starts_at desc);
create index bookings_status_starts on public.bookings (status, starts_at);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.business_settings for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
create trigger blocks_touch before update on public.blocked_periods for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, auth as $$ begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', '')) on conflict (id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.sync_booking_occupancy() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.occupancy where kind = 'booking' and source_id = coalesce(new.id, old.id);
  if tg_op <> 'DELETE' and new.status in ('requested', 'confirmed', 'in_service') then
    insert into public.occupancy (bay_id, kind, source_id, starts_at, ends_at, status) values (new.bay_id, 'booking', new.id, new.starts_at, new.ends_at, 'active');
  end if;
  return coalesce(new, old);
end; $$;
create trigger bookings_sync_occupancy after insert or update or delete on public.bookings for each row execute function public.sync_booking_occupancy();

create or replace function public.sync_block_occupancy() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.occupancy where kind = 'blocked' and source_id = coalesce(new.id, old.id);
  if tg_op <> 'DELETE' and new.active then
    insert into public.occupancy (bay_id, kind, source_id, starts_at, ends_at, status) values (new.bay_id, 'blocked', new.id, new.starts_at, new.ends_at, 'active');
  end if;
  return coalesce(new, old);
end; $$;
create trigger blocks_sync_occupancy after insert or update or delete on public.blocked_periods for each row execute function public.sync_block_occupancy();

insert into public.services (slug, name, eyebrow, description, details, duration_minutes, price_cents, display_order) values
  ('the-refresh', 'The Refresh', 'A considered reset', 'A precise exterior wash, decontamination, and finish for cars that need a little more care than a drive-through can offer.', 'Hand wash · wheel detail · paint decontamination · spray sealant', 150, 14500, 1),
  ('the-correction', 'The Correction', 'Clarity, restored', 'A single-stage paint correction that softens the marks of daily driving and returns a clear, deep gloss.', 'Everything in The Refresh · paint correction · panel-by-panel inspection', 300, 32500, 2),
  ('the-signature', 'The Signature', 'Our full expression', 'A full interior and exterior reset with ceramic protection, built for owners who want their car to feel new again.', 'Paint correction · interior deep clean · leather conditioning · ceramic coating', 360, 87500, 3)
on conflict (slug) do update set name = excluded.name, eyebrow = excluded.eyebrow, description = excluded.description, details = excluded.details, duration_minutes = excluded.duration_minutes, price_cents = excluded.price_cents;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public, auth as $$ select exists (select 1 from public.admin_members where user_id = (select auth.uid())); $$;

create or replace function public.get_available_slots(p_service_slug text, p_local_date date)
returns table(starts_at timestamptz, ends_at timestamptz, label text)
language plpgsql stable security definer set search_path = public, auth as $$
declare
  s public.services%rowtype;
  settings public.business_settings%rowtype;
  hours public.opening_hours%rowtype;
  bay uuid;
  local_start timestamp;
  local_end timestamp;
  candidate timestamp;
  candidate_start timestamptz;
  candidate_end timestamptz;
begin
  select bs.* into settings from public.business_settings bs where bs.id = true;
  select * into s from public.services where slug = p_service_slug and active;
  if not found then raise exception 'service unavailable'; end if;
  if p_local_date < (now() at time zone settings.timezone)::date or p_local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
  select * into hours from public.opening_hours where weekday = extract(dow from p_local_date)::smallint;
  if not found or hours.closed then return; end if;
  select bay_row.id into bay from public.bays bay_row where bay_row.active order by bay_row.name limit 1;
  local_start := p_local_date + hours.opens_at;
  local_end := p_local_date + hours.closes_at;
  candidate := local_start;
  while candidate + make_interval(mins => s.duration_minutes) <= local_end loop
    candidate_start := candidate at time zone settings.timezone;
    candidate_end := (candidate + make_interval(mins => s.duration_minutes)) at time zone settings.timezone;
    if candidate_start > now() and not exists (select 1 from public.occupancy o where o.bay_id = bay and o.status = 'active' and o.period && tstzrange(candidate_start, candidate_end, '[)')) then
      starts_at := candidate_start; ends_at := candidate_end; label := to_char(candidate, 'FMHH12:MI AM'); return next;
    end if;
    candidate := candidate + make_interval(mins => settings.slot_minutes);
  end loop;
end; $$;

create or replace function public.create_booking(p_service_slug text, p_starts_at timestamptz, p_vehicle_description text, p_customer_notes text default '')
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, total_price_cents integer)
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid(); s public.services%rowtype; settings public.business_settings%rowtype; hours public.opening_hours%rowtype; bay uuid; local_start timestamp; local_end timestamp; local_date date;
  new_booking public.bookings%rowtype;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select bs.* into settings from public.business_settings bs where bs.id = true;
  select * into s from public.services where slug = p_service_slug and active;
  if not found then raise exception 'service unavailable'; end if;
  if p_vehicle_description is null or length(trim(p_vehicle_description)) < 2 then raise exception 'vehicle required'; end if;
  perform pg_advisory_xact_lock(hashtextextended((p_starts_at::date)::text, 0));
  local_date := (p_starts_at at time zone settings.timezone)::date;
  if local_date < (now() at time zone settings.timezone)::date or local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
  select * into hours from public.opening_hours where weekday = extract(dow from local_date)::smallint;
  if not found or hours.closed then raise exception 'studio closed'; end if;
  if p_starts_at <= now() then raise exception 'time must be in the future'; end if;
  local_start := p_starts_at at time zone settings.timezone; local_end := local_start + make_interval(mins => s.duration_minutes);
  if local_start::date <> local_date or local_end::date <> local_date or local_start::time < hours.opens_at or local_end::time > hours.closes_at or extract(epoch from (local_start - (local_date + hours.opens_at)))::integer / 60 % settings.slot_minutes <> 0 or p_starts_at <> date_trunc('minute', p_starts_at) then raise exception 'time outside schedule'; end if;
  select bay_row.id into bay from public.bays bay_row where bay_row.active order by bay_row.name limit 1;
  if bay is null then raise exception 'no active bay'; end if;
  insert into public.bookings (customer_id, service_id, bay_id, starts_at, ends_at, vehicle_description, customer_notes, total_price_cents)
    values (uid, s.id, bay, p_starts_at, p_starts_at + make_interval(mins => s.duration_minutes), trim(p_vehicle_description), coalesce(trim(p_customer_notes), ''), s.price_cents)
    returning * into new_booking;
  return query select new_booking.id, new_booking.reference, new_booking.starts_at, new_booking.ends_at, new_booking.total_price_cents;
end; $$;

create or replace function public.update_my_booking(p_booking_id uuid, p_action text, p_new_starts_at timestamptz default null)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, status public.booking_status, total_price_cents integer, vehicle_description text, customer_notes text) language plpgsql security definer set search_path = public, auth as $$
declare b public.bookings%rowtype; settings public.business_settings%rowtype; s public.services%rowtype; hours public.opening_hours%rowtype; cutoff timestamptz; local_start timestamp; local_end timestamp; local_date date;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select booking_row.* into b from public.bookings booking_row where booking_row.id = p_booking_id and booking_row.customer_id = auth.uid() for update;
  if not found or b.status not in ('requested', 'confirmed') then raise exception 'booking not found'; end if;
  select bs.* into settings from public.business_settings bs where bs.id = true; cutoff := now() + make_interval(hours => settings.cancellation_hours);
  if b.starts_at <= cutoff then raise exception '24 hours notice required'; end if;
  if p_action = 'cancel' then update public.bookings as target set status = 'cancelled' where target.id = b.id; select booking_row.* into b from public.bookings booking_row where booking_row.id = b.id;
  elsif p_action = 'reschedule' and p_new_starts_at is not null then
    select service_row.* into s from public.services service_row where service_row.id = b.service_id and service_row.active;
    local_date := (p_new_starts_at at time zone settings.timezone)::date;
    if local_date < (now() at time zone settings.timezone)::date or local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
    select * into hours from public.opening_hours where weekday = extract(dow from local_date)::smallint;
    if not found or hours.closed then raise exception 'studio closed'; end if;
    local_start := p_new_starts_at at time zone settings.timezone; local_end := local_start + make_interval(mins => s.duration_minutes);
    if local_start::date <> local_date or local_end::date <> local_date or local_start::time < hours.opens_at or local_end::time > hours.closes_at or extract(epoch from (local_start - (local_date + hours.opens_at)))::integer / 60 % settings.slot_minutes <> 0 or p_new_starts_at <> date_trunc('minute', p_new_starts_at) or p_new_starts_at <= now() + make_interval(hours => settings.cancellation_hours) then raise exception 'time outside schedule or cutoff'; end if;
    update public.bookings as target set starts_at = p_new_starts_at, ends_at = p_new_starts_at + make_interval(mins => s.duration_minutes), status = 'requested' where target.id = b.id; select booking_row.* into b from public.bookings booking_row where booking_row.id = b.id;
  else raise exception 'invalid booking update'; end if;
  return query select b.id, b.reference, b.starts_at, b.ends_at, b.status, b.total_price_cents, b.vehicle_description, b.customer_notes;
end; $$;

create or replace function public.admin_list_bookings(p_from timestamptz default null, p_to timestamptz default null, p_status public.booking_status default null)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, status public.booking_status, total_price_cents integer, vehicle_description text, customer_email text, service_name text)
language sql security definer set search_path = public, auth as $$
  select b.id, b.reference, b.starts_at, b.ends_at, b.status, b.total_price_cents, b.vehicle_description, u.email, s.name from public.bookings b join auth.users u on u.id = b.customer_id join public.services s on s.id = b.service_id where public.is_admin() and (p_from is null or b.starts_at >= p_from) and (p_to is null or b.starts_at < p_to) and (p_status is null or b.status = p_status) order by b.starts_at;
$$;

create or replace function public.admin_overview_counts()
returns table(total_bookings bigint, active_services bigint)
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  return query select (select count(*) from public.bookings), (select count(*) from public.services where active);
end; $$;

create or replace function public.admin_list_customers()
returns table(id uuid, email text, full_name text, created_at timestamptz, booking_count bigint, last_booking_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select u.id, u.email, coalesce(p.full_name, ''), u.created_at, count(b.id), max(b.starts_at)
  from auth.users u left join public.profiles p on p.id = u.id left join public.bookings b on b.customer_id = u.id
  where public.is_admin() group by u.id, u.email, p.full_name, u.created_at order by u.created_at desc;
$$;

create or replace function public.admin_list_customer_bookings(p_customer_id uuid)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, status public.booking_status, service_name text, vehicle_description text, total_price_cents integer)
language sql security definer set search_path = public, auth as $$
  select b.id, b.reference, b.starts_at, b.ends_at, b.status, s.name, b.vehicle_description, b.total_price_cents
  from public.bookings b join public.services s on s.id = b.service_id
  where public.is_admin() and b.customer_id = p_customer_id
  order by b.starts_at desc;
$$;

create or replace function public.admin_list_blocks()
returns table(id uuid, starts_at timestamptz, ends_at timestamptz, reason text, active boolean)
language sql security definer set search_path = public, auth as $$
  select block_row.id, block_row.starts_at, block_row.ends_at, block_row.reason, block_row.active from public.blocked_periods block_row where public.is_admin() order by block_row.starts_at;
$$;

create or replace function public.admin_get_booking(p_booking_id uuid)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, status public.booking_status, total_price_cents integer, vehicle_description text, customer_notes text, admin_notes text, customer_email text, service_name text)
language sql security definer set search_path = public, auth as $$
  select b.id, b.reference, b.starts_at, b.ends_at, b.status, b.total_price_cents, b.vehicle_description, b.customer_notes, b.admin_notes, u.email, s.name from public.bookings b join auth.users u on u.id = b.customer_id join public.services s on s.id = b.service_id where public.is_admin() and b.id = p_booking_id;
$$;

create or replace function public.admin_update_booking(p_booking_id uuid, p_status public.booking_status, p_admin_notes text default null)
returns public.bookings language plpgsql security definer set search_path = public, auth as $$ declare b public.bookings%rowtype; begin if not public.is_admin() then raise exception 'admin required'; end if; select * into b from public.bookings where id = p_booking_id for update; if not found then raise exception 'booking not found'; end if; if b.status in ('cancelled', 'completed') then raise exception 'terminal booking'; end if; if b.status = 'requested' and p_status not in ('confirmed', 'cancelled') then raise exception 'invalid status transition'; end if; if b.status = 'confirmed' and p_status not in ('in_service', 'cancelled') then raise exception 'invalid status transition'; end if; if b.status = 'in_service' and (p_status <> 'completed' or now() < b.ends_at) then raise exception 'booking cannot be completed yet'; end if; update public.bookings set status = p_status, admin_notes = coalesce(p_admin_notes, admin_notes) where id = p_booking_id returning * into b; return b; end; $$;

create or replace function public.admin_upsert_service(p_id uuid, p_slug text, p_name text, p_eyebrow text, p_description text, p_details text, p_duration_minutes integer, p_price_cents integer, p_active boolean, p_display_order integer)
returns public.services language plpgsql security definer set search_path = public, auth as $$ declare s public.services%rowtype; begin if not public.is_admin() then raise exception 'admin required'; end if; if p_id is null then insert into public.services (slug,name,eyebrow,description,details,duration_minutes,price_cents,active,display_order) values (p_slug,p_name,p_eyebrow,p_description,p_details,p_duration_minutes,p_price_cents,p_active,p_display_order) returning * into s; else update public.services set slug=p_slug,name=p_name,eyebrow=p_eyebrow,description=p_description,details=p_details,duration_minutes=p_duration_minutes,price_cents=p_price_cents,active=p_active,display_order=p_display_order where id=p_id returning * into s; end if; return s; end; $$;

create or replace function public.admin_upsert_block(p_id uuid, p_starts_at timestamptz, p_ends_at timestamptz, p_reason text, p_active boolean default true)
returns public.blocked_periods language plpgsql security definer set search_path = public, auth as $$ declare b public.blocked_periods%rowtype; bay uuid; begin if not public.is_admin() then raise exception 'admin required'; end if; select bay_row.id into bay from public.bays bay_row where bay_row.active order by bay_row.name limit 1; if p_id is null then insert into public.blocked_periods (bay_id,starts_at,ends_at,reason,active,created_by) values (bay,p_starts_at,p_ends_at,p_reason,p_active,auth.uid()) returning * into b; else update public.blocked_periods set starts_at=p_starts_at,ends_at=p_ends_at,reason=p_reason,active=p_active where id=p_id returning * into b; end if; return b; end; $$;

create or replace function public.admin_upsert_hours(p_weekday smallint, p_opens_at time, p_closes_at time, p_closed boolean)
returns public.opening_hours language plpgsql security definer set search_path = public, auth as $$ declare h public.opening_hours%rowtype; begin if not public.is_admin() then raise exception 'admin required'; end if; if p_closed and (p_opens_at is not null or p_closes_at is not null) then raise exception 'closed hours must not have a time'; end if; if not p_closed and (p_opens_at is null or p_closes_at is null or p_opens_at >= p_closes_at) then raise exception 'invalid opening hours'; end if; insert into public.opening_hours (weekday, opens_at, closes_at, closed) values (p_weekday, p_opens_at, p_closes_at, p_closed) on conflict (weekday) do update set opens_at=excluded.opens_at, closes_at=excluded.closes_at, closed=excluded.closed returning * into h; return h; end; $$;

alter table public.business_settings enable row level security;
alter table public.bays enable row level security;
alter table public.services enable row level security;
alter table public.opening_hours enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_members enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.occupancy enable row level security;
create policy services_public_read on public.services for select using (active or public.is_admin());
create policy hours_public_read on public.opening_hours for select using (true);
create policy settings_public_read on public.business_settings for select using (true);
create policy profiles_own_read on public.profiles for select using (id = auth.uid());
create policy profiles_own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy bookings_own_read on public.bookings for select using (customer_id = auth.uid() or public.is_admin());
create policy admin_members_no_direct_access on public.admin_members using (false);
create policy blocks_no_direct_access on public.blocked_periods using (false);
create policy occupancy_no_direct_access on public.occupancy using (false);

revoke all on public.business_settings, public.bays, public.services, public.opening_hours, public.profiles, public.admin_members, public.bookings, public.blocked_periods, public.occupancy from anon, authenticated;
grant select on public.services, public.opening_hours, public.business_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant select (id, reference, customer_id, service_id, bay_id, starts_at, ends_at, status, vehicle_description, customer_notes, total_price_cents, created_at, updated_at) on public.bookings to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
revoke all on function public.is_admin(), public.get_available_slots(text,date), public.create_booking(text,timestamptz,text,text), public.update_my_booking(uuid,text,timestamptz), public.admin_list_bookings(timestamptz,timestamptz,public.booking_status), public.admin_overview_counts(), public.admin_list_customers(), public.admin_list_customer_bookings(uuid), public.admin_list_blocks(), public.admin_get_booking(uuid), public.admin_update_booking(uuid,public.booking_status,text), public.admin_upsert_service(uuid,text,text,text,text,text,integer,integer,boolean,integer), public.admin_upsert_block(uuid,timestamptz,timestamptz,text,boolean), public.admin_upsert_hours(smallint,time,time,boolean) from public, anon, authenticated;
grant execute on function public.is_admin(), public.get_available_slots(text,date) to anon, authenticated;
grant execute on function public.create_booking(text,timestamptz,text,text), public.update_my_booking(uuid,text,timestamptz) to authenticated;
grant execute on function public.admin_list_bookings(timestamptz,timestamptz,public.booking_status), public.admin_overview_counts(), public.admin_list_customers(), public.admin_list_customer_bookings(uuid), public.admin_list_blocks(), public.admin_get_booking(uuid), public.admin_update_booking(uuid,public.booking_status,text), public.admin_upsert_service(uuid,text,text,text,text,text,integer,integer,boolean,integer), public.admin_upsert_block(uuid,timestamptz,timestamptz,text,boolean), public.admin_upsert_hours(smallint,time,time,boolean) to authenticated;
