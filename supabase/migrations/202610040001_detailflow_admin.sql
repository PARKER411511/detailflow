-- Additive admin and booking hardening for DetailFlow.
-- Keep the original migration immutable so this can be applied safely to an
-- already-created project with `supabase db push`.

create or replace function public.admin_dashboard_metrics()
returns table(
  total_bookings bigint,
  today_bookings bigint,
  upcoming_bookings bigint,
  requested_bookings bigint,
  completed_bookings bigint,
  customer_count bigint,
  booked_value_cents bigint,
  active_services bigint
)
language plpgsql security definer set search_path = public, auth as $$
declare
  timezone_name text;
  local_today date;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  select bs.timezone into timezone_name from public.business_settings bs where bs.id = true;
  timezone_name := coalesce(timezone_name, 'America/New_York');
  local_today := (now() at time zone timezone_name)::date;
  return query
    select
      count(*)::bigint,
      count(*) filter (where (b.starts_at at time zone timezone_name)::date = local_today and b.status <> 'cancelled')::bigint,
      count(*) filter (where b.starts_at > now() and b.status in ('requested', 'confirmed', 'in_service'))::bigint,
      count(*) filter (where b.status = 'requested')::bigint,
      count(*) filter (where b.status = 'completed')::bigint,
      (select count(*)::bigint from auth.users),
      coalesce(sum(b.total_price_cents) filter (where b.status <> 'cancelled'), 0)::bigint,
      (select count(*)::bigint from public.services where active)
  from public.bookings b;
end;
$$;

-- Search is performed inside the protected RPC so customer email data never
-- needs to be exposed through a broad table select in the browser.
create or replace function public.admin_search_customers(p_query text default null)
returns table(id uuid, email text, full_name text, created_at timestamptz, booking_count bigint, last_booking_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select u.id, u.email, coalesce(p.full_name, ''), u.created_at, count(b.id), max(b.starts_at)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.bookings b on b.customer_id = u.id
  where public.is_admin()
    and (
      nullif(trim(coalesce(p_query, '')), '') is null
      or lower(coalesce(u.email, '')) like '%' || lower(trim(p_query)) || '%'
      or lower(coalesce(p.full_name, '')) like '%' || lower(trim(p_query)) || '%'
    )
  group by u.id, u.email, p.full_name, u.created_at
  order by u.created_at desc;
$$;

-- Allow staff to correct private notes without requiring a status transition.
-- The same-status path is deliberately limited to admins, and terminal records
-- may still receive an internal note while remaining terminal.
create or replace function public.admin_update_booking(p_booking_id uuid, p_status public.booking_status, p_admin_notes text default null)
returns public.bookings
language plpgsql security definer set search_path = public, auth as $$
declare
  b public.bookings%rowtype;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  if p_admin_notes is not null and length(p_admin_notes) > 2000 then
    raise exception 'admin notes are too long';
  end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if p_status <> b.status then
    if b.status in ('cancelled', 'completed') then raise exception 'terminal booking'; end if;
    if b.status = 'requested' and p_status not in ('confirmed', 'cancelled') then raise exception 'invalid status transition'; end if;
    if b.status = 'confirmed' and p_status not in ('in_service', 'cancelled') then raise exception 'invalid status transition'; end if;
    if b.status = 'in_service' and (p_status <> 'completed' or now() < b.ends_at) then raise exception 'booking cannot be completed yet'; end if;
  end if;
  update public.bookings
  set status = p_status,
      admin_notes = coalesce(p_admin_notes, admin_notes)
  where id = p_booking_id
  returning * into b;
  return b;
end;
$$;

-- Keep the RPC safe even when a caller bypasses the Next.js route handler.
-- Route validation remains useful for friendly messages, but database callers
-- must receive the same bounded text contract.
create or replace function public.create_booking(p_service_slug text, p_starts_at timestamptz, p_vehicle_description text, p_customer_notes text default '')
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, total_price_cents integer)
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := auth.uid();
  s public.services%rowtype;
  settings public.business_settings%rowtype;
  hours public.opening_hours%rowtype;
  bay uuid;
  local_start timestamp;
  local_end timestamp;
  local_date date;
  new_booking public.bookings%rowtype;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if p_vehicle_description is null or length(trim(p_vehicle_description)) < 2 then raise exception 'vehicle required'; end if;
  if length(trim(p_vehicle_description)) > 120 then raise exception 'vehicle description too long'; end if;
  if length(coalesce(p_customer_notes, '')) > 1000 then raise exception 'customer notes too long'; end if;
  select bs.* into settings from public.business_settings bs where bs.id = true;
  select * into s from public.services where slug = p_service_slug and active;
  if not found then raise exception 'service unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended((p_starts_at::date)::text, 0));
  local_date := (p_starts_at at time zone settings.timezone)::date;
  if local_date < (now() at time zone settings.timezone)::date or local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
  select * into hours from public.opening_hours where weekday = extract(dow from local_date)::smallint;
  if not found or hours.closed then raise exception 'studio closed'; end if;
  if p_starts_at <= now() then raise exception 'time must be in the future'; end if;
  local_start := p_starts_at at time zone settings.timezone;
  local_end := local_start + make_interval(mins => s.duration_minutes);
  if local_start::date <> local_date or local_end::date <> local_date or local_start::time < hours.opens_at or local_end::time > hours.closes_at or extract(epoch from (local_start - (local_date + hours.opens_at)))::integer / 60 % settings.slot_minutes <> 0 or p_starts_at <> date_trunc('minute', p_starts_at) then raise exception 'time outside schedule'; end if;
  select bay_row.id into bay from public.bays bay_row where bay_row.active order by bay_row.name limit 1;
  if bay is null then raise exception 'no active bay'; end if;
  insert into public.bookings (customer_id, service_id, bay_id, starts_at, ends_at, vehicle_description, customer_notes, total_price_cents)
    values (uid, s.id, bay, p_starts_at, p_starts_at + make_interval(mins => s.duration_minutes), trim(p_vehicle_description), coalesce(trim(p_customer_notes), ''), s.price_cents)
    returning * into new_booking;
  return query select new_booking.id, new_booking.reference, new_booking.starts_at, new_booking.ends_at, new_booking.total_price_cents;
end;
$$;

-- The service can be hidden after a customer has booked it. Existing records
-- keep their stored duration and price; future reschedules require the service
-- to remain active so staff never silently book an unavailable offering.
create or replace function public.update_my_booking(p_booking_id uuid, p_action text, p_new_starts_at timestamptz default null)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, status public.booking_status, total_price_cents integer, vehicle_description text, customer_notes text)
language plpgsql security definer set search_path = public, auth as $$
declare
  b public.bookings%rowtype;
  settings public.business_settings%rowtype;
  s public.services%rowtype;
  hours public.opening_hours%rowtype;
  cutoff timestamptz;
  local_start timestamp;
  local_end timestamp;
  local_date date;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select booking_row.* into b from public.bookings booking_row
    where booking_row.id = p_booking_id and booking_row.customer_id = auth.uid() for update;
  if not found or b.status not in ('requested', 'confirmed') then raise exception 'booking not found'; end if;
  select bs.* into settings from public.business_settings bs where bs.id = true;
  cutoff := now() + make_interval(hours => settings.cancellation_hours);
  if b.starts_at <= cutoff then raise exception '24 hours notice required'; end if;
  if p_action = 'cancel' then
    update public.bookings as target set status = 'cancelled' where target.id = b.id;
    select booking_row.* into b from public.bookings booking_row where booking_row.id = b.id;
  elsif p_action = 'reschedule' and p_new_starts_at is not null then
    select service_row.* into s from public.services service_row where service_row.id = b.service_id and service_row.active;
    if not found then raise exception 'service unavailable'; end if;
    local_date := (p_new_starts_at at time zone settings.timezone)::date;
    if local_date < (now() at time zone settings.timezone)::date or local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
    select * into hours from public.opening_hours where weekday = extract(dow from local_date)::smallint;
    if not found or hours.closed then raise exception 'studio closed'; end if;
    local_start := p_new_starts_at at time zone settings.timezone;
    local_end := local_start + make_interval(mins => s.duration_minutes);
    if local_start::date <> local_date or local_end::date <> local_date
      or local_start::time < hours.opens_at or local_end::time > hours.closes_at
      or extract(epoch from (local_start - (local_date + hours.opens_at)))::integer / 60 % settings.slot_minutes <> 0
      or p_new_starts_at <> date_trunc('minute', p_new_starts_at)
      or p_new_starts_at <= cutoff then
      raise exception 'time outside schedule or cutoff';
    end if;
    update public.bookings as target
      set starts_at = p_new_starts_at,
          ends_at = p_new_starts_at + make_interval(mins => s.duration_minutes),
          status = 'requested'
      where target.id = b.id;
    select booking_row.* into b from public.bookings booking_row where booking_row.id = b.id;
  else
    raise exception 'invalid booking update';
  end if;
  return query select b.id, b.reference, b.starts_at, b.ends_at, b.status, b.total_price_cents, b.vehicle_description, b.customer_notes;
end;
$$;

revoke all on function public.admin_dashboard_metrics(), public.admin_search_customers(text) from public, anon, authenticated;
grant execute on function public.admin_dashboard_metrics(), public.admin_search_customers(text) to authenticated;
