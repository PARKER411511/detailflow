import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/data/services";

const imageLabels: Record<string, string> = {
  "the-refresh": "Exterior care",
  "the-correction": "Paint correction",
  "the-signature": "Interior + protection",
};

const homeCategories: Record<string, string> = {
  "the-refresh": "Exterior reset",
  "the-correction": "Paint clarity",
  "the-signature": "Full expression",
};

type ServiceCardProps = {
  service: Service;
  featured?: boolean;
  image?: string;
  variant?: "default" | "compact";
};

export function ServiceCard({ service, featured = false, image, variant = "default" }: ServiceCardProps) {
  if (variant === "compact") {
    return (
      <article className="home-service-card">
        <div className="home-service-card-top">
          <p className="home-service-category">{homeCategories[service.slug] ?? "Studio service"}</p>
        </div>
        <h3>{service.name}</h3>
        <div className="home-service-meta">
          <span>{formatCurrency(service.price)}</span>
          <span>{service.duration}</span>
        </div>
        <ul>
          {service.inclusions.slice(0, 3).map((inclusion) => <li key={inclusion}>{inclusion}</li>)}
        </ul>
        <Link href={`/service/${service.slug}`} className="home-service-link">Explore service <span aria-hidden="true">↗</span></Link>
      </article>
    );
  }

  return (
    <article className={`group border-t-2 border-slate-300 ${featured ? "border-t-[var(--blue)]" : ""}`}>
      <Link href={`/service/${service.slug}`} className="block">
        <div className="image-frame aspect-[4/3] corner-cut">
          <Image src={image ?? "/images/detailflow-hero.png"} alt={`${service.name} illustrative studio image`} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
          <span className="absolute left-4 top-4 bg-[var(--warm)]/95 px-3 py-2 tech-label text-[var(--ink)]">{imageLabels[service.slug] ?? service.eyebrow}</span>
        </div>
        <div className="py-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="editorial-kicker text-[var(--blue)]">{service.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-.04em] text-[var(--ink)]">{service.name}</h2>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">{service.duration}</p>
              <p className="mt-1 font-semibold text-[var(--ink)]">{formatCurrency(service.price)}</p>
            </div>
          </div>
          <p className="mt-4 text-base leading-7 text-slate-600">{service.description}</p>
          <p className="mt-4 text-sm leading-6 text-slate-700"><span className="font-semibold text-[var(--ink)]">Best for: </span>{service.bestFor}</p>
          <ul className="mt-5 grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
            {service.inclusions.slice(0, 3).map((inclusion) => <li key={inclusion} className="flex gap-3"><span className="text-[var(--blue)]" aria-hidden>—</span>{inclusion}</li>)}
          </ul>
        </div>
        <span className="inline-flex items-center border-b border-[var(--blue)] pb-1 text-sm font-bold text-[var(--blue)]">See the scope <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">↗</span></span>
      </Link>
    </article>
  );
}
