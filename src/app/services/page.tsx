import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-services";

export const metadata: Metadata = { title: "Services & pricing" };

export default async function ServicesPage() {
  const serviceRecords = await getPublicServices();
  return (
    <div className="marketing-page services-page">
      <section className="marketing-hero marketing-hero-services">
        <div className="marketing-container marketing-hero-grid">
          <div><p className="marketing-eyebrow">Services / studio menu</p><h1>Care for every surface.</h1></div>
          <div className="services-hero-side"><div className="services-hero-image"><Image src="/images/detailflow-inspection-v1.png" alt="Close inspection of a silver headlight and fender under studio light" fill priority sizes="(max-width: 767px) 100vw, 32vw" className="object-cover" /></div><div className="marketing-hero-side"><p>Three focused scopes, clearly priced and shaped around the condition of your car.</p><Link href="/contact" className="marketing-link">Talk through your car <span aria-hidden="true">↗</span></Link></div></div>
        </div>
      </section>
      <section className="marketing-section marketing-services-section">
        <div className="marketing-container">
          <div className="marketing-section-heading"><div><p className="marketing-eyebrow marketing-eyebrow-blue">The menu</p><h2>Focused work. Clear handover.</h2></div><p>Choose your scope. We confirm the vehicle condition before work starts.</p></div>
          {serviceRecords.length ? <div className="marketing-service-grid">{serviceRecords.map((service, index) => <ServiceCard key={service.slug} service={service} variant="compact" ordinal={index + 1} />)}</div> : <div className="functional-empty">The studio menu is unavailable in this preview.</div>}
          <div className="marketing-service-note"><Image src="/images/detailflow-ceramic-craft-v1.png" alt="Detailer applying ceramic protection to polished graphite paint" width={960} height={640} /><div><p className="marketing-eyebrow marketing-eyebrow-blue">Need a starting point?</p><h2>Bring us the condition. We’ll shape the scope.</h2><Link href="/booking" className="marketing-button">Book your detail <span aria-hidden="true">↗</span></Link></div></div>
        </div>
      </section>
    </div>
  );
}
