import type { Metadata } from "next";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-services";
import { serviceImage } from "@/data/services";

export const metadata: Metadata = { title: "Services & pricing" };

export default async function ServicesPage() {
  const serviceRecords = await getPublicServices();
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-24 text-white sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="editorial-kicker text-blue-300">Services / studio menu</p>
            <h1 className="display mt-6 max-w-4xl text-6xl font-semibold sm:text-8xl">
              A clear menu for considered care.
            </h1>
          </div>
          <div className="border-l border-white/20 pl-6 lg:mb-2">
            <p className="max-w-md text-base leading-8 text-blue-100/75 sm:text-lg">
              Three focused ways to bring a little more clarity to the everyday
              drive. Every scope starts with a walkaround and ends with a handover.
            </p>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[.16em] text-white/55">
              Portfolio menu · one-bay studio · USD
            </p>
          </div>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="editorial-kicker text-[#2563eb]">The menu</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] text-[#0b1739] sm:text-5xl">Choose your level of attention.</h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-600">Live services and pricing come from the studio database when configured. Preview records are clearly marked.</p>
          </div>
          {serviceRecords.length ? (
            <div className="grid gap-x-7 gap-y-14 lg:grid-cols-3">
              {serviceRecords.map((service, index) => (
                <ServiceCard key={service.slug} service={service} featured={index === 1} image={serviceImage(service.slug)} />
              ))}
            </div>
          ) : (
            <div className="border border-blue-200 bg-blue-50 p-7 text-sm leading-6 text-slate-700">
              No active service records are available yet. Connect the configured Supabase project and add a service from the protected admin workspace.
            </div>
          )}
          <div className="mt-24 grid gap-10 border-t border-slate-200 pt-10 md:grid-cols-3">
            <div><p className="editorial-kicker text-[#2563eb]">01 / All makes</p><p className="mt-4 text-lg font-medium leading-7 text-[#0b1739]">From a weekend classic to a daily commuter.</p></div>
            <div><p className="editorial-kicker text-[#2563eb]">02 / Clear scope</p><p className="mt-4 text-lg font-medium leading-7 text-[#0b1739]">Any correction or protection add-on is agreed before work starts.</p></div>
            <div><p className="editorial-kicker text-[#2563eb]">03 / Unsure?</p><p className="mt-4 text-lg font-medium leading-7 text-[#0b1739]">Use the contact page and tell us what you’re seeing.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
