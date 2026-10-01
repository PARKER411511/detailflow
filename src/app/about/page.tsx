import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "Our approach" };

const principles = [
  ["01 / Listen first", "Every car arrives with a story. We begin by hearing what you’ve noticed, what matters to you, and how you use the car."],
  ["02 / Make it visible", "We show you the condition in plain language, then agree on a plan. No surprise add-ons, no pressure."],
  ["03 / Leave a trail", "At pickup, you get a simple care note so the work lasts well beyond the studio door."],
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-[#0b1739] px-5 py-24 text-white sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.75fr] lg:items-end">
          <div><p className="editorial-kicker text-blue-300">Our approach / fictional studio</p><h1 className="display mt-6 max-w-4xl text-6xl font-semibold sm:text-8xl">Small studio. Deep attention.</h1></div>
          <p className="max-w-md text-lg leading-8 text-blue-100/75 lg:justify-self-end">DetailFlow is a fictional independent studio built around a simple idea: good car care should feel calm, clear, and considered.</p>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div className="image-frame aspect-[4/5]"><Image src="/images/detailflow-studio-v2.png" alt="AI-generated illustrative detail of a warm leather car interior" fill sizes="(max-width: 1024px) 100vw, 35vw" className="object-cover" /><p className="absolute bottom-4 left-4 bg-[#fffdfa]/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#0b1739]">AI-generated portfolio concept · fictional studio</p></div>
            <div className="lg:pt-3"><p className="editorial-kicker text-[#2563eb]">How we work</p><h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-.045em] text-[#0b1739] sm:text-5xl">A little less rush. A lot more intent.</h2><div className="mt-12 space-y-10">{principles.map(([title, copy]) => <div key={title} className="border-t border-slate-200 pt-6"><p className="editorial-kicker text-[#2563eb]">{title}</p><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{copy}</p></div>)}</div></div>
          </div>
          <div className="mt-20 grid gap-8 border-t border-slate-200 pt-10 md:grid-cols-[1fr_auto] md:items-end"><p className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-.04em] text-[#0b1739] sm:text-5xl">“The best detail is the one that makes you want to take the long way home.”</p><p className="text-sm text-slate-500">— DetailFlow studio note</p></div>
          <Link href="/booking" className="mt-12 action-primary inline-flex items-center px-6 py-4 text-sm">Book your first visit <span aria-hidden className="ml-4">↗</span></Link>
        </div>
      </section>
    </>
  );
}
