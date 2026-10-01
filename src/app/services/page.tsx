import type { Metadata } from "next";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-services";
export const metadata: Metadata = { title: "Services & pricing" };
export default async function ServicesPage() {
  const services = await getPublicServices();
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-24 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">
            Services & pricing
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
            A clear menu for
            <br />
            <span className="text-blue-300">considered care.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-blue-100/75">
            Every package begins with a walkaround and ends with a handover.
            Prices shown reflect the studio menu; we’ll confirm the right scope
            before we begin.
          </p>
        </div>
      </section>
      <section className="bg-[#f8fafc] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {services.length ? (
              services.map((service, index) => (
                <ServiceCard
                  key={service.slug}
                  service={service}
                  featured={index === 1}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-7 text-sm leading-6 text-slate-600 lg:col-span-3">
                No active service records are available yet. Connect the
                configured Supabase project and add a service from the protected
                admin workspace.
              </div>
            )}
          </div>
          <div className="mt-14 rounded-3xl border border-blue-100 bg-blue-50 p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              Good to know
            </p>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <div>
                <p className="font-semibold text-[#0b1739]">
                  All makes welcome
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  From a weekend classic to a daily commuter.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#0b1739]">
                  We’ll call out extras
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Any correction or coating add-on is agreed before work starts.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#0b1739]">
                  Need a custom scope?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the contact page and tell us what you’re seeing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
