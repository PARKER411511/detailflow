import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdminBookingActions } from "@/components/admin/booking-actions";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { StatusBadge } from "@/components/status-badge";
export const metadata: Metadata = { title: "Admin dashboard" };
export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <Setup />;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: allowed } = await supabase.rpc("is_admin");
  if (!allowed)
    return (
      <section className="functional-page admin-page">
        <div className="dashboard-shell">
          <div className="dashboard-state-card dashboard-state-danger">
            <p className="dashboard-kicker">403 · Admin only</p>
            <h1>This workspace is restricted.</h1>
            <p>Your account is signed in, but it does not have the protected admin role.</p>
            <Link href="/account" className="action-primary">Back to account <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    );
  const { data: bookings, error } = await supabase.rpc("admin_list_bookings");
  const { data: overviewRows, error: overviewError } = await supabase.rpc(
    "admin_overview_counts",
  );
  const overview = overviewRows?.[0] as
    | { total_bookings: number; active_services: number }
    | undefined;
  const typedBookings = (bookings ?? []) as Array<{
    id: string;
    reference: string;
    starts_at: string;
    customer_email: string | null;
    service_name: string;
    vehicle_description: string;
    total_price_cents: number;
    status: string;
  }>;
  const { data: services } = await supabase
    .from("services")
    .select(
      "id, slug, name, eyebrow, description, details, duration_minutes, price_cents, active, display_order",
    )
    .order("display_order");
  const { data: settings } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("id", true)
    .maybeSingle();
  const studioTimezone = settings?.timezone ?? "America/New_York";
  return (
    <section className="functional-page admin-page">
      <div className="dashboard-shell">
        <div className="dashboard-header admin-dashboard-header">
          <div>
            <p className="dashboard-kicker">Protected workspace</p>
            <h1>Studio overview</h1>
            <p className="dashboard-subtitle">Live records · {user.email}</p>
          </div>
          <span className="admin-verified">Admin verified</span>
        </div>
        <div className="admin-metrics">
          <div className="admin-metric admin-metric-primary"><span>All bookings</span><strong>{overviewError ? "—" : (overview?.total_bookings ?? "—")}</strong><small>{overviewError ? "Count unavailable" : "Live database"}</small></div>
          <div className="admin-metric"><span>Active services</span><strong>{overviewError ? "—" : (overview?.active_services ?? "—")}</strong><small>{overviewError ? "Count unavailable" : "Public menu items"}</small></div>
          <div className="admin-metric"><span>Calendar</span><strong>1 bay</strong><small>Shared occupancy schedule</small></div>
        </div>
        <section className="dashboard-panel admin-bookings-panel" aria-labelledby="admin-bookings-heading">
          <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Live queue</p><h2 id="admin-bookings-heading">Bookings</h2></div><p className="dashboard-panel-note">Requested → confirmed → complete</p></div>
          {error ? (
            <p className="dashboard-alert dashboard-alert-error">Unable to load the booking calendar.</p>
          ) : bookings?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>
                    <th className="pb-3 pr-4">When</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Service</th>
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3">Status</th>
                  </tr></thead>
                <tbody>
                  {typedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td><strong>{formatDate(booking.starts_at, studioTimezone)}</strong><small>{booking.reference}</small></td>
                      <td>{booking.customer_email || "—"}</td>
                      <td><strong>{booking.service_name}</strong><small>{formatCurrency(booking.total_price_cents / 100)}</small></td>
                      <td>{booking.vehicle_description}</td>
                      <td><StatusBadge status={booking.status} />
                        <AdminBookingActions
                          bookingId={booking.id}
                          status={booking.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty"><strong>No appointments in the database yet.</strong><p>New booking requests will appear here when the studio receives them.</p></div>
          )}
        </section>
        <section className="dashboard-panel admin-services-panel" aria-labelledby="admin-services-heading">
          <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Menu</p><h2 id="admin-services-heading">Services</h2></div><p className="dashboard-panel-note">Active menu entries and rates</p></div>
          <div className="admin-service-list">
            {services?.map((service) => (
              <div
                key={service.id}
                className="admin-service-row"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#0b1739]">{service.name}</p>
                  <span
                    className={`text-xs font-semibold ${service.active ? "text-emerald-600" : "text-slate-500"}`}
                  >
                    {service.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {service.duration_minutes} min ·{" "}
                  {formatCurrency(service.price_cents / 100)}
                </p>
              </div>
            ))}
          </div>
        </section>
        <AdminWorkspace
          initialBookings={typedBookings}
          initialServices={services ?? []}
          studioTimezone={studioTimezone}
        />
      </div>
    </section>
  );
}
function Setup() {
  return (
    <section className="functional-page admin-page">
      <div className="dashboard-shell">
        <div className="dashboard-state-card">
          <p className="dashboard-kicker">Admin setup</p>
          <h1>Connect the studio workspace.</h1>
          <p>Add the configured database credentials and apply the project migration before using live bookings, services, and schedule controls.</p>
          <p className="dashboard-state-note">Setup instructions are documented in the project README.</p>
        </div>
      </div>
    </section>
  );
}

