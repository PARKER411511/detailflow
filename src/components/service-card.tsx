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
        <div className="grid gap-5 py-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="editorial-kicker text-[#2563eb]">{service.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[#0b1739]">{service.name}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{service.description}</p>
          </div>
          <div className="flex gap-5 text-right sm:block">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Price</p><p className="mt-1 font-semibold text-[#0b1739]">{formatCurrency(service.price)}</p></div>
            <div className="sm:mt-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Time</p><p className="mt-1 text-sm text-slate-700">{service.duration}</p></div>
          </div>
        </div>
        <span className="inline-flex items-center border-b border-[#2563eb] pb-1 text-sm font-bold text-[#2563eb]">See the scope <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">↗</span></span>
      </Link>
    </article>
  );
}
