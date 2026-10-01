import type { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = { title: "Gallery" };
const shots = [
  [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85",
    "Lines in the light",
    "Illustrative stock image",
  ],
  [
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85",
    "A quiet kind of shine",
    "Illustrative stock image",
  ],
  [
    "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=85",
    "Details, up close",
    "Illustrative stock image",
  ],
  [
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=85",
    "Ready for the road",
    "Illustrative stock image",
  ],
  [
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85",
    "The handover",
    "Illustrative stock image",
  ],
  [
    "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=85",
    "Form and finish",
    "Illustrative stock image",
  ],
];
export default function GalleryPage() {
  return (
    <>
      <section className="bg-[#eff6ff] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
            Gallery
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-.05em] text-[#0b1739] sm:text-7xl">
            Good light is
            <br />a great editor.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            A visual moodboard for the kind of finish we chase. These are
            illustrative stock images, not DetailFlow customer work.
          </p>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shots.map(([url, title, label]) => (
            <figure
              key={title}
              className="group overflow-hidden rounded-3xl bg-slate-100"
            >
              <div className="relative aspect-[4/5] overflow-hidden"><Image src={url} alt={`${title} · illustrative stock image`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
              <figcaption className="relative bg-white p-5">
                <p className="font-semibold text-[#0b1739]">{title}</p>
                <p className="mt-1 text-xs uppercase tracking-[.12em] text-slate-500">
                  {label}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}

