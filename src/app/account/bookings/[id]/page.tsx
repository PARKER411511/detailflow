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
    <section className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/account"
          className="text-sm font-semibold text-[#2563eb] hover:text-[#1d4ed8]"
        >
          ← Your account
        </Link>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_330px] lg:items-start">
          <div>
            <p className="editorial-kicker text-[#2563eb]">
              Appointment {booking.reference}
            </p>
            <h1 className="display mt-5 text-6xl font-semibold text-[#0b1739] sm:text-7xl">
              {formatDate(booking.starts_at, studioSettings.timezone)}
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="border border-blue-200 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-700">
                {booking.status}
              </span>
              <span className="text-sm text-slate-500">
                {studioSettings.timezone}
              </span>
            </div>
            <div className="mt-12 grid gap-7 border-y border-slate-200 py-8 sm:grid-cols-2">
              <div>
                <p className="editorial-kicker text-slate-500">Service</p>
                <p className="mt-2 font-semibold text-[#0b1739]">
                  {service?.name ?? "Detail service"}
                </p>
              </div>
              <div>
                <p className="editorial-kicker text-slate-500">Total</p>
                <p className="mt-2 font-semibold text-[#0b1739]">
                  {formatCurrency(booking.total_price_cents / 100)}
                </p>
              </div>
              <div>
                <p className="editorial-kicker text-slate-500">Vehicle</p>
                <p className="mt-2 text-sm text-slate-600">
                  {booking.vehicle_description}
                </p>
              </div>
              <div>
                <p className="editorial-kicker text-slate-500">Studio</p>
                <p className="mt-2 text-sm text-slate-600">
                  19 Mercer Lane · Brooklyn
                </p>
              </div>
            </div>
            {booking.customer_notes && (
              <div className="mt-7 border-l-2 border-blue-400 bg-blue-50 p-5 text-sm leading-6 text-slate-700">
                <span className="font-semibold text-[#0b1739]">Your note: </span>
                {booking.customer_notes}
              </div>
            )}
          </div>
          <aside className="border-t border-slate-300 pt-7 lg:pt-0">
            <p className="editorial-kicker text-[#2563eb]">Manage your visit</p>
            {booking.status === "confirmed" || booking.status === "requested" ? (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Need to make a change? We ask for 24 hours’ notice.
                </p>
                <div className="mt-5">
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
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                This appointment is {booking.status} and no longer accepts
                customer changes.
              </p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
