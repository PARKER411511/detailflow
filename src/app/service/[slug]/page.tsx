import { notFound } from "next/navigation";
import Link from "next/link";
import { services } from "@/data/services";
import { getPublicService } from "@/lib/public-services";
import { formatCurrency } from "@/lib/format";
export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}
export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (!service) notFound();
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-24 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/services"
            className="text-sm text-blue-200 hover:text-white"
          >
            ← All services
          </Link>
          <p className="mt-16 text-xs font-bold uppercase tracking-[.2em] text-blue-300">
            {service.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-.05em] sm:text-7xl">
            {service.name}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100/75">
            {service.description}
          </p>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0b1739]">
              What’s included
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {service.details}. We’ll begin with a condition check and finish
              with a walkaround so you know exactly what changed.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#eff6ff] p-6">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                  Typical time
                </p>
                <p className="mt-3 text-xl font-semibold text-[#0b1739]">
                  {service.duration}
                </p>
              </div>
              <div className="rounded-2xl bg-[#eff6ff] p-6">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
                  Starting from
                </p>
                <p className="mt-3 text-xl font-semibold text-[#0b1739]">
                  {formatCurrency(service.price)}
                </p>
              </div>
            </div>
            <div className="mt-12 border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-[#0b1739]">
                A note on the quote
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Paint condition, vehicle size, and existing protection can
                change the final scope. We’ll confirm everything together before
                work begins.
              </p>
            </div>
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold text-[#0b1739]">
              Ready to find a time?
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Appointments are held in our one-bay calendar and confirmed after
              sign-in.
            </p>
            <Link
              href={`/booking?service=${service.slug}`}
              className="mt-7 block rounded-full bg-[#2563eb] px-5 py-4 text-center text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              Find an appointment <span aria-hidden>↗</span>
            </Link>
            <Link
              href="/contact"
              className="mt-3 block text-center text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              Have a question?
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
