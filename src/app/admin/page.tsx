import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AdminBookingActions } from "@/components/admin/booking-actions";
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
      <section className="bg-[#f8fafc] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-100 bg-rose-50 p-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-rose-600">
            403 · Admin only
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-[#0b1739]">
            This page is restricted.
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Your account is signed in, but it is not a member of the protected
            admin role table.
          </p>
          <Link
            href="/account"
            className="action-primary mt-6 inline-flex px-5 py-3 text-sm"
          >
            Back to account
          </Link>
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
    <section className="bg-[#fffdfa] px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              Protected workspace
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-.05em] text-[#0b1739]">
              Studio overview.
            </h1>
            <p className="mt-3 text-slate-600">
              Actual database records · {user.email}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Admin verified
          </span>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="border-t-2 border-blue-300 bg-[#0b1739] p-6 text-white">
            <p className="text-xs uppercase tracking-[.18em] text-blue-200">
              All bookings
            </p>
            <p className="mt-5 text-4xl font-semibold">
              {overviewError ? "—" : (overview?.total_bookings ?? "—")}
            </p>
            <p className="mt-2 text-sm text-blue-100/60">
              {overviewError ? "Count unavailable" : "From the live database"}
            </p>
          </div>
          <div className="border-t border-slate-300 bg-white p-6">
            <p className="text-xs uppercase tracking-[.18em] text-blue-600">
              Active services
            </p>
            <p className="mt-5 text-4xl font-semibold text-[#0b1739]">
              {overviewError ? "—" : (overview?.active_services ?? "—")}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {overviewError ? "Count unavailable" : "Public menu items"}
            </p>
          </div>
          <div className="border-t border-slate-300 bg-white p-6">
            <p className="text-xs uppercase tracking-[.18em] text-blue-600">
              Calendar
            </p>
            <p className="mt-5 text-4xl font-semibold text-[#0b1739]">1 bay</p>
            <p className="mt-2 text-sm text-slate-500">
              Shared occupancy schedule
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-300 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#0b1739]">Bookings</h2>
            <p className="text-sm text-slate-500">
              Requested → confirmed → complete
            </p>
          </div>
          {error ? (
            <p className="mt-7 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
              Unable to load the booking calendar.
            </p>
          ) : bookings?.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-[.12em] text-slate-500">
                    <th className="pb-3 pr-4">When</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Service</th>
                    <th className="pb-3 pr-4">Vehicle</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {typedBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-[#0b1739]">
                          {formatDate(booking.starts_at, studioTimezone)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.reference}
                        </p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {booking.customer_email}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {booking.service_name}
                        <br />
                        <span className="text-xs">
                          {formatCurrency(booking.total_price_cents / 100)}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">
                        {booking.vehicle_description}
                      </td>
                      <td className="py-4">
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
            <p className="mt-7 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              No appointments in the database yet.
            </p>
          )}
        </div>
        <div className="mt-8 border-t border-slate-300 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-[#0b1739]">Services</h2>
          <p className="mt-2 text-sm text-slate-500">
            Manage these records through the protected admin RPCs documented in
            the setup guide.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {services?.map((service) => (
              <div
                key={service.id}
                className="border-t border-slate-200 p-4"
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
        </div>
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
    <section className="bg-[#f8fafc] px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-blue-100 bg-blue-50 p-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
          Admin setup
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[#0b1739]">
          Connect the studio database.
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Add Supabase credentials, apply the migration, and provision an admin
          member with the SQL command in the README. The dashboard will then
          read actual bookings and service records.
        </p>
      </div>
    </section>
  );
}

