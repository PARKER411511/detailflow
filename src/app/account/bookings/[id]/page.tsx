import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AccountActions, RescheduleForm } from "@/components/account-actions";
import { getStudioSettings } from "@/lib/studio-settings";
import { StatusBadge } from "@/components/status-badge";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/account");
  const { id } = await params;
  const supabase = await createClient();
  const studioSettings = await getStudioSettings();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/bookings/${id}`);

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, reference, starts_at, ends_at, status, total_price_cents, vehicle_description, customer_notes, service:services(name, slug, duration_minutes)",
    )
    .eq("customer_id", user.id)
    .eq("id", id)
    .maybeSingle();
  if (!booking) notFound();

  const service = Array.isArray(booking.service)
    ? (booking.service[0] as { name?: string; slug?: string } | undefined)
    : (booking.service as { name?: string; slug?: string } | null);

  return (
    <section className="functional-page account-page booking-detail-page">
      <div className="dashboard-shell">
        <Link href="/account" className="dashboard-back-link">← Your account</Link>
        <div className="dashboard-header booking-detail-header">
          <div>
            <p className="dashboard-kicker">Appointment {booking.reference}</p>
            <h1>{service?.name ?? "Detail service"}</h1>
            <p className="dashboard-subtitle">{formatDate(booking.starts_at, studioSettings.timezone)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="booking-detail-layout">
          <div className="dashboard-main">
            <section className="dashboard-panel" aria-labelledby="booking-summary-heading">
              <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Booking summary</p><h2 id="booking-summary-heading">Your visit</h2></div></div>
              <div className="booking-summary-grid">
                <div><span>Date and time</span><strong>{formatDate(booking.starts_at, studioSettings.timezone)}</strong><small>Ends {formatDate(booking.ends_at, studioSettings.timezone)}</small></div>
                <div><span>Service</span><strong>{service?.name ?? "Detail service"}</strong><small>{formatCurrency(booking.total_price_cents / 100)}</small></div>
                <div><span>Vehicle</span><strong>{booking.vehicle_description}</strong></div>
                <div><span>Studio</span><strong>DetailFlow studio</strong><small>19 Mercer Lane · Brooklyn</small></div>
              </div>
              {booking.customer_notes && <div className="booking-note"><span>Your note</span><p>{booking.customer_notes}</p></div>}
            </section>
          </div>
          <aside className="dashboard-aside">
            <section className="dashboard-panel manage-panel" aria-labelledby="manage-heading">
              <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Manage your visit</p><h2 id="manage-heading">Need a change?</h2></div></div>
              {booking.status === "confirmed" || booking.status === "requested" ? (
                <>
                  <p className="dashboard-panel-copy">We ask for 24 hours’ notice for cancellations and rescheduling.</p>
                  <AccountActions bookingId={booking.id} />
                  {service?.slug ? <RescheduleForm bookingId={booking.id} serviceSlug={service.slug} studioTimezone={studioSettings.timezone} bookingHorizonDays={studioSettings.bookingHorizonDays} /> : <p className="dashboard-group-empty">Rescheduling is temporarily unavailable for this service record.</p>}
                </>
              ) : <p className="dashboard-panel-copy">This appointment is {booking.status.replaceAll("_", " ")} and no longer accepts customer changes.</p>}
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
