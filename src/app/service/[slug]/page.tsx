import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { services, serviceImage } from "@/data/services";
import { getPublicService } from "@/lib/public-services";
import { formatCurrency } from "@/lib/format";

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (!service) notFound();
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-14 text-white sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Link href="/services" className="text-sm font-semibold text-blue-200 hover:text-white">← All services</Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div>
              <p className="editorial-kicker text-blue-300">{service.eyebrow}</p>
              <h1 className="display mt-6 max-w-3xl text-6xl font-semibold sm:text-8xl">{service.name}</h1>
            </div>
            <p className="max-w-xl text-lg leading-8 text-blue-100/75 lg:justify-self-end">{service.description}</p>
          </div>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <div className="image-frame aspect-[5/4]"><Image src={serviceImage(service.slug)} alt={`${service.name} illustrative studio image`} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" /><p className="absolute bottom-4 left-4 bg-[#fffdfa]/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0b1739]">AI-generated portfolio concept</p></div>
            <div className="mt-12 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2"><div><p className="editorial-kicker text-[#2563eb]">Typical time</p><p className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#0b1739]">{service.duration}</p></div><div><p className="editorial-kicker text-[#2563eb]">Studio price</p><p className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#0b1739]">{formatCurrency(service.price)}</p></div></div>
          </div>
          <div className="lg:pt-3">
            <p className="editorial-kicker text-[#2563eb]">The scope</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] text-[#0b1739]">A little more time for the details that matter.</h2>
            <p className="mt-6 text-base leading-7 text-slate-600">{service.details}. We’ll begin with a condition check and finish with a walkaround so you know exactly what changed.</p>
            <div className="mt-10 border-y border-slate-200 py-7"><p className="text-sm font-semibold text-[#0b1739]">Best for</p><p className="mt-3 text-base leading-7 text-slate-600">{service.bestFor}</p></div>
            <Link href={`/booking?service=${service.slug}`} className="mt-9 action-primary inline-flex items-center px-6 py-4 text-sm">Find an appointment <span aria-hidden className="ml-4">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-[#f5f7fb] px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="editorial-kicker text-[#2563eb]">How the visit moves</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] text-[#0b1739]">Careful by design.</h2></div><div className="grid gap-8 sm:grid-cols-3">{service.stages.map((stage, index) => <div key={stage} className="border-t border-slate-300 pt-5"><span className="text-sm font-semibold text-[#2563eb]">0{index + 1}</span><p className="mt-4 text-lg font-medium leading-7 text-[#0b1739]">{stage}</p></div>)}</div></div></section>
      <section className="px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2"><div className="border-t border-slate-300 pt-5"><p className="editorial-kicker text-[#2563eb]">At handover</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#0b1739]">{service.outcome}</h2></div><div className="border-t border-slate-300 pt-5"><p className="editorial-kicker text-[#2563eb]">Care note</p><p className="mt-4 text-base leading-7 text-slate-600">{service.care}</p><p className="mt-5 text-sm leading-6 text-slate-500">Condition, vehicle size, and existing protection can change the final scope. We’ll confirm any adjustment before work begins.</p></div></div></section>
    </>
  );
}
