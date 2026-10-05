-- Transactional dashboard verification. Run after 202610040003 in Supabase SQL
-- Editor. Every fixture and booking is rolled back before the final counts.
begin;

create temporary table df_dashboard_state (customer_id uuid, admin_id uuid, other_customer_id uuid, service_id uuid, service_slug text, base_price integer, slot_one timestamptz, slot_two timestamptz, voucher_id uuid, booking_id uuid);
grant all on table df_dashboard_state to authenticated;
insert into df_dashboard_state
select 'f4c8e9e0-7b9a-4cc3-9a4b-000000000011'::uuid, 'f4c8e9e0-7b9a-4cc3-9a4b-000000000012'::uuid, 'f4c8e9e0-7b9a-4cc3-9a4b-000000000013'::uuid, s.id, s.slug, s.price_cents, null, null, null, null
from public.services s where s.active order by s.display_order limit 1;
do $$ begin
  if not exists (select 1 from df_dashboard_state) then raise exception 'dashboard verification needs an active service'; end if;
  if exists (select 1 from auth.users where id in ('f4c8e9e0-7b9a-4cc3-9a4b-000000000011'::uuid,'f4c8e9e0-7b9a-4cc3-9a4b-000000000012'::uuid,'f4c8e9e0-7b9a-4cc3-9a4b-000000000013'::uuid)) then raise exception 'dashboard fixture already exists'; end if;
end $$;
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values ('f4c8e9e0-7b9a-4cc3-9a4b-000000000011','authenticated','authenticated','detailflow-dashboard-customer@example.invalid',now(),'{}',now(),now()), ('f4c8e9e0-7b9a-4cc3-9a4b-000000000012','authenticated','authenticated','detailflow-dashboard-admin@example.invalid',now(),'{}',now(),now()), ('f4c8e9e0-7b9a-4cc3-9a4b-000000000013','authenticated','authenticated','detailflow-dashboard-other@example.invalid',now(),'{}',now(),now());
insert into public.admin_members (user_id) values ('f4c8e9e0-7b9a-4cc3-9a4b-000000000012');

-- Find a real opening in the configured timezone and booking horizon instead
-- of assuming a weekday or a fixed date has capacity.
update df_dashboard_state as state
set slot_one = (
  select slots.starts_at
  from public.business_settings settings
  cross join generate_series(1, settings.booking_horizon_days) as day_offset(value)
  cross join lateral public.get_available_slots(
    state.service_slug,
    ((now() at time zone settings.timezone)::date + day_offset.value::integer)
  ) as slots
  order by slots.starts_at
  limit 1
);
do $$ begin
  if not exists (select 1 from df_dashboard_state where slot_one is not null) then
    raise exception 'dashboard verification needs an available future slot';
  end if;
end $$;

-- Legacy four-argument callers must still persist coherent voucher columns.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000011', true);
with created as (select b.id from df_dashboard_state state cross join lateral public.create_booking(state.service_slug, state.slot_one, 'Legacy test vehicle', '') b) update df_dashboard_state set booking_id = created.id from created;
do $$ declare b record; begin select booking_row.base_price_cents, booking_row.discount_cents, booking_row.total_price_cents, booking_row.voucher_id into b from public.bookings booking_row where booking_row.id = (select booking_id from df_dashboard_state); if b.base_price_cents <> (select base_price from df_dashboard_state) or b.discount_cents <> 0 or b.total_price_cents <> b.base_price_cents or b.voucher_id is not null then raise exception 'legacy create_booking totals are incoherent'; end if; raise notice 'PASS legacy create_booking preserves base/net totals'; end $$;
select * from public.update_my_booking((select booking_id from df_dashboard_state), 'cancel', null);
reset role;

-- Issue, apply, cancel, and reapply one owned voucher. The second customer
-- cannot see or use it because the RPC locks and checks customer ownership.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000012', true);
select (public.admin_issue_voucher('f4c8e9e0-7b9a-4cc3-9a4b-000000000011','DASHBOARD25','percent'::public.voucher_discount_kind,25,now()+interval '14 days',null)).id;
update df_dashboard_state set voucher_id = (select id from public.customer_vouchers where code = 'DASHBOARD25');
reset role;

-- RLS and the voucher RPC must keep another customer from reading or using
-- the wallet entry, even when that customer knows the UUID.
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000013', true);
do $$ begin
  if exists (select 1 from public.customer_vouchers where id = (select voucher_id from df_dashboard_state)) then
    raise exception 'voucher RLS exposed another customer wallet';
  end if;
  begin
    perform * from public.create_booking_with_voucher((select service_slug from df_dashboard_state), (select slot_one from df_dashboard_state), 'Other customer vehicle', '', (select voucher_id from df_dashboard_state));
    raise exception 'another customer used an owned voucher';
  exception when others then
    if sqlerrm not like '%voucher unavailable%' then raise; end if;
  end;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000011', true);
with created as (select b.* from df_dashboard_state state cross join lateral public.create_booking_with_voucher(state.service_slug, state.slot_one, 'Voucher test vehicle', '', state.voucher_id) b) update df_dashboard_state set booking_id = created.id from created;
select b.id, b.base_price_cents, b.discount_cents, b.total_price_cents from public.bookings b where b.id = (select booking_id from df_dashboard_state);
do $$ declare b record; begin select booking_row.base_price_cents, booking_row.discount_cents, booking_row.total_price_cents into b from public.bookings booking_row where booking_row.voucher_id = (select voucher_id from df_dashboard_state) and booking_row.status = 'requested'; if b.discount_cents <= 0 or b.total_price_cents <> b.base_price_cents - b.discount_cents then raise exception 'voucher discount was not derived atomically'; end if; end $$;
select * from public.update_my_booking((select id from public.bookings where voucher_id = (select voucher_id from df_dashboard_state) and status = 'requested' limit 1), 'cancel', null);
-- Completion locks the voucher before releasing its occupancy reservation.
with created as (select b.* from df_dashboard_state state cross join lateral public.create_booking_with_voucher(state.service_slug, state.slot_one, 'Voucher completion vehicle', '', state.voucher_id) b) update df_dashboard_state set booking_id = created.id from created;
reset role;
update public.bookings as booking
set starts_at = now() - interval '2 days',
    ends_at = (now() - interval '2 days') + (booking.ends_at - booking.starts_at)
where booking.id = (select booking_id from df_dashboard_state);
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000012', true);
select public.admin_update_booking((select booking_id from df_dashboard_state), 'confirmed', null);
select public.admin_update_booking((select booking_id from df_dashboard_state), 'in_service', null);
select public.admin_update_booking((select booking_id from df_dashboard_state), 'completed', null);
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f4c8e9e0-7b9a-4cc3-9a4b-000000000011', true);
do $$ begin perform * from public.create_booking_with_voucher((select service_slug from df_dashboard_state), now() + interval '2 days', 'Voucher reuse vehicle', '', (select voucher_id from df_dashboard_state)); raise exception 'redeemed voucher was reusable'; exception when others then if sqlerrm not like '%voucher expired or unavailable%' then raise; end if; end $$;
reset role;
reset role;

-- Storage limits, MIME allowlist, and image-key checks are part of rollout.
do $$ begin
  if not exists (select 1 from storage.buckets where id = 'service-images' and public and file_size_limit = 5242880 and allowed_mime_types = array['image/jpeg','image/png','image/webp']) then raise exception 'service-images bucket policy is not configured'; end if;
  if exists (select 1 from public.services where image_url is not null and image_url !~ '^(/images/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)|services/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp))$') then raise exception 'unsafe service image key found'; end if;
  raise notice 'PASS voucher ownership/totals, cancellation release, and service image constraints';
end $$;

rollback;

select
  (select count(*) from auth.users where id in ('f4c8e9e0-7b9a-4cc3-9a4b-000000000011'::uuid, 'f4c8e9e0-7b9a-4cc3-9a4b-000000000012'::uuid, 'f4c8e9e0-7b9a-4cc3-9a4b-000000000013'::uuid)) as dashboard_fixture_users_remaining,
  (select count(*) from public.customer_vouchers where code = 'DASHBOARD25') as dashboard_fixture_vouchers_remaining;
