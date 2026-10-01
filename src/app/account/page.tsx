import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AccountActions } from "@/components/account-actions";
import { ProfileForm } from "@/components/profile-form";
import { getStudioTimezone } from "@/lib/studio-settings";

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
      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl border-t border-blue-300 pt-8">
          <p className="editorial-kicker text-[#2563eb]">Preview mode</p>
          <h1 className="display mt-5 text-6xl font-semibold text-[#0b1739]">
            Your account is ready when the studio is.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            This portfolio demonstration does not confirm appointments or maintain live account history.
          </p>
          <Link
            href="/booking"
            className="mt-8 inline-flex bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to booking
          </Link>
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
    <section className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 border-b border-slate-200 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="editorial-kicker text-[#2563eb]">Your account</p>
            <h1 className="display mt-5 text-6xl font-semibold text-[#0b1739] sm:text-8xl">
              Welcome back.
            </h1>
            <p className="mt-5 text-slate-600">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-[#2563eb] hover:text-[#2563eb]">
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-12 grid gap-14 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="editorial-kicker text-[#2563eb]">Appointments</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[#0b1739]">
                  Your calendar.
                </h2>
              </div>
              <Link
                href="/booking"
                className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Book another ↗
              </Link>
            </div>
            {error ? (
              <p className="mt-8 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                We could not load your appointments right now. Please try again.
              </p>
            ) : bookings?.length ? (
              <div className="mt-8 space-y-12">
                <BookingGroup
                  title="Upcoming"
                  bookings={upcoming}
                  studioTimezone={studioTimezone}
                />
                <BookingGroup
                  title="Past"
                  bookings={past}
                  studioTimezone={studioTimezone}
                />
              </div>
            ) : (
              <div className="mt-8 border-t border-slate-200 py-8">
                <p className="font-semibold text-[#0b1739]">No appointments yet.</p>
                <p className="mt-2 text-sm text-slate-500">
                  When you’re ready, we’ll be here.
                </p>
                <Link
                  href="/booking"
                  className="mt-5 inline-flex bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white"
                >
                  Find a time
                </Link>
              </div>
            )}
          </div>

          <div className="border-t border-slate-300 pt-8">
            <p className="editorial-kicker text-[#2563eb]">Your details</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Keep a phone number and name on file so the studio can reach you
              about an appointment.
            </p>
            <ProfileForm
              initialName={profile?.full_name ?? ""}
              initialPhone={profile?.phone ?? ""}
            />
          </div>
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
    <section>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="editorial-kicker text-[#2563eb]">{title}</h3>
        <span className="text-xs text-slate-500">{bookings.length}</span>
      </div>
      {bookings.length ? (
        <div className="divide-y divide-slate-200">
          {bookings.map((booking) => {
            const serviceName = Array.isArray(booking.service)
              ? (booking.service[0] as { name?: string } | undefined)?.name
              : (booking.service as { name?: string } | null)?.name;
            return (
              <div
                key={booking.id}
                className="flex flex-col justify-between gap-5 py-6 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-[#0b1739]">
                      {serviceName ?? "Detail service"}
                    </p>
                    <span className="border border-blue-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-blue-700">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(booking.starts_at, studioTimezone)} · Ref {booking.reference}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatCurrency(booking.total_price_cents / 100)}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <Link
                    href={`/account/bookings/${booking.id}`}
                    className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
                  >
                    Details
                  </Link>
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
        <p className="py-5 text-sm text-slate-500">
          No {title.toLowerCase()} appointments.
        </p>
      )}
    </section>
  );
}
