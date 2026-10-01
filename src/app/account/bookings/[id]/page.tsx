import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AccountActions, RescheduleForm } from "@/components/account-actions";
import { getStudioSettings } from "@/lib/studio-settings";
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
    <section className="bg-[#f8fafc] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/account"
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Your account
        </Link>
        <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                Appointment {booking.reference}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739]">
                {formatDate(booking.starts_at, studioSettings.timezone)}
              </h1>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
              {booking.status}
            </span>
          </div>
          <div className="mt-10 grid gap-5 border-t border-slate-100 pt-7 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[.15em] text-slate-500">
                Service
              </p>
              <p className="mt-2 font-semibold text-[#0b1739]">
                {service?.name ?? "Detail service"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.15em] text-slate-500">
                Total
              </p>
              <p className="mt-2 font-semibold text-[#0b1739]">
                {formatCurrency(booking.total_price_cents / 100)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.15em] text-slate-500">
                Vehicle
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {booking.vehicle_description}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.15em] text-slate-500">
                Studio
              </p>
              <p className="mt-2 text-sm text-slate-600">
                19 Mercer Lane · Brooklyn
              </p>
            </div>
          </div>
          {booking.customer_notes && (
            <div className="mt-7 rounded-2xl bg-[#eff6ff] p-5 text-sm leading-6 text-slate-600">
              <span className="font-semibold text-[#0b1739]">Your note: </span>
              {booking.customer_notes}
            </div>
          )}{" "}
          {(booking.status === "confirmed" ||
            booking.status === "requested") && (
            <div className="mt-9 border-t border-slate-100 pt-7">
              <p className="text-sm text-slate-500">
                Need to make a change? We ask for 24 hours’ notice.
              </p>
              <div className="mt-4">
                <AccountActions bookingId={booking.id} />
              </div>
              {service?.slug ? (
                <RescheduleForm
                  bookingId={booking.id}
                  serviceSlug={service.slug}
                  studioTimezone={studioSettings.timezone}
                  bookingHorizonDays={studioSettings.bookingHorizonDays}
                />
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  Rescheduling is temporarily unavailable for this service record.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

