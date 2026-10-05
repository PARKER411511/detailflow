import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatVoucherThrough } from "@/lib/format";
import { getStudioTimezone } from "@/lib/studio-settings";
import { AccountDashboardFrame } from "@/components/account/account-dashboard-frame";

export const metadata: Metadata = { title: "Vouchers" };

type Voucher = { id: string; code: string; discount_kind: "fixed" | "percent"; discount_value: number; expires_at: string; status: string; redeemed_at: string | null; service: { name?: string } | Array<{ name?: string }> | null };
type ActiveBooking = { id: string; reference: string; voucher_id: string | null };

export default async function AccountVouchersPage() {
  if (!isSupabaseConfigured()) return <VoucherEmpty />;
  const supabase = await createClient();
  const studioTimezone = await getStudioTimezone();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/vouchers");
  const [{ data, error }, { data: activeBookings, error: activeBookingsError }] = await Promise.all([
    supabase.from("customer_vouchers").select("id, code, discount_kind, discount_value, expires_at, status, redeemed_at, service:services(name)").eq("customer_id", user.id).order("expires_at", { ascending: true }),
    supabase.from("bookings").select("id, reference, voucher_id").eq("customer_id", user.id).in("status", ["requested", "confirmed", "in_service"]).not("voucher_id", "is", null),
  ]);
  const vouchers = (data ?? []) as Voucher[];
  const reservedByVoucher = new Map(((activeBookings ?? []) as ActiveBooking[]).filter((booking) => booking.voucher_id).map((booking) => [booking.voucher_id as string, booking]));
  return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Studio credits</p><h1>Vouchers</h1><p className="dashboard-subtitle">Use an eligible voucher during booking. Each voucher applies to one active appointment.</p></div><Link href="/booking" className="dashboard-primary-action">Book with a voucher <span aria-hidden="true">↗</span></Link></div>{error || activeBookingsError ? <div className="dashboard-alert">Your voucher wallet is temporarily unavailable. Please try again shortly.</div> : vouchers.length ? <div className="dashboard-voucher-grid">{vouchers.map((voucher) => { const service = Array.isArray(voucher.service) ? voucher.service[0] : voucher.service; const reservedBooking = reservedByVoucher.get(voucher.id); const expired = voucher.status !== "active" || voucher.redeemed_at || new Date(voucher.expires_at) <= new Date(); const discount = voucher.discount_kind === "fixed" ? formatCurrency(voucher.discount_value / 100) : `${voucher.discount_value}%`; return <article key={voucher.id} className={`dashboard-voucher-card ${expired || reservedBooking ? "is-muted" : ""}`}><div className="dashboard-voucher-top"><span className="dashboard-voucher-code">{voucher.code}</span><span className={`dashboard-voucher-status ${reservedBooking ? "is-muted" : ""}`}>{voucher.redeemed_at ? "Used" : reservedBooking ? "Reserved" : expired ? (voucher.status === "revoked" ? "Revoked" : "Expired") : "Available"}</span></div><strong>{discount} off</strong><p>{service?.name ? `For ${service.name}` : "For any active service"}</p><small>Valid through {formatVoucherThrough(voucher.expires_at, studioTimezone)}</small>{reservedBooking ? <Link href={`/account/bookings/${reservedBooking.id}`} className="dashboard-voucher-booking-link">Attached to {reservedBooking.reference} <span aria-hidden="true">↗</span></Link> : null}</article>; })}</div> : <div className="dashboard-empty-state"><span className="dashboard-empty-icon" aria-hidden="true">%</span><h2>Your voucher wallet is clear.</h2><p>When the studio assigns a voucher to your account, its eligibility and expiry will be shown here.</p><Link href="/services" className="dashboard-secondary-action">Browse services</Link></div>}</section></AccountDashboardFrame>;
}

function VoucherEmpty() { return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-empty-state"><h1>Vouchers</h1><p>Connect the studio database to see assigned vouchers.</p></div></section></AccountDashboardFrame>; }
