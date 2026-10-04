import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
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
  const { data: bookings, error: bookingsError } = await supabase.rpc("admin_list_bookings");
  const { data: metricsRows, error: overviewError } = await supabase.rpc(
    "admin_dashboard_metrics",
  );
  const overview = metricsRows?.[0] as
    | {
        total_bookings: number;
        today_bookings: number;
        upcoming_bookings: number;
        requested_bookings: number;
        completed_bookings: number;
        customer_count: number;
        booked_value_cents: number;
        active_services: number;
      }
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
  const { data: services, error: servicesError } = await supabase
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
          <Metric label="Today" value={overview?.today_bookings} detail="Appointments in studio time" primary={true} unavailable={Boolean(overviewError)} />
          <Metric label="Upcoming" value={overview?.upcoming_bookings} detail="Requested, confirmed, or in service" unavailable={Boolean(overviewError)} />
          <Metric label="Requests" value={overview?.requested_bookings} detail="Awaiting confirmation" unavailable={Boolean(overviewError)} />
          <Metric label="Completed" value={overview?.completed_bookings} detail="All-time completed visits" unavailable={Boolean(overviewError)} />
          <Metric label="Accounts" value={overview?.customer_count} detail="All Auth accounts, including staff" unavailable={Boolean(overviewError)} />
          <Metric label="Booked value" value={overview ? formatCurrency(overview.booked_value_cents / 100) : undefined} detail="Scheduled value, not collected revenue" unavailable={Boolean(overviewError)} />
          <Metric label="Services" value={overview?.active_services} detail="Public menu items" unavailable={Boolean(overviewError)} />
          <Metric label="Total bookings" value={overview?.total_bookings} detail="Live database records" unavailable={Boolean(overviewError)} />
        </div>
        <AdminWorkspace
          initialBookings={typedBookings}
          initialServices={services ?? []}
          studioTimezone={studioTimezone}
          initialBookingsError={bookingsError ? "Unable to load live bookings. Try refreshing after checking the database connection." : undefined}
          initialServicesError={servicesError ? "Unable to load service settings. The menu editor is unavailable until the database responds." : undefined}
        />
      </div>
    </section>
  );
}
function Metric({
  label,
  value,
  detail,
  primary = false,
  unavailable = false,
}: {
  label: string;
  value: number | string | undefined;
  detail: string;
  primary?: boolean;
  unavailable?: boolean;
}) {
  return (
    <div className={`admin-metric ${primary ? "admin-metric-primary" : ""}`}>
      <span>{label}</span>
      <strong>{unavailable ? "—" : (value ?? "—")}</strong>
      <small>{unavailable ? "Unavailable" : detail}</small>
    </div>
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

