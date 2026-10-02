import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BeforeAfter } from "@/components/before-after";

export const metadata: Metadata = { title: "Gallery" };

const gallery = [
  ["Wheel / finish", "/images/detailflow-motorsport-auth-v1.png", "Clean wheel and panel detail under studio light."],
  ["Paint / correction", "/images/detailflow-correction-craft-v1.png", "A measured pass across graphite paint."],
  ["Cabin / material", "/images/detailflow-cabin-dark-v1.png", "Texture, stitching, and the parts you touch."],
  ["Studio / light", "/images/detailflow-dark-studio-v1.png", "A single bay built for a slower, clearer handover."],
] as const;

export default function GalleryPage() {
  return (
    <div className="marketing-page gallery-page">
      <section className="marketing-hero marketing-hero-gallery"><div className="marketing-container marketing-hero-grid"><div><p className="marketing-eyebrow">Work / point of view</p><h1>Good light edits the finish.</h1></div><p className="marketing-hero-side">A portfolio moodboard for the kind of surface we chase. Every image is an illustrative concept, not customer work or verified results.</p></div></section>
      <section className="marketing-section gallery-section"><div className="marketing-container"><div className="gallery-grid">{gallery.map(([title, src, alt], index) => <figure key={src}><div className="gallery-image"><Image src={src} alt={alt} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" /></div><figcaption><strong>{title}</strong><span>{alt}</span></figcaption></figure>)}</div><div className="gallery-compare"><div><p className="marketing-eyebrow marketing-eyebrow-blue">Surface study</p><h2>See the idea in motion.</h2><p>Illustrative comparison imagery for this fictional studio. It does not represent a real customer result.</p></div><BeforeAfter /></div><Link href="/booking" className="marketing-button">Book your detail <span aria-hidden="true">↗</span></Link></div></section>
    </div>
  );
}
