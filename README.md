# DetailFlow

DetailFlow is a fictional one-bay auto detailing studio built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase Auth/Postgres. The public site uses a motorsport editorial direction: sharper grids, technical labels, cobalt accents, and a silver coupe studio hero. It remains usable in preview mode with clearly labeled static service copy and illustrative imagery. Booking availability, authentication, persistence, customer accounts, and admin data require Supabase configuration.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev -- --port 3100
```

Set `NEXT_PUBLIC_SUPABASE_URL` and the current `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Existing projects may use `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the app accepts it as a backwards-compatible fallback. These public keys are safe for the browser when used with the policies in the migration. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and use it only for explicitly configured provisioning or integration checks. Run `npm run configcheck` to validate `.env.local` and shell values without printing key contents; use `npm run configcheck:strict` in CI.

### Create and connect a Supabase project

1. Create a new Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard), choose a database password, and wait for the project to finish provisioning.
2. In Project Settings → Connect, copy the Project URL and Publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Install the Supabase CLI, run `supabase login`, then link this directory with `supabase link --project-ref YOUR_PROJECT_REF`.
4. Apply every committed migration with `supabase db push`. Migrations are additive and are applied in filename order.
5. Run `npm run configcheck`, start the app with `npm run dev -- --port 3100`, and verify the public service list and sign-in page before provisioning an operator.

For Vercel, add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values under Project Settings → Environment Variables for Preview and Production. Add `SUPABASE_SERVICE_ROLE_KEY` only to a server-side automation that explicitly needs it; the web app does not require it.

#### SQL Editor installation when the Supabase CLI is unavailable

For a brand-new project, run `npm run prepare:database` from the repository root. This generates the ignored local artifact [`work/detailflow-setup.sql`](work/detailflow-setup.sql) from every committed migration in sorted version order. Open Supabase Dashboard → SQL Editor, create a new query, paste that generated file, and run it once. The bundle wraps all committed migrations in one transaction and contains the schema, RLS, triggers, and RPCs. It intentionally creates no Auth users, admin memberships, passwords, demo appointments, or migration-history rows. A successful run should leave the project ready for Auth configuration and the app's public read paths.

The SQL Editor does not update the CLI's `supabase_migrations.schema_migrations` tracking table. Before using `supabase db push` later, link the project and inspect `supabase migration list`. If the three migration versions below show as unapplied while the schema is already installed, mark only those exact versions as applied with the CLI's history repair command:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase migration list
supabase migration repair --status applied 202610010001
supabase migration repair --status applied 202610040001
supabase migration repair --status applied 202610040002
```

`migration repair` updates migration metadata only; it does not execute or undo SQL. Do not insert rows directly into `supabase_migrations.schema_migrations` and do not run `supabase db push` until the list is reconciled. After repair, keep future schema changes in the committed migration files and use `supabase db push --dry-run` before applying them.

After the schema is installed, the controlled setup verification [`supabase/tests/hosted-verification.sql`](supabase/tests/hosted-verification.sql) exercises hosted RLS, RPC authorization, stored service pricing/duration, overlap protection, admin confirmation, and reschedule/cancellation release. It creates temporary fixed `@example.invalid` fixtures with no passwords inside one transaction, ends with `ROLLBACK`, and prints PASS notices plus read-only zero-row counts after rollback. Run it in a Supabase project you control after applying the migrations; it does not create Auth API accounts or provision a real admin.

## Supabase database and Auth setup

The committed `supabase/config.toml` provides the local project configuration. If you are working from a checkout without the `supabase` directory, run `supabase init` once before linking.

The migration creates services, a configurable `America/New_York` studio timezone, Tue–Sat 08:00–18:00 opening hours, a 60-day booking horizon, 30-minute starts, 24-hour customer cancellation/reschedule cutoff, one active bay, RLS, and RPC-only booking/blocking mutations. Server timestamps are `timestamptz`; local display and opening-hour checks use `business_settings.timezone`.

Create and verify an Auth user through Supabase Auth, then provision that exact user as an admin from the SQL editor. This is intentionally separate from profiles and cannot be changed by a customer. The repeatable script fails when the email does not already exist and verifies the inserted membership:

```sql
-- Replace the placeholder, then run supabase/provision-admin.sql.
```

Never add an admin membership from a browser request or by trusting user metadata. To remove an operator, delete its row from `public.admin_members` in the SQL editor after checking the email.

Configure the Supabase Auth Site URL to the deployed HTTPS origin in Supabase Dashboard. The current project Site URL is `https://detailflow-zeta-liart.vercel.app`, with Redirect URLs `https://detailflow-zeta-liart.vercel.app/auth/callback**` and `http://localhost:3100/auth/callback**` for local development. For another deployment, replace the hostname with its HTTPS origin and keep the `/auth/callback**` suffix. The `**` suffix accepts the callback query string produced by Supabase Auth while keeping the path fixed. Email confirmation and password-reset links use the same callback. The callback only accepts same-origin internal paths.

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

The tests exercise the real timezone conversion helper and the booking rules through the database harness. `scripts/verify-database.mjs` loads every committed migration in sorted order and verifies RLS, RPC authorization, dashboard aggregates, staff notes, exclusion constraints, configured opening times, and customer/admin isolation; run `npm run verify:database`. Hosted Supabase credentials are still required to verify email flows and production Auth behavior. With no credentials, the live integration remains unconfigured by design; the UI reports that state instead of fabricating slots or persistence. After credentials are available, also exercise two simultaneous `create_booking` calls for the same opening and confirm one succeeds while the GiST exclusion constraint rejects the other.

The optional `supabase/seed.example.sql` creates only fictional appointments for two Auth users you deliberately created first. Use it only in a disposable project. The repository does not create demo accounts, passwords, or hosted data automatically.

When a disposable hosted project and two existing test accounts are available, the read-only hosted check can be run with `npm run verify:hosted` after setting `DETAILFLOW_TEST_CUSTOMER_EMAIL`, `DETAILFLOW_TEST_CUSTOMER_PASSWORD`, `DETAILFLOW_TEST_ADMIN_EMAIL`, and `DETAILFLOW_TEST_ADMIN_PASSWORD`. It signs in only; it never creates accounts or bookings, never provisions admin access, and never prints tokens or keys. With those variables absent it reports that hosted verification was skipped.

## Routes

Public: `/`, `/services`, `/service/[slug]`, `/gallery`, `/about`, `/contact`, `/booking`.

Account: `/login`, `/account`, `/account/bookings/[id]`, `/booking/confirmation`.

Admin: `/admin` (protected by the database membership table). The workspace reads live metrics, bookings, services, opening hours, blocked intervals, customer search, and booking history through authenticated RPCs. A configured project with no admin membership shows the protected 403 state; an unconfigured project shows setup instructions.
