import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/data/services";

const imageLabels: Record<string, string> = {
  "the-refresh": "Exterior care",
  "the-correction": "Paint correction",
  "the-signature": "Interior + protection",
};

export function ServiceCard({ service, featured = false, image }: { service: Service; featured?: boolean; image?: string }) {
  return (
    <article className={`group border-t border-slate-300 ${featured ? "border-t-[#2563eb]" : ""}`}>
      <Link href={`/service/${service.slug}`} className="block">
        <div className="image-frame aspect-[4/3]">
          <Image src={image ?? "/images/detailflow-hero.png"} alt={`${service.name} illustrative studio image`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
          <span className="absolute left-4 top-4 bg-[#fffdfa]/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0b1739]">{imageLabels[service.slug] ?? service.eyebrow}</span>
        </div>
        <div className="py-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="editorial-kicker text-[#2563eb]">{service.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#0b1739]">{service.name}</h2>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{service.duration}</p>
              <p className="mt-1 font-semibold text-[#0b1739]">{formatCurrency(service.price)}</p>
            </div>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-600">{service.description}</p>
          <p className="mt-4 text-sm leading-6 text-slate-700"><span className="font-semibold text-[#0b1739]">Best for: </span>{service.bestFor}</p>
          <ul className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
            {service.inclusions.slice(0, 3).map((inclusion) => <li key={inclusion} className="flex gap-3"><span className="text-[#2563eb]" aria-hidden>—</span>{inclusion}</li>)}
          </ul>
        </div>
        <span className="inline-flex items-center border-b border-[#2563eb] pb-1 text-sm font-bold text-[#2563eb]">See the scope <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">↗</span></span>
      </Link>
    </article>
  );
}
