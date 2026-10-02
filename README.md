# DetailFlow

DetailFlow is a fictional one-bay auto detailing studio built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth/Postgres. The public site uses a motorsport editorial direction: sharper grids, technical labels, cobalt accents, and a silver coupe studio hero. It remains usable in preview mode with clearly labeled static service copy and illustrative imagery. Booking availability, authentication, persistence, customer accounts, and admin data require Supabase configuration.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev -- --port 3100
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. These are safe for the browser when used with the policies in the migration. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and use it only for provisioning or integration checks.

## Supabase setup

Install the Supabase CLI, link a project from this repository (the committed `supabase/config.toml` already provides the local project configuration), and apply the versioned migration:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

For a new checkout without the committed Supabase directory, run `supabase init` once before linking.

The migration creates services, a configurable `America/New_York` studio timezone, Tue–Sat 08:00–18:00 opening hours, a 60-day booking horizon, 30-minute starts, 24-hour customer cancellation/reschedule cutoff, one active bay, RLS, and RPC-only booking/blocking mutations. Server timestamps are `timestamptz`; local display and opening-hour checks use `business_settings.timezone`.

Create an Auth user through Supabase Auth, then provision that user as an admin from the SQL editor. This is intentionally separate from profiles and cannot be changed by a customer:

```sql
insert into public.admin_members (user_id, note)
select id, 'Studio operator'
from auth.users
where email = 'your-admin@example.com'
on conflict (user_id) do nothing;
```

Configure the Supabase Auth Site URL to your local or deployed origin and add callback patterns that allow the emitted `?next=` query, for example `http://localhost:3100/auth/callback**` and `https://YOUR_DOMAIN/auth/callback**`. Email confirmation and password-reset links use the same callback. The callback only accepts same-origin internal paths.

The default studio timezone is `America/New_York`. Change `public.business_settings.timezone` with an admin migration or SQL editor when the studio moves; all server-side opening-hour validation and customer/admin display read that value. Local admin block inputs are interpreted in that zone. Spring-forward nonexistent wall times are rejected, and repeated fall-back times use the earlier matching instant.

`supabase/seed.example.sql` is an optional fictional seed. It requires two Auth users you intentionally created first (`demo-customer@example.com` and `demo-admin@example.com`); it never creates accounts or passwords. Run it manually in a disposable project only after replacing those emails.

## Scheduling and security

`public.occupancy` is the shared schedule for booking and blocked periods. Its GiST exclusion constraint rejects overlapping active `tstzrange` records for the same bay, so concurrent bookings and admin blocks use the same database guard. Trigger synchronization releases occupancy for cancelled/completed records.

Customers read only their own bookings through RLS and call `create_booking` / `update_my_booking` RPCs. The RPCs verify `auth.uid()`, retrieve the service price and duration on the server, enforce opening hours, horizon, slot alignment, cutoff, ownership, and valid status. Admin RPCs call `is_admin()` and are separately granted. The direct booking select grant excludes `admin_notes`; customer update RPCs return a safe projection.

## Checks

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

The tests exercise the real timezone conversion helper and the booking rules through the database harness. `scripts/verify-database.mjs` is a PGlite-backed integration harness for the migration, RLS, RPCs, exclusion constraint, configured opening times, and customer/admin isolation; run `npm run verify:database`. Hosted Supabase credentials are still required to verify email flows and production Auth behavior. With no credentials, the live integration remains unconfigured by design; the UI reports that state instead of fabricating slots or persistence. After credentials are available, also exercise two simultaneous `create_booking` calls for the same opening and confirm one succeeds while the GiST exclusion constraint rejects the other.

## Routes

Public: `/`, `/services`, `/service/[slug]`, `/gallery`, `/about`, `/contact`, `/booking`.

Account: `/login`, `/account`, `/account/bookings/[id]`, `/booking/confirmation`.

Admin: `/admin` (protected by the database membership table). 132323213
