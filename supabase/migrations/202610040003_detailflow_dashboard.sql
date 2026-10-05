-- Additive DetailFlow dashboard rollout.
-- Apply after 202610040002_detailflow_profile_backfill.sql. This migration is
-- safe for an existing project and never changes the historical migrations.

alter table public.services
  add column if not exists image_url text,
  add column if not exists image_alt text not null default '';

alter table public.services
  drop constraint if exists services_image_url_safe;
alter table public.services
  add constraint services_image_url_safe check (
    image_url is null
    or image_url ~ '^/images/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'
    or image_url ~ '^services/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$'
  );
alter table public.services
  drop constraint if exists services_image_alt_length;
alter table public.services
  add constraint services_image_alt_length check (char_length(image_alt) <= 240);

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'service-images') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('service-images', 'service-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
  else
    update storage.buckets
    set public = true, file_size_limit = 5242880,
        allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
    where id = 'service-images';
  end if;
end $$;

drop policy if exists service_images_admin_insert on storage.objects;
create policy service_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'service-images' and public.is_admin());
drop policy if exists service_images_admin_update on storage.objects;
create policy service_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'service-images' and public.is_admin())
  with check (bucket_id = 'service-images' and public.is_admin());
drop policy if exists service_images_admin_delete on storage.objects;
create policy service_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'service-images' and public.is_admin());

create type public.voucher_discount_kind as enum ('fixed', 'percent');

create table if not exists public.customer_vouchers (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9-]{4,40}$'),
  discount_kind public.voucher_discount_kind not null,
  discount_value integer not null check ((discount_kind = 'fixed' and discount_value > 0) or (discount_kind = 'percent' and discount_value between 1 and 100)),
  service_id uuid references public.services(id) on delete restrict,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  redeemed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (revoked_at is null or status = 'revoked')
);
create index if not exists customer_vouchers_customer_status on public.customer_vouchers (customer_id, status, expires_at);
create unique index if not exists customer_vouchers_active_code on public.customer_vouchers (lower(code));

alter table public.bookings
  add column if not exists base_price_cents integer,
  add column if not exists discount_cents integer not null default 0,
  add column if not exists voucher_id uuid references public.customer_vouchers(id) on delete restrict;
update public.bookings set base_price_cents = total_price_cents where base_price_cents is null;
alter table public.bookings alter column base_price_cents set default 0;
alter table public.bookings alter column base_price_cents set not null;
alter table public.bookings
  drop constraint if exists bookings_discount_totals;
alter table public.bookings
  add constraint bookings_discount_totals check (
    base_price_cents >= 0 and discount_cents >= 0 and discount_cents <= base_price_cents and total_price_cents = base_price_cents - discount_cents
  );
create unique index if not exists bookings_one_active_voucher on public.bookings (voucher_id)
  where voucher_id is not null and status in ('requested', 'confirmed', 'in_service');
create index if not exists bookings_voucher_id on public.bookings (voucher_id);

alter table public.customer_vouchers enable row level security;
create policy vouchers_own_read on public.customer_vouchers for select using (customer_id = auth.uid() or public.is_admin());
revoke all on public.customer_vouchers from anon, authenticated;
grant select on public.customer_vouchers to authenticated;

create or replace function public.admin_upsert_service_with_image(
  p_id uuid, p_slug text, p_name text, p_eyebrow text, p_description text,
  p_details text, p_duration_minutes integer, p_price_cents integer,
  p_active boolean, p_display_order integer, p_image_url text default null,
  p_image_alt text default ''
)
returns public.services
language plpgsql security definer set search_path = public, auth as $$
declare s public.services%rowtype;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  if p_image_url is not null and p_image_url !~ '^(/images/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)|services/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp))$' then
    raise exception 'unsafe service image';
  end if;
  if p_id is null then
    insert into public.services (slug,name,eyebrow,description,details,duration_minutes,price_cents,active,display_order,image_url,image_alt)
    values (p_slug,p_name,p_eyebrow,p_description,p_details,p_duration_minutes,p_price_cents,p_active,p_display_order,p_image_url,coalesce(p_image_alt,'')) returning * into s;
  else
    update public.services set slug=p_slug,name=p_name,eyebrow=p_eyebrow,description=p_description,details=p_details,duration_minutes=p_duration_minutes,price_cents=p_price_cents,active=p_active,display_order=p_display_order,image_url=p_image_url,image_alt=coalesce(p_image_alt,'') where id=p_id returning * into s;
  end if;
  return s;
end;
$$;

create or replace function public.admin_issue_voucher(
  p_customer_id uuid, p_code text, p_discount_kind public.voucher_discount_kind,
  p_discount_value integer, p_expires_at timestamptz, p_service_id uuid default null
)
returns public.customer_vouchers
language plpgsql security definer set search_path = public, auth as $$
declare v public.customer_vouchers%rowtype;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  if p_expires_at <= now() then raise exception 'expiry must be in the future'; end if;
  if not exists (select 1 from auth.users where id = p_customer_id) then raise exception 'customer not found'; end if;
  insert into public.customer_vouchers (customer_id, code, discount_kind, discount_value, service_id, expires_at, created_by)
  values (p_customer_id, upper(trim(p_code)), p_discount_kind, p_discount_value, p_service_id, p_expires_at, auth.uid()) returning * into v;
  return v;
exception when unique_violation then raise exception 'voucher code already exists';
end;
$$;

create or replace function public.admin_revoke_voucher(p_voucher_id uuid)
returns public.customer_vouchers
language plpgsql security definer set search_path = public, auth as $$
declare v public.customer_vouchers%rowtype;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  update public.customer_vouchers voucher_row set status = 'revoked', revoked_at = now() where voucher_row.id = p_voucher_id returning voucher_row.* into v;
  if not found then raise exception 'voucher not found'; end if;
  return v;
end;
$$;

create or replace function public.admin_list_vouchers()
returns table(id uuid, customer_id uuid, customer_email text, code text, discount_kind public.voucher_discount_kind, discount_value integer, service_name text, expires_at timestamptz, status text, redeemed_at timestamptz, created_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select v.id, v.customer_id, u.email, v.code, v.discount_kind, v.discount_value, s.name, v.expires_at, case when v.status = 'active' and v.expires_at <= now() then 'expired' else v.status end, v.redeemed_at, v.created_at
  from public.customer_vouchers v join auth.users u on u.id = v.customer_id left join public.services s on s.id = v.service_id
  where public.is_admin() order by v.created_at desc;
$$;

create or replace function public.create_booking_with_voucher(
  p_service_slug text, p_starts_at timestamptz, p_vehicle_description text,
  p_customer_notes text default '', p_voucher_id uuid default null
)
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, total_price_cents integer, base_price_cents integer, discount_cents integer, voucher_id uuid)
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); s public.services%rowtype; v public.customer_vouchers%rowtype; settings public.business_settings%rowtype; hours public.opening_hours%rowtype; bay uuid; local_start timestamp; local_end timestamp; local_date date; discount integer := 0; new_booking public.bookings%rowtype;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if p_customer_notes is null or length(p_customer_notes) > 1000 then raise exception 'customer notes too long'; end if;
  if p_vehicle_description is null or length(trim(p_vehicle_description)) < 2 then raise exception 'vehicle required'; end if;
  if length(trim(p_vehicle_description)) > 120 then raise exception 'vehicle description too long'; end if;
  select bs.* into settings from public.business_settings bs where bs.id = true;
  select service_row.* into s from public.services service_row where service_row.slug = p_service_slug and service_row.active;
  if not found then raise exception 'service unavailable'; end if;
  if p_voucher_id is not null then
    select voucher_row.* into v from public.customer_vouchers voucher_row where voucher_row.id = p_voucher_id and voucher_row.customer_id = uid for update;
    if not found then raise exception 'voucher unavailable'; end if;
    if v.status <> 'active' or v.redeemed_at is not null or v.expires_at <= now() then raise exception 'voucher expired or unavailable'; end if;
    if v.service_id is not null and v.service_id <> s.id then raise exception 'voucher does not apply to this service'; end if;
    if v.discount_kind = 'fixed' then discount := least(v.discount_value, s.price_cents); else discount := floor(s.price_cents * v.discount_value / 100.0)::integer; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended((p_starts_at::date)::text, 0));
  local_date := (p_starts_at at time zone settings.timezone)::date;
  if local_date < (now() at time zone settings.timezone)::date or local_date > (now() at time zone settings.timezone)::date + settings.booking_horizon_days then raise exception 'date outside booking horizon'; end if;
  select hours_row.* into hours from public.opening_hours hours_row where hours_row.weekday = extract(dow from local_date)::smallint;
  if not found or hours.closed then raise exception 'studio closed'; end if;
  if p_starts_at <= now() then raise exception 'time must be in the future'; end if;
  local_start := p_starts_at at time zone settings.timezone; local_end := local_start + make_interval(mins => s.duration_minutes);
  if local_start::date <> local_date or local_end::date <> local_date or local_start::time < hours.opens_at or local_end::time > hours.closes_at or extract(epoch from (local_start - (local_date + hours.opens_at)))::integer / 60 % settings.slot_minutes <> 0 or p_starts_at <> date_trunc('minute', p_starts_at) then raise exception 'time outside schedule'; end if;
  select bay_row.id into bay from public.bays bay_row where bay_row.active order by bay_row.name limit 1;
  if bay is null then raise exception 'no active bay'; end if;
  insert into public.bookings (customer_id,service_id,bay_id,starts_at,ends_at,vehicle_description,customer_notes,total_price_cents,base_price_cents,discount_cents,voucher_id)
  values (uid,s.id,bay,p_starts_at,p_starts_at + make_interval(mins => s.duration_minutes),trim(p_vehicle_description),coalesce(trim(p_customer_notes),''),s.price_cents-discount,s.price_cents,discount,p_voucher_id) returning * into new_booking;
  return query select new_booking.id,new_booking.reference,new_booking.starts_at,new_booking.ends_at,new_booking.total_price_cents,new_booking.base_price_cents,new_booking.discount_cents,new_booking.voucher_id;
end;
$$;

-- Keep the established four-argument RPC callable by existing clients and
-- tests while routing its insert through the same server-derived price path.
create or replace function public.create_booking(p_service_slug text, p_starts_at timestamptz, p_vehicle_description text, p_customer_notes text default '')
returns table(id uuid, reference text, starts_at timestamptz, ends_at timestamptz, total_price_cents integer)
language sql security definer set search_path = public, auth as $$
  select created.id, created.reference, created.starts_at, created.ends_at, created.total_price_cents
  from public.create_booking_with_voucher(p_service_slug, p_starts_at, p_vehicle_description, p_customer_notes, null) as created;
$$;

create or replace function public.admin_update_booking(p_booking_id uuid, p_status public.booking_status, p_admin_notes text default null)
returns public.bookings language plpgsql security definer set search_path = public, auth as $$
declare b public.bookings%rowtype;
begin
  if not public.is_admin() then raise exception 'admin required'; end if;
  if p_admin_notes is not null and length(p_admin_notes) > 2000 then raise exception 'admin notes are too long'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking not found'; end if;
  if p_status <> b.status then
    if b.status in ('cancelled','completed') then raise exception 'terminal booking'; end if;
    if b.status = 'requested' and p_status not in ('confirmed','cancelled') then raise exception 'invalid status transition'; end if;
    if b.status = 'confirmed' and p_status not in ('in_service','cancelled') then raise exception 'invalid status transition'; end if;
    if b.status = 'in_service' and (p_status <> 'completed' or now() < b.ends_at) then raise exception 'booking cannot be completed yet'; end if;
  end if;
  -- Voucher booking and completion use the same lock order. Lock the voucher
  -- before releasing its active booking reservation so redemption cannot race
  -- a concurrent customer confirmation.
  if p_status = 'completed' and b.voucher_id is not null then
    perform 1 from public.customer_vouchers voucher_row where voucher_row.id = b.voucher_id for update;
    if not found then raise exception 'voucher unavailable'; end if;
  end if;
  update public.bookings set status=p_status, admin_notes=coalesce(p_admin_notes,admin_notes) where id=p_booking_id returning * into b;
  if p_status = 'completed' and b.voucher_id is not null then update public.customer_vouchers voucher_row set redeemed_at=coalesce(voucher_row.redeemed_at,now()) where voucher_row.id=b.voucher_id; end if;
  return b;
end;
$$;

revoke all on function public.admin_upsert_service_with_image(uuid,text,text,text,text,text,integer,integer,boolean,integer,text,text), public.create_booking_with_voucher(text,timestamptz,text,text,uuid), public.admin_issue_voucher(uuid,text,public.voucher_discount_kind,integer,timestamptz,uuid), public.admin_revoke_voucher(uuid), public.admin_list_vouchers() from public, anon, authenticated;
grant execute on function public.create_booking_with_voucher(text,timestamptz,text,text,uuid) to authenticated;
grant execute on function public.admin_upsert_service_with_image(uuid,text,text,text,text,text,integer,integer,boolean,integer,text,text), public.admin_issue_voucher(uuid,text,public.voucher_discount_kind,integer,timestamptz,uuid), public.admin_revoke_voucher(uuid), public.admin_list_vouchers() to authenticated;

-- Ensure legacy records and future no-voucher callers still have coherent totals.
comment on column public.bookings.total_price_cents is 'Final net total after any voucher discount.';
