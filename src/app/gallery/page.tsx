import type { Metadata } from "next";
import Image from "next/image";
import { BeforeAfter } from "@/components/before-after";

export const metadata: Metadata = { title: "Gallery" };

const shots = [
  { src: "/images/detailflow-paint-detail.png", title: "Water, light, surface", label: "AI-generated portfolio concept", className: "md:col-span-2 md:row-span-2", aspect: "aspect-[4/3] md:aspect-auto md:min-h-[620px]" },
  { src: "/images/detailflow-interior.png", title: "A quieter cabin", label: "AI-generated portfolio concept", className: "", aspect: "aspect-[4/5]" },
  { src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85", title: "Lines in the light", label: "Illustrative stock image", className: "", aspect: "aspect-[4/5]" },
  { src: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85", title: "A quiet kind of shine", label: "Illustrative stock image", className: "md:col-span-2", aspect: "aspect-[16/9]" },
  { src: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=85", title: "Form and finish", label: "Illustrative stock image", className: "", aspect: "aspect-[4/5]" },
];

export default function GalleryPage() {
  return (
    <>
      <section className="bg-[#eff6ff] px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.7fr] lg:items-end">
          <div><p className="editorial-kicker text-[#2563eb]">Gallery / point of view</p><h1 className="display mt-6 max-w-4xl text-6xl font-semibold text-[#0b1739] sm:text-8xl">Good light is a great editor.</h1></div>
          <p className="max-w-md text-lg leading-8 text-slate-600 lg:justify-self-end">A visual moodboard for the kind of finish we chase. These are illustrative images, not DetailFlow customer work.</p>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid auto-rows-auto gap-5 md:grid-cols-3">
            {shots.map((shot) => (
              <figure key={shot.title} className={`group ${shot.className}`}>
                <div className={`image-frame ${shot.aspect}`}><Image src={shot.src} alt={`${shot.title} · ${shot.label}`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" /></div>
                <figcaption className="flex items-start justify-between gap-4 border-b border-slate-200 py-4"><p className="font-medium text-[#0b1739]">{shot.title}</p><p className="text-right text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{shot.label}</p></figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-24 grid gap-10 border-t border-slate-200 pt-10 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
            <div><p className="editorial-kicker text-[#2563eb]">An honest comparison</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-[#0b1739]">See the idea in motion.</h2></div>
            <div><BeforeAfter /><p className="mt-4 text-xs leading-5 text-slate-500">AI-generated illustrative comparison for the DetailFlow portfolio concept. It does not represent a real customer result.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
