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

const compactImages: Record<string, { src: string; alt: string; position: string }> = {
  "the-refresh": {
    src: "/images/detailflow-paint-reflection-v2.png",
    alt: "Silver paint panel catching a clean studio reflection",
    position: "center 52%",
  },
  "the-correction": {
    src: "/images/detailflow-service-wheel-v1.png",
    alt: "Graphite alloy wheel with cobalt brake caliper under studio light",
    position: "center 50%",
  },
  "the-signature": {
    src: "/images/detailflow-cabin-dark-v1.png",
    alt: "Dark leather cockpit with precise stitched detailing",
    position: "center 48%",
  },
};

type ServiceCardProps = {
  service: Service;
  featured?: boolean;
  image?: string;
  variant?: "default" | "compact";
  ordinal?: number;
};

export function ServiceCard({ service, featured = false, image, variant = "default", ordinal }: ServiceCardProps) {
  if (variant === "compact") {
    const compactImage = compactImages[service.slug] ?? {
      src: "/images/detailflow-dark-studio-v1.png",
      alt: `${service.name} in the DetailFlow studio`,
      position: "center center",
    };

    return (
      <article className="service-card-compact">
        <Link href={`/service/${service.slug}`} className="service-card-compact-link">
          <div className="service-card-compact-media">
            <Image src={compactImage.src} alt={compactImage.alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw" style={{ objectPosition: compactImage.position }} />
            {ordinal ? <span className="service-card-compact-ordinal" aria-hidden="true">{String(ordinal).padStart(2, "0")}</span> : null}
          </div>
          <div className="service-card-compact-body">
            <div className="service-card-compact-top">
              <p className="service-card-compact-category">{homeCategories[service.slug] ?? "Studio service"}</p>
            </div>
            <div className="service-card-compact-heading">
              <h3>{service.name}</h3>
              <div className="service-card-compact-meta">
                <strong>{formatCurrency(service.price)}</strong>
                <span>{service.duration}</span>
              </div>
            </div>
            <ul className="service-card-compact-inclusions">
              {service.inclusions.slice(0, 3).map((inclusion) => <li key={inclusion}><span aria-hidden="true">✓</span>{inclusion}</li>)}
            </ul>
            <span className="service-card-compact-cta">Explore service <span aria-hidden="true">↗</span></span>
          </div>
        </Link>
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
