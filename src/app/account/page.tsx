import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AccountActions } from "@/components/account-actions";
import { ProfileForm } from "@/components/profile-form";
import { getStudioTimezone } from "@/lib/studio-settings";
export const metadata: Metadata = { title: "Your account" };
export default async function AccountPage() {
  if (!isSupabaseConfigured())
    return (
      <section className="bg-[#f8fafc] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-blue-50 p-8">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
            Preview mode
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-[#0b1739]">
            Account setup is waiting.
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            Connect Supabase with the variables in `.env.local` to enable
            sign-in, booking history, and account management.
          </p>
          <Link
            href="/booking"
            className="mt-7 inline-flex rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white"
          >
            Return to booking
          </Link>
        </div>
      </section>
    );
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
  const upcoming =
    bookings?.filter(
      (booking) =>
        ["requested", "confirmed", "in_service"].includes(booking.status) &&
        new Date(booking.ends_at).getTime() > now,
    ) ?? [];
  const past =
    bookings?.filter(
      (booking) =>
        !["requested", "confirmed", "in_service"].includes(booking.status) ||
        new Date(booking.ends_at).getTime() <= now,
    ) ?? [];
  return (
    <section className="bg-[#f8fafc] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              Your account
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-.05em] text-[#0b1739]">
              Welcome back.
            </h1>
            <p className="mt-4 text-slate-600">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
              Sign out
            </button>
          </form>
        </div>
        <div className="mt-14 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#0b1739]">
              Appointments
            </h2>
            <Link
              href="/booking"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Book another ↗
            </Link>
          </div>
          {error ? (
            <p className="mt-8 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              We could not load your appointments. Check the database setup.
            </p>
          ) : bookings?.length ? (
            <div className="mt-7 space-y-8">
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
            <div className="mt-8 rounded-2xl bg-slate-50 p-7 text-center">
              <p className="font-semibold text-[#0b1739]">
                No appointments yet.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                When you’re ready, we’ll be here.
              </p>
              <Link
                href="/booking"
                className="mt-5 inline-flex rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white"
              >
                Find a time
              </Link>
            </div>
          )}
        </div>
        <ProfileForm
          initialName={profile?.full_name ?? ""}
          initialPhone={profile?.phone ?? ""}
        />
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
  bookings: Array<{
    id: string;
    reference: string;
    starts_at: string;
    ends_at: string;
    status: string;
    total_price_cents: number;
    service: unknown;
  }>;
  studioTimezone: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[.18em] text-blue-600">
          {title}
        </h3>
        <span className="text-xs text-slate-500">{bookings.length}</span>
      </div>
      {bookings.length ? (
        <div className="mt-3 divide-y divide-slate-100">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col justify-between gap-5 py-5 sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold text-[#0b1739]">
                    {Array.isArray(booking.service)
                      ? (booking.service[0] as { name?: string } | undefined)
                          ?.name
                      : ((booking.service as { name?: string } | null)?.name ??
                        "Detail service")}
                  </p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
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
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  Details
                </Link>
                {booking.status === "confirmed" ||
                booking.status === "requested" ? (
                  <AccountActions bookingId={booking.id} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No {title.toLowerCase()} appointments.
        </p>
      )}
    </section>
  );
}

