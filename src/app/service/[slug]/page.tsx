import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services, serviceImage } from "@/data/services";
import { getPublicService } from "@/lib/public-services";
import { formatCurrency } from "@/lib/format";

export function generateStaticParams() { return services.map(({ slug }) => ({ slug })); }

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getPublicService(slug);
  if (!service) notFound();
  return (
    <div className="marketing-page service-detail-page">
      <section className="marketing-hero marketing-hero-detail">
        <div className="marketing-container"><Link href="/services" className="marketing-back-link">← All services</Link><div className="marketing-detail-hero-row"><div><p className="marketing-eyebrow">{service.eyebrow}</p><h1>{service.name}</h1></div><p>{service.description}</p></div></div>
      </section>
      <section className="marketing-section marketing-detail-main"><div className="marketing-container marketing-detail-grid"><div><div className="marketing-detail-image"><Image src={service.imageUrl ?? (service.slug === "the-correction" ? "/images/detailflow-correction-craft-v1.png" : service.slug === "the-signature" ? "/images/detailflow-cabin-dark-v1.png" : serviceImage(service.slug))} alt={service.imageAlt || `${service.name} illustrative studio image`} fill priority sizes="(max-width: 900px) 100vw, 55vw" className="object-cover" /></div><div className="marketing-detail-meta"><div><span>Typical time</span><strong>{service.duration}</strong></div><div><span>Studio price</span><strong>{formatCurrency(service.price)}</strong></div></div></div><div className="marketing-detail-copy"><p className="marketing-eyebrow marketing-eyebrow-blue">The scope</p><h2>Measured work with a clear finish line.</h2><p>{service.details}. We begin with a condition check and finish with a walkaround so you know exactly what changed.</p><div className="marketing-detail-best"><span>Best for</span><p>{service.bestFor}</p></div><Link href={`/booking?service=${service.slug}`} className="marketing-button">Find an appointment <span aria-hidden="true">↗</span></Link></div></div></section>
      <section className="marketing-detail-stages"><div className="marketing-container marketing-detail-stages-grid"><div><p className="marketing-eyebrow marketing-eyebrow-blue">The visit</p><h2>Careful by design.</h2></div><div className="marketing-stage-list">{service.stages.map((stage, index) => <div key={stage}><span>0{index + 1}</span><p>{stage}</p></div>)}</div></div></section>
      <section className="marketing-detail-handover"><div className="marketing-container marketing-detail-handover-grid"><div><p className="marketing-eyebrow marketing-eyebrow-blue">At handover</p><h2>{service.outcome}</h2></div><div><p className="marketing-eyebrow marketing-eyebrow-blue">Care note</p><p>{service.care}</p><small>Condition, vehicle size, and existing protection can change the final scope. We’ll confirm any adjustment before work begins.</small></div></div></section>
    </div>
  );
}
