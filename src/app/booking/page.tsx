import type { Metadata } from "next";
import Image from "next/image";
import { BookingForm } from "@/components/booking-form";
import { getPublicServices } from "@/lib/public-services";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getStudioSettings } from "@/lib/studio-settings";
import { formatTimeZoneLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Book a detail" };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const params = await searchParams;
  const services = await getPublicServices();
  const studioSettings = await getStudioSettings();
  const configured = isSupabaseConfigured();
  let email: string | null = null;
  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  }
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-14 text-white sm:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="editorial-kicker text-blue-300">Book a detail</p><h1 className="display mt-5 max-w-3xl text-5xl font-semibold sm:text-7xl">Make time for the good stuff.</h1></div><div className="border-l border-white/20 pl-6"><p className="max-w-md text-base leading-7 text-blue-100/75">Choose a service, pick a studio time, and tell us about the car.</p><p className="mt-5 text-xs font-semibold uppercase tracking-[.14em] text-white/65">{formatTimeZoneLabel(studioSettings.timezone)} · {studioSettings.bookingHorizonDays}-day horizon</p></div></div></section>
      <section className="px-5 py-12 sm:px-8 lg:py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,720px)_300px] lg:items-start"><div className="border-t border-slate-300 pt-7 sm:pt-9">{services.length ? <BookingForm services={services} initialService={params.service} userEmail={email} studioTimezone={studioSettings.timezone} bookingHorizonDays={studioSettings.bookingHorizonDays} configured={configured} /> : <div className="border border-blue-200 bg-blue-50 p-6 text-sm leading-6 text-slate-700">The portfolio menu is waiting for active studio records. Appointments cannot be confirmed here.</div>}</div><aside className="space-y-8 lg:pt-1"><div><p className="editorial-kicker text-[#2563eb]">Your visit</p><ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm leading-6 text-slate-600"><li className="py-3"><span className="mr-3 text-[#2563eb]">01</span>One-bay studio, one car at a time</li><li className="py-3"><span className="mr-3 text-[#2563eb]">02</span>Confirmation reference after booking</li><li className="py-3"><span className="mr-3 text-[#2563eb]">03</span>Cancel or reschedule up to 24 hours before</li></ul></div><div className="image-frame aspect-[4/3]"><Image src="/images/detailflow-polishing.png" alt="AI-generated illustrative image of polishing work" fill sizes="(max-width: 1024px) 100vw, 300px" className="object-cover" /><p className="absolute bottom-3 left-3 bg-[#fffdfa]/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-[#0b1739]">AI-generated concept</p></div>{configured ? <p className="text-xs leading-6 text-slate-500">Availability is read from the configured studio calendar in {formatTimeZoneLabel(studioSettings.timezone)}.</p> : <p className="text-xs leading-6 text-slate-500">Portfolio demonstration — appointments cannot be confirmed here.</p>}</aside></div></section>
    </>
  );
}
