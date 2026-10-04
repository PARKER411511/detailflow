import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStudioTimezone } from "@/lib/studio-settings";
import { AdminBookingActions } from "@/components/admin/booking-actions";
import { StatusBadge } from "@/components/status-badge";

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) redirect("/admin");
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/bookings/${id}`);
  const { data: allowed } = await supabase.rpc("is_admin");
  if (!allowed) redirect("/admin");
  const { data } = await supabase.rpc("admin_get_booking", { p_booking_id: id });
  const booking = Array.isArray(data) ? data[0] : data;
  if (!booking) notFound();
  const studioTimezone = await getStudioTimezone();
  return (
    <section className="functional-page admin-page admin-booking-detail">
      <div className="dashboard-shell">
        <Link href="/admin" className="dashboard-back-link">← Admin workspace</Link>
        <div className="dashboard-header booking-detail-header">
          <div>
            <p className="dashboard-kicker">Booking {booking.reference}</p>
            <h1>{booking.service_name}</h1>
            <p className="dashboard-subtitle">{formatDate(booking.starts_at, studioTimezone)} · {booking.customer_email || "No customer email"}</p>
          </div>
          <div className="admin-detail-actions"><StatusBadge status={booking.status} /><AdminBookingActions bookingId={booking.id} status={booking.status} initialNotes={booking.admin_notes ?? ""} /></div>
        </div>
        <div className="booking-detail-layout admin-detail-layout">
          <section className="dashboard-panel" aria-labelledby="admin-booking-summary">
            <div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Visit details</p><h2 id="admin-booking-summary">Booking summary</h2></div></div>
            <div className="booking-summary-grid">
              <div><span>Date and time</span><strong>{formatDate(booking.starts_at, studioTimezone)}</strong><small>Ends {formatDate(booking.ends_at, studioTimezone)}</small></div>
              <div><span>Customer</span><strong>{booking.customer_email || "No email"}</strong></div>
              <div><span>Vehicle</span><strong>{booking.vehicle_description}</strong></div>
              <div><span>Total</span><strong>{formatCurrency(booking.total_price_cents / 100)}</strong></div>
            </div>
            <div className="admin-notes-grid">
              <div className="booking-note"><span>Customer note</span><p>{booking.customer_notes || "No customer note."}</p></div>
              <div className="booking-note booking-note-private"><span>Private staff note</span><p>{booking.admin_notes || "No staff note yet."}</p></div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

