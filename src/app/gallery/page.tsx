import type { Metadata } from "next";
import Image from "next/image";
import { BeforeAfter } from "@/components/before-after";

export const metadata: Metadata = { title: "Gallery" };

const gallery = [
  { src: "/images/detailflow-wheel-v2.png", title: "A clean line", copy: "Wheel and panel detail, held in a quiet frame." },
  { src: "/images/detailflow-materials-v2.png", title: "Material study", copy: "Texture, stitching, and the parts you touch." },
  { src: "/images/detailflow-polishing.png", title: "Measured correction", copy: "A patient pass across the paint." },
  { src: "/images/detailflow-studio-v2.png", title: "A quiet place to work", copy: "Single-bay studio, deliberate pace." },
];

export default function GalleryPage() {
  return (
    <>
      <section className="bg-[#eff6ff] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
          <div><p className="editorial-kicker text-[#2563eb]">Gallery / point of view</p><h1 className="display mt-5 max-w-4xl text-6xl font-semibold tracking-[-.045em] text-[#0b1739] sm:text-8xl">Good light is a great editor.</h1></div>
          <p className="max-w-md text-base leading-7 text-slate-600 lg:justify-self-end">A curated portfolio moodboard for the kind of finish we chase. Every image here is an AI-generated concept for this fictional studio, not customer work or verified results.</p>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
            {gallery.map((shot) => (
              <figure key={shot.title}>
                <div className="image-frame aspect-[4/3]"><Image src={shot.src} alt={shot.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>
                <figcaption className="border-b border-slate-200 py-4"><p className="text-lg font-medium tracking-[-.02em] text-[#0b1739]">{shot.title}</p><p className="mt-1 text-sm text-slate-600">{shot.copy}</p></figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-20 grid gap-8 border-t border-slate-200 pt-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start"><div><p className="editorial-kicker text-[#2563eb]">Surface study</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739]">See the idea in motion.</h2></div><div><BeforeAfter /><p className="mt-4 text-xs leading-5 text-slate-500">AI-generated illustrative comparison for the DetailFlow portfolio concept. It does not represent a real customer result.</p></div></div>
        </div>
      </section>
    </>
  );
}
