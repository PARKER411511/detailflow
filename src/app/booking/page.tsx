import type { Metadata } from "next";
import { BookingForm } from "@/components/booking-form";
import { getPublicServices } from "@/lib/public-services";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getStudioSettings } from "@/lib/studio-settings";
export const metadata: Metadata = { title: "Book a detail" };
export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const services = await getPublicServices();
  const studioSettings = await getStudioSettings();
  let email: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">
            Book a detail
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
            Make time for
            <br />
            <span className="text-blue-300">the good stuff.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-blue-100/75">
            Choose a service, find a real opening, and we’ll take care of the
            rest.
          </p>
        </div>
      </section>
      <section className="bg-[#f8fafc] px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,720px)_300px] lg:items-start">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
            {services.length ? (
              <BookingForm
                services={services}
                initialService={params.service}
                userEmail={email}
                studioTimezone={studioSettings.timezone}
                bookingHorizonDays={studioSettings.bookingHorizonDays}
              />
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm leading-6 text-slate-600">
                Live service records are not available yet. Connect Supabase and
                add active services before booking.
              </div>
            )}
          </div>
          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                Your visit
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <li className="flex gap-3">
                  <span className="text-blue-500">✓</span> One-bay studio, one
                  car at a time
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500">✓</span> Confirmation
                  reference after booking
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-500">✓</span> Cancel or reschedule
                  up to 24 hours before
                </li>
              </ul>
            </div>
            <div className="rounded-3xl bg-[#eff6ff] p-6">
              <p className="text-sm font-semibold text-[#0b1739]">
                Booking preview
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The calendar and confirmation are powered by Supabase. This
                preview shows the full flow while waiting for project
                credentials.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
