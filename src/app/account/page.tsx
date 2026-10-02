import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AccountActions } from "@/components/account-actions";
import { ProfileForm } from "@/components/profile-form";
import { getStudioTimezone } from "@/lib/studio-settings";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Your account" };

type AccountBooking = {
  id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_price_cents: number;
  service: unknown;
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <section className="functional-page account-page account-preview">
        <div className="dashboard-shell">
          <div className="dashboard-state-card">
            <p className="dashboard-kicker">Account preview</p>
            <h1>Your appointments</h1>
            <p>This portfolio preview is not connected to live account history or appointment records.</p>
            <div className="dashboard-actions">
              <Link href="/services" className="action-primary">Browse services <span aria-hidden="true">↗</span></Link>
              <Link href="/login" className="action-secondary">Sign in</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const studioTimezone = await getStudioTimezone();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, reference, starts_at, ends_at, status, total_price_cents, service:services(name)",
    )
    .eq("customer_id", user.id)
    .order("starts_at", { ascending: false });
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const now = new Date().getTime();
  const activeStatuses = ["requested", "confirmed", "in_service"];
  const upcoming =
    bookings?.filter(
      (booking) =>
        activeStatuses.includes(booking.status) &&
        new Date(booking.ends_at).getTime() > now,
    ) ?? [];
  const past =
    bookings?.filter(
      (booking) =>
        !activeStatuses.includes(booking.status) ||
        new Date(booking.ends_at).getTime() <= now,
    ) ?? [];

  return (
    <section className="functional-page account-page">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Customer account</p>
            <h1>Your appointments</h1>
            <p className="dashboard-subtitle">Signed in as {user.email}</p>
          </div>
          <div className="dashboard-actions">
            <Link href="/booking" className="action-primary">Book a detail <span aria-hidden="true">↗</span></Link>
            <form action="/auth/signout" method="post">
              <button className="action-secondary" type="submit">Sign out</button>
            </form>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <section className="dashboard-panel" aria-labelledby="appointments-heading">
              <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Appointments</p><h2 id="appointments-heading">Your calendar</h2></div><span className="dashboard-count">{error ? "—" : `${bookings?.length ?? 0} total`}</span></div>
              {error ? (
                <p className="dashboard-alert dashboard-alert-error">We could not load your appointments right now. Please try again.</p>
              ) : bookings?.length ? (
                <div className="dashboard-groups">
                  <BookingGroup title="Upcoming" bookings={upcoming} studioTimezone={studioTimezone} />
                  <BookingGroup title="Past" bookings={past} studioTimezone={studioTimezone} />
                </div>
              ) : (
                <div className="dashboard-empty"><strong>No appointments yet.</strong><p>Choose a service when you’re ready and we’ll keep the details here.</p><Link href="/booking" className="action-primary">Find a time <span aria-hidden="true">↗</span></Link></div>
              )}
            </section>
          </div>
          <aside className="dashboard-aside">
            <section className="dashboard-panel dashboard-profile" aria-labelledby="profile-heading">
              <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Account details</p><h2 id="profile-heading">Your profile</h2></div></div>
              <p className="dashboard-panel-copy">Keep a name and phone number on file so the studio can reach you about an appointment.</p>
              <ProfileForm initialName={profile?.full_name ?? ""} initialPhone={profile?.phone ?? ""} />
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function BookingGroup({
  title,
  bookings,
  studioTimezone,
}: {
  title: string;
  bookings: AccountBooking[];
  studioTimezone: string;
}) {
  return (
    <section className="dashboard-group">
      <div className="dashboard-group-heading">
        <h3>{title}</h3>
        <span>{bookings.length}</span>
      </div>
      {bookings.length ? (
        <div className="dashboard-booking-list">
          {bookings.map((booking) => {
            const serviceName = Array.isArray(booking.service)
              ? (booking.service[0] as { name?: string } | undefined)?.name
              : (booking.service as { name?: string } | null)?.name;
            return (
              <div key={booking.id} className="dashboard-booking-row">
                <div>
                  <div className="dashboard-booking-title">
                    <p>{serviceName ?? "Detail service"}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="dashboard-booking-meta">{formatDate(booking.starts_at, studioTimezone)} · Ref {booking.reference}</p>
                  <p className="dashboard-booking-price">{formatCurrency(booking.total_price_cents / 100)}</p>
                </div>
                <div className="dashboard-booking-actions">
                  <Link href={`/account/bookings/${booking.id}`} className="dashboard-text-link">Details <span aria-hidden="true">↗</span></Link>
                  {booking.status === "confirmed" ||
                  booking.status === "requested" ? (
                    <AccountActions bookingId={booking.id} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="dashboard-group-empty">
          No {title.toLowerCase()} appointments.
        </p>
      )}
    </section>
  );
}
