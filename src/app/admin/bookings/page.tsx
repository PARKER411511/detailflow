import type { Metadata } from "next";
import Link from "next/link";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { getAdminContext } from "@/lib/admin-page";

export const metadata: Metadata = { title: "Appointments" };
export default async function AdminBookingsPage() {
  const { supabase, allowed } = await getAdminContext("/admin/bookings");
  if (!supabase) return <AdminSetup />;
  if (!allowed) return <AdminDenied />;
  const [{ data: bookings, error }, { data: settings }] = await Promise.all([supabase.rpc("admin_list_bookings"), supabase.from("business_settings").select("timezone").eq("id", true).maybeSingle()]);
  return <section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Live schedule</p><h1>Appointments</h1><p className="dashboard-subtitle">Filter, review, and update every appointment in studio time.</p></div></div><AdminWorkspace initialBookings={(bookings ?? []) as never[]} initialServices={[]} studioTimezone={settings?.timezone ?? "America/New_York"} initialBookingsError={error ? "Unable to load live bookings." : undefined} initialTab="bookings" /></section>;
}
function AdminDenied() { return <section className="dashboard-view"><div className="dashboard-empty-state"><p className="dashboard-kicker">403 · Admin only</p><h1>This workspace is restricted.</h1><p>Your account is signed in, but it does not have the protected admin role.</p><Link href="/account" className="dashboard-primary-action">Back to account <span aria-hidden="true">↗</span></Link></div></section>; }
function AdminSetup() { return <section className="dashboard-view"><div className="dashboard-empty-state"><h1>Connect the studio workspace.</h1><p>Add the configured database credentials and apply the project migration before using live appointments.</p></div></section>; }
