import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAdminContext } from "@/lib/admin-page";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Admin dashboard" };

type AdminBooking = {
  id: string;
  reference: string;
  starts_at: string;
  status: string;
  total_price_cents: number;
  customer_email: string | null;
  service_name: string;
  vehicle_description: string;
};

type Metrics = {
  total_bookings: number;
  today_bookings: number;
  upcoming_bookings: number;
  requested_bookings: number;
  completed_bookings: number;
  customer_count: number;
  booked_value_cents: number;
  active_services: number;
};

export default async function AdminPage() {
  const { supabase, user, allowed } = await getAdminContext("/admin");
  if (!supabase) return <AdminSetup />;
  if (!allowed) return <AdminDenied />;

  const [{ data: bookings, error: bookingsError }, { data: metricsRows, error: overviewError }, { data: settings }] = await Promise.all([
    supabase.rpc("admin_list_bookings"),
    supabase.rpc("admin_dashboard_metrics"),
    supabase.from("business_settings").select("timezone").eq("id", true).maybeSingle(),
  ]);
  const timezone = settings?.timezone ?? "America/New_York";
  const overview = metricsRows?.[0] as Metrics | undefined;
  const allBookings = (bookings ?? []) as AdminBooking[];
  const now = new Date().getTime();
  const upcoming = allBookings
    .filter((booking) => ["requested", "confirmed", "in_service"].includes(booking.status) && new Date(booking.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const requests = allBookings
    .filter((booking) => booking.status === "requested")
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <section className="dashboard-view">
      <div className="dashboard-view-header">
        <div>
          <p className="dashboard-kicker">Protected workspace</p>
          <h1>Studio overview</h1>
          <p className="dashboard-subtitle">Live appointments, customer activity, and the next decisions for the studio team.</p>
        </div>
        <div className="dashboard-view-actions">
          <span className="admin-verified">Admin verified</span>
          <Link href="/admin/bookings" className="dashboard-primary-action">Open appointments <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <p className="dashboard-overview-identity">Signed in as {user?.email}</p>

      <div className="admin-metrics">
        <Metric label="Today" value={overview?.today_bookings} detail="Appointments in studio time" unavailable={Boolean(overviewError)} primary />
        <Metric label="Upcoming" value={overview?.upcoming_bookings} detail="Requested, confirmed, or in service" unavailable={Boolean(overviewError)} />
        <Metric label="Requests" value={overview?.requested_bookings} detail="Awaiting confirmation" unavailable={Boolean(overviewError)} />
        <Metric label="Completed" value={overview?.completed_bookings} detail="All-time completed visits" unavailable={Boolean(overviewError)} />
        <Metric label="Customers" value={overview?.customer_count} detail="Registered accounts" unavailable={Boolean(overviewError)} />
        <Metric label="Booked value" value={overview ? formatCurrency(overview.booked_value_cents / 100) : undefined} detail="Scheduled value, not collected revenue" unavailable={Boolean(overviewError)} />
        <Metric label="Services" value={overview?.active_services} detail="Public menu items" unavailable={Boolean(overviewError)} />
        <Metric label="Total bookings" value={overview?.total_bookings} detail="Live database records" unavailable={Boolean(overviewError)} />
      </div>

      <div className="dashboard-grid admin-overview-grid">
        <section className="dashboard-panel" aria-labelledby="next-visits-heading">
          <div className="dashboard-panel-heading">
            <div><p className="dashboard-kicker">What is next</p><h2 id="next-visits-heading">Upcoming visits</h2></div>
            <Link href="/admin/bookings" className="dashboard-text-link">Full schedule <span aria-hidden="true">↗</span></Link>
          </div>
          {bookingsError ? <p className="dashboard-alert dashboard-alert-error">We could not load the live appointment list. Metrics may still be available.</p> : upcoming.length ? <div className="dashboard-list-card dashboard-overview-list">{upcoming.slice(0, 6).map((booking) => <AdminBookingRow key={booking.id} booking={booking} timezone={timezone} />)}</div> : <div className="dashboard-empty-state compact"><h3>No upcoming visits</h3><p>The schedule has no requested, confirmed, or in-service appointments ahead.</p><Link href="/admin/bookings" className="dashboard-secondary-action">Review appointments</Link></div>}
        </section>

        <aside className="dashboard-aside dashboard-overview-aside">
          <section className="dashboard-panel" aria-labelledby="requests-heading">
            <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Needs a decision</p><h2 id="requests-heading">Booking requests</h2></div><span className="dashboard-count">{bookingsError ? "—" : requests.length}</span></div>
            {requests.length ? <div className="dashboard-overview-request-list">{requests.slice(0, 4).map((booking) => <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="dashboard-overview-request"><strong>{booking.service_name}</strong><span>{formatDate(booking.starts_at, timezone)} · {booking.customer_email ?? "Customer"}</span></Link>)}</div> : <p className="dashboard-panel-copy">No appointments are waiting for confirmation.</p>}
            <Link href="/admin/bookings" className="dashboard-text-link dashboard-overview-link">Review requests <span aria-hidden="true">↗</span></Link>
          </section>
          <section className="dashboard-panel dashboard-quick-actions" aria-labelledby="quick-actions-heading">
            <p className="dashboard-kicker">Quick actions</p><h2 id="quick-actions-heading">Keep the desk moving.</h2>
            <div className="dashboard-quick-links"><Link href="/admin/customers">Search customers <span aria-hidden="true">↗</span></Link><Link href="/admin/vouchers">Issue a voucher <span aria-hidden="true">↗</span></Link><Link href="/admin/services">Edit services <span aria-hidden="true">↗</span></Link><Link href="/admin/settings">Adjust hours or blocks <span aria-hidden="true">↗</span></Link></div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function AdminBookingRow({ booking, timezone }: { booking: AdminBooking; timezone: string }) {
  return <Link href={`/admin/bookings/${booking.id}`} className="dashboard-list-row"><div><div className="dashboard-list-title"><strong>{booking.service_name}</strong><StatusBadge status={booking.status} /></div><p>{formatDate(booking.starts_at, timezone)} · {booking.customer_email ?? "Customer"}</p><small>{booking.vehicle_description} · Ref {booking.reference}</small></div><span className="dashboard-list-price">{formatCurrency(booking.total_price_cents / 100)} <span aria-hidden="true">↗</span></span></Link>;
}

function Metric({ label, value, detail, primary = false, unavailable = false }: { label: string; value: number | string | undefined; detail: string; primary?: boolean; unavailable?: boolean }) {
  return <div className={`admin-metric ${primary ? "admin-metric-primary" : ""}`}><span>{label}</span><strong>{unavailable ? "—" : (value ?? "—")}</strong><small>{unavailable ? "Unavailable" : detail}</small></div>;
}

function AdminDenied() {
  return <section className="dashboard-view"><div className="dashboard-empty-state"><p className="dashboard-kicker">403 · Admin only</p><h1>This workspace is restricted.</h1><p>Your account is signed in, but it does not have the protected admin role.</p><Link href="/account" className="dashboard-primary-action">Back to account <span aria-hidden="true">↗</span></Link></div></section>;
}

function AdminSetup() {
  return <section className="dashboard-view"><div className="dashboard-empty-state"><p className="dashboard-kicker">Admin setup</p><h1>Connect the studio workspace.</h1><p>Add the configured database credentials and apply the project migration before using live bookings, services, and schedule controls.</p><p className="dashboard-form-note">Setup instructions are documented in the project README.</p></div></section>;
}
