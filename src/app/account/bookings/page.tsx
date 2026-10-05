import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStudioTimezone } from "@/lib/studio-settings";
import { StatusBadge } from "@/components/status-badge";
import { AccountDashboardFrame } from "@/components/account/account-dashboard-frame";

export const metadata: Metadata = { title: "Bookings" };

export default async function AccountBookingsPage() {
  if (!isSupabaseConfigured()) return <BookingState />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/bookings");
  const [{ data: bookings, error }, timezone] = await Promise.all([
    supabase.from("bookings").select("id, reference, starts_at, ends_at, status, total_price_cents, vehicle_description, service:services(name)").eq("customer_id", user.id).order("starts_at", { ascending: false }),
    getStudioTimezone(),
  ]);
  return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Your history</p><h1>Bookings</h1><p className="dashboard-subtitle">Every confirmed visit, vehicle note, and studio update in one place.</p></div><Link href="/booking" className="dashboard-primary-action">Book a detail <span aria-hidden="true">↗</span></Link></div>{error ? <div className="dashboard-alert dashboard-alert-error">We could not load your bookings right now.</div> : bookings?.length ? <div className="dashboard-list-card">{bookings.map((booking) => { const service = Array.isArray(booking.service) ? booking.service[0] : booking.service; return <Link key={booking.id} href={`/account/bookings/${booking.id}`} className="dashboard-list-row"><div><div className="dashboard-list-title"><strong>{service?.name ?? "Detail service"}</strong><StatusBadge status={booking.status} /></div><p>{formatDate(booking.starts_at, timezone)} · {booking.vehicle_description}</p><small>Ref {booking.reference}</small></div><strong className="dashboard-list-price">{formatCurrency(booking.total_price_cents / 100)} <span aria-hidden="true">↗</span></strong></Link>; })}</div> : <div className="dashboard-empty-state"><span className="dashboard-empty-icon" aria-hidden="true">01</span><h2>Your next detail starts here.</h2><p>No bookings are attached to this account yet. Choose a service and request a time when you’re ready.</p><Link href="/booking" className="dashboard-primary-action">Explore services <span aria-hidden="true">↗</span></Link></div>}</section></AccountDashboardFrame>;
}

function BookingState() { return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-empty-state"><h1>Bookings</h1><p>Connect the studio database to see appointment history.</p><Link href="/services" className="dashboard-primary-action">Browse services <span aria-hidden="true">↗</span></Link></div></section></AccountDashboardFrame>; }
