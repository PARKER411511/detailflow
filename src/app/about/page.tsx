import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Our approach" };

const principles = [
  ["Listen first", "Every car arrives with a story. We begin by hearing what you’ve noticed and how you use the car."],
  ["Make it visible", "We show the condition in plain language, then agree on a plan. No surprise add-ons, no pressure."],
  ["Leave a trail", "At pickup, you get a simple care note so the work lasts beyond the studio door."],
] as const;

export default function AboutPage() {
  return (
    <div className="marketing-page about-page">
      <section className="marketing-hero marketing-hero-about"><div className="marketing-container marketing-hero-grid"><div><p className="marketing-eyebrow">Studio / our approach</p><h1>Small studio. Deep attention.</h1></div><p className="marketing-hero-side">DetailFlow is a fictional independent studio built around a calm, clear, condition-led way to care for a car.</p></div></section>
      <section className="marketing-section about-main">
        <div className="marketing-container">
          <div className="about-grid">
            <div className="about-image"><Image src="/images/detailflow-dark-studio-v1.png" alt="Graphite coupe in a dark one-bay detailing studio" fill sizes="(max-width: 900px) 100vw, 44vw" className="object-cover" /></div>
            <div className="about-copy"><p className="marketing-eyebrow marketing-eyebrow-blue">How we work</p><h2>Less rush. More intent.</h2><div className="principle-list">{principles.map(([title, copy]) => <div key={title}><span>{title}</span><p>{copy}</p></div>)}</div></div>
          </div>
          <div className="about-note"><p>“The best detail is the one that makes you want to take the long way home.”</p><span>— DetailFlow studio note</span></div>
          <Link href="/booking" className="marketing-button">Book your first visit <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </div>
  );
}
