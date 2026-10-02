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
    <div className="functional-page booking-page">
      <section className="bg-[#0b1739] px-5 py-6 text-white sm:px-8 sm:py-8 lg:py-10"><div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="editorial-kicker text-blue-300">Book a detail</p><h1 className="display mt-3 max-w-3xl text-[2rem] font-semibold leading-tight sm:text-4xl">Book your detail.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/75 sm:text-base">Choose a service, pick a studio time, and tell us about the car.</p>{!configured && <p className="mt-3 max-w-md text-xs leading-5 text-blue-100/70">Appointments unavailable in this preview.</p>}</div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/65">{formatTimeZoneLabel(studioSettings.timezone)} · {studioSettings.bookingHorizonDays}-day horizon</p></div></section>
      <section className="px-5 py-6 sm:px-8 lg:py-12"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,720px)_300px] lg:items-start"><div className="border-t border-slate-300 pt-5 sm:pt-7">{services.length ? <BookingForm services={services} initialService={params.service} userEmail={email} studioTimezone={studioSettings.timezone} bookingHorizonDays={studioSettings.bookingHorizonDays} configured={configured} /> : <div className="functional-empty">The portfolio menu is waiting for active studio records. Appointments cannot be confirmed here.</div>}</div><aside className="space-y-8 lg:pt-1"><div><p className="editorial-kicker text-[#2563eb]">Your visit</p><ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 text-sm leading-6 text-slate-600"><li className="py-3"><span className="mr-3 text-[#2563eb]">01</span>One-bay studio, one car at a time</li><li className="py-3"><span className="mr-3 text-[#2563eb]">02</span>Confirmation reference after booking</li><li className="py-3"><span className="mr-3 text-[#2563eb]">03</span>Cancel or reschedule up to 24 hours before</li></ul></div><div className="image-frame aspect-[4/3]"><Image src="/images/detailflow-correction-craft-v1.png" alt="Detailer polishing graphite paint under a crisp studio light" fill sizes="(max-width: 1024px) 100vw, 300px" className="object-cover" /></div>{configured && <p className="text-xs leading-6 text-slate-500">Times shown in New York time.</p>}</aside></div></section>
    </div>
  );
}
