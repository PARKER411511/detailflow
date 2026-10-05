import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatVoucherThrough } from "@/lib/format";
import { getStudioTimezone } from "@/lib/studio-settings";
import { StatusBadge } from "@/components/status-badge";
import { AccountDashboardFrame } from "@/components/account/account-dashboard-frame";

export const metadata: Metadata = { title: "Your account" };

type AccountBooking = {
  id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_price_cents: number;
  vehicle_description: string;
  voucher_id: string | null;
  service: unknown;
};

type Voucher = {
  id: string;
  code: string;
  discount_kind: "fixed" | "percent";
  discount_value: number;
  expires_at: string;
  status: string;
  redeemed_at: string | null;
  reserved?: boolean;
  service: { name?: string } | { name?: string }[] | null;
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-empty-state"><p className="dashboard-kicker">Account preview</p><h1>Your customer desk.</h1><p>This portfolio preview is not connected to live account history or appointment records.</p><div className="dashboard-view-actions"><Link href="/services" className="dashboard-primary-action">Browse services <span aria-hidden="true">↗</span></Link><Link href="/login?next=/" className="dashboard-secondary-action">Sign in</Link></div></div></section></AccountDashboardFrame>;
  }

  const supabase = await createClient();
  const studioTimezone = await getStudioTimezone();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: bookings, error: bookingsError }, { data: profile }, { data: vouchers, error: vouchersError }] = await Promise.all([
    supabase.from("bookings").select("id, reference, starts_at, ends_at, status, total_price_cents, vehicle_description, voucher_id, service:services(name)").eq("customer_id", user.id).order("starts_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("customer_vouchers").select("id, code, discount_kind, discount_value, expires_at, status, redeemed_at, service:services(name)").eq("customer_id", user.id).order("expires_at", { ascending: true }),
  ]);
  const records = (bookings ?? []) as AccountBooking[];
  const activeStatuses = ["requested", "confirmed", "in_service"];
  const now = new Date().getTime();
  const upcoming = records.filter((booking) => activeStatuses.includes(booking.status) && new Date(booking.ends_at).getTime() > now).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = records.filter((booking) => !upcoming.some((item) => item.id === booking.id));
  const reservedVoucherIds = new Set(records.filter((booking) => activeStatuses.includes(booking.status) && booking.voucher_id).map((booking) => booking.voucher_id));
  const walletVouchers = (vouchers ?? []) as Voucher[];
  const availableVouchers = walletVouchers.filter((voucher) => voucher.status === "active" && !voucher.redeemed_at && !reservedVoucherIds.has(voucher.id) && new Date(voucher.expires_at).getTime() > now);
  const reservedVouchers = walletVouchers.filter((voucher) => reservedVoucherIds.has(voucher.id));
  const next = upcoming[0];
  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "there";

  return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Customer desk</p><h1>Good to see you, {displayName}.</h1><p className="dashboard-subtitle">Your appointments, vehicle details, and studio guidance in one place.</p></div><div className="dashboard-view-actions"><Link href="/booking" className="dashboard-primary-action">Book a detail <span aria-hidden="true">↗</span></Link><Link href="/account/profile" className="dashboard-secondary-action">Edit profile</Link></div></div>
    <div className="account-summary-grid" aria-label="Account summary"><SummaryCard primary label="Next appointment" value={next ? formatDate(next.starts_at, studioTimezone) : "Nothing booked"} detail={next ? `${serviceLabel(next.service)} · ${next.vehicle_description}` : "Choose a service when you’re ready."} /><SummaryCard label="Upcoming visits" value={String(upcoming.length)} detail="Requested, confirmed, or in service" /><SummaryCard label="Visit history" value={String(past.length)} detail="Completed, cancelled, and past appointments" /></div>
    <div className="dashboard-grid"><div className="dashboard-main"><section className="dashboard-panel" aria-labelledby="next-visit-heading"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Your next visit</p><h2 id="next-visit-heading">Appointment details</h2></div>{next ? <StatusBadge status={next.status} /> : null}</div>{bookingsError ? <p className="dashboard-alert dashboard-alert-error">We could not load your appointments right now. Please try again later.</p> : next ? <div className="dashboard-overview-appointment"><div><span>Date and time</span><strong>{formatDate(next.starts_at, studioTimezone)}</strong><small>Reference {next.reference}</small></div><div><span>Service and vehicle</span><strong>{serviceLabel(next.service)}</strong><small>{next.vehicle_description}</small></div><div><span>Current total</span><strong>{formatCurrency(next.total_price_cents / 100)}</strong><small>Final total shown at confirmation</small></div><Link href={`/account/bookings/${next.id}`} className="dashboard-primary-action">Open appointment <span aria-hidden="true">↗</span></Link></div> : <div className="dashboard-empty-state compact"><h3>Your calendar is open.</h3><p>Choose a service and a time whenever the car is ready for its next considered reset.</p><Link href="/booking" className="dashboard-primary-action">Find a time <span aria-hidden="true">↗</span></Link></div>}</section>
      <section className="dashboard-panel dashboard-overview-history" aria-labelledby="recent-heading"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Your record</p><h2 id="recent-heading">Recent appointments</h2></div><Link href="/account/bookings" className="dashboard-text-link">View all <span aria-hidden="true">↗</span></Link></div>{records.length ? <div className="dashboard-list-card">{records.slice(0, 4).map((booking) => <Link key={booking.id} href={`/account/bookings/${booking.id}`} className="dashboard-list-row"><div><div className="dashboard-list-title"><strong>{serviceLabel(booking.service)}</strong><StatusBadge status={booking.status} /></div><p>{formatDate(booking.starts_at, studioTimezone)} · {booking.vehicle_description}</p></div><span className="dashboard-list-price">{formatCurrency(booking.total_price_cents / 100)} <span aria-hidden="true">↗</span></span></Link>)}</div> : <p className="dashboard-panel-copy">No appointment history yet.</p>}</section>
    </div><aside className="dashboard-aside"><section className="dashboard-panel" aria-labelledby="wallet-heading"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Customer wallet</p><h2 id="wallet-heading">Vouchers</h2></div><span className="dashboard-count">{vouchersError ? "—" : availableVouchers.length}</span></div>{vouchersError ? <p className="dashboard-panel-copy">Your voucher wallet is temporarily unavailable.</p> : availableVouchers.length ? <div className="dashboard-overview-vouchers">{availableVouchers.slice(0, 2).map((voucher) => <div key={voucher.id} className="dashboard-overview-voucher"><strong>{voucher.code}</strong><span>{voucher.discount_kind === "percent" ? `${voucher.discount_value}% off` : `${formatCurrency(voucher.discount_value / 100)} off`}</span><small>Valid until {formatVoucherThrough(voucher.expires_at, studioTimezone)}</small></div>)}</div> : <p className="dashboard-panel-copy">No vouchers are currently available to apply. The studio will show new discounts here.</p>}{reservedVouchers.length ? <div className="dashboard-overview-reserved"><p className="dashboard-overview-reserved-label">Already attached</p>{reservedVouchers.map((voucher) => { const booking = records.find((item) => item.voucher_id === voucher.id && activeStatuses.includes(item.status)); return <Link key={voucher.id} href={booking ? `/account/bookings/${booking.id}` : "/account/bookings"} className="dashboard-overview-reserved-link"><span><strong>{voucher.code}</strong><small>{booking ? `Appointment ${booking.reference}` : "Active appointment"}</small></span><span>Reserved <span aria-hidden="true">↗</span></span></Link>; })}</div> : null}<Link href="/account/vouchers" className="dashboard-text-link dashboard-overview-link">Open voucher wallet <span aria-hidden="true">↗</span></Link></section><section className="dashboard-panel dashboard-quick-actions" aria-labelledby="account-actions-heading"><p className="dashboard-kicker">Quick actions</p><h2 id="account-actions-heading">Keep your details ready.</h2><div className="dashboard-quick-links"><Link href="/account/profile">Update profile <span aria-hidden="true">↗</span></Link><Link href="/account/settings">Password and recovery <span aria-hidden="true">↗</span></Link><Link href="/services">Review service scopes <span aria-hidden="true">↗</span></Link></div></section></aside></div>
  </section></AccountDashboardFrame>;
}

function SummaryCard({ label, value, detail, primary = false }: { label: string; value: string; detail: string; primary?: boolean }) {
  return <div className={`account-summary-card ${primary ? "account-summary-primary" : ""}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

function serviceLabel(service: unknown) {
  if (Array.isArray(service)) return (service[0] as { name?: string } | undefined)?.name ?? "Detail service";
  return (service as { name?: string } | null)?.name ?? "Detail service";
}
