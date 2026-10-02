import Image from "next/image";
import Link from "next/link";
import { BeforeAfter } from "@/components/before-after";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-services";
import { serviceImage } from "@/data/services";

const stockImages = {
  hero: "/images/detailflow-motorsport-hero-v1.png",
  craft: "/images/detailflow-polishing.png",
  studio: "/images/detailflow-studio-v2.png",
};

const faqs = [
  ["How far ahead can I book?", "Appointments are planned up to 60 days ahead in the studio’s local time."],
  ["What if I need to change plans?", "You can cancel or reschedule up to 24 hours before your appointment from your account."],
  ["Do you work on all makes?", "Yes. Tell us what you drive and what you’ve noticed; we’ll recommend the right scope."],
  ["Where are you located?", "DetailFlow is a fictional preview studio at 19 Mercer Lane in Brooklyn."],
] as const;

export default async function Home() {
  const services = await getPublicServices();

  return (
    <>
      <section className="bg-[var(--navy)] px-4 pb-4 pt-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px] overflow-hidden bg-[var(--warm)] corner-cut">
          <div className="grid items-center lg:grid-cols-[.78fr_1.22fr]">
            <div className="relative flex min-h-0 flex-col p-6 text-[var(--ink)] sm:p-10 lg:min-h-[560px] lg:justify-between lg:p-12">
              <div className="flex items-start justify-between gap-6"><span className="editorial-kicker border border-slate-300 px-3 py-2 text-[var(--ink)]">Portfolio demonstration</span><span className="hidden text-right tech-label text-slate-500 sm:block">Brooklyn / One bay<br />Tue—Sat / 08—18</span></div>
              <div className="mt-5 max-w-[540px] lg:mt-0"><p className="editorial-kicker flex items-center gap-3 text-[var(--blue)]"><span className="h-px w-10 bg-[var(--blue)]" />Independent detailing studio</p><h1 className="hero-display mt-4 text-[4.35rem] sm:text-[6rem] lg:text-[6.7rem]">Built for<br /><span className="text-[var(--blue)]">the details.</span></h1><p className="mt-5 max-w-[410px] text-base leading-7 text-slate-600 sm:text-lg">Clear scope, careful hands, and a finish that holds its own in any light.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/booking" className="action-primary px-4 py-3.5 sm:px-5">Book a detail <span aria-hidden className="ml-2 sm:ml-3">↗</span></Link><Link href="#menu" className="action-secondary border-slate-400 px-3 py-3 text-sm text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white sm:px-5 sm:py-3.5">View the menu <span aria-hidden className="ml-2 sm:ml-3">↓</span></Link></div></div>
              <div className="mt-8 hidden grid-cols-3 gap-3 border-t border-slate-300 pt-4 text-[.7rem] text-slate-600 sm:grid lg:mt-10 lg:gap-5 lg:pt-5 lg:text-xs"><div><span className="tech-label block text-[var(--blue)]">01 / Inspect</span>Walkaround first</div><div><span className="tech-label block text-[var(--blue)]">02 / Refine</span>One car at a time</div><div><span className="tech-label block text-[var(--blue)]">03 / Return</span>Clear handover</div></div>
            </div>
            <div className="hero-art relative mx-0 aspect-[16/9] w-full overflow-hidden lg:mx-6 lg:w-[calc(100%-3rem)]">
              <Image src={stockImages.hero} alt="Silver sports coupe in a dark graphite detailing studio with cobalt architectural light" fill priority sizes="(max-width: 1024px) 100vw, 65vw" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-[var(--navy)]/90 px-4 py-3 text-white sm:px-5"><span className="tech-label text-white/80">DF / 001 — Surface study</span><span className="hidden tech-label text-white/60 sm:block">Cobalt light / graphite bay</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid border-b border-slate-200 bg-[var(--surface)] px-5 py-16 sm:px-8 sm:py-20 lg:py-20"><div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[.35fr_1fr] lg:gap-20"><div><p className="editorial-kicker text-[var(--blue)]">01 / Scope before shine</p><p className="mt-5 tech-label text-slate-500">Condition-led / clear recommendations</p></div><div><h2 className="max-w-4xl text-[2rem] font-semibold tracking-[-.025em] text-[var(--ink)] sm:text-[2.75rem]">Precision starts with the walkaround.</h2><div className="mt-7 grid max-w-4xl gap-6 text-base leading-7 text-slate-600 sm:grid-cols-2"><p>We listen to what you’ve noticed, inspect the surfaces in good light, and shape the visit around the actual condition of your car.</p><p>That keeps the plan practical, the handover clear, and the result honest. DetailFlow is a fictional studio built around focused attention.</p></div><Link href="/about" className="mt-7 inline-flex border-b border-[var(--blue)] pb-2 text-sm font-bold text-[var(--blue)]">See our approach <span aria-hidden className="ml-3">↗</span></Link></div></div></section>

      <section id="menu" className="border-b border-slate-200 bg-[var(--warm)] px-5 py-16 sm:px-8 sm:py-20 lg:py-20"><div className="mx-auto max-w-[1500px]"><div className="flex flex-col justify-between gap-6 border-b border-slate-300 pb-7 md:flex-row md:items-end"><div><p className="editorial-kicker text-[var(--blue)]">02 / Service menu</p><h2 className="mt-4 text-[2rem] font-semibold tracking-[-.025em] text-[var(--ink)] sm:text-[2.75rem]">Pick the scope that fits the car.</h2></div><Link href="/services" className="border-b border-[var(--blue)] pb-2 text-sm font-bold text-[var(--blue)]">All services & pricing <span aria-hidden className="ml-3">↗</span></Link></div><div className="mt-10 grid gap-x-7 gap-y-12 lg:grid-cols-3">{services.length ? services.map((service, index) => <ServiceCard key={service.slug} service={service} image={serviceImage(service.slug)} featured={index === 1} />) : <p className="border border-blue-200 bg-blue-50 p-6 text-sm text-slate-700 lg:col-span-3">The preview menu is waiting for its studio records. Appointments cannot be confirmed in this portfolio demonstration.</p>}</div></div></section>

      <section className="bg-[var(--navy)] px-5 py-16 text-white sm:px-8 sm:py-20 lg:py-20"><div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-20"><div><p className="editorial-kicker text-blue-300">03 / Craft in practice</p><h2 className="mt-5 max-w-xl text-[2rem] font-semibold tracking-[-.025em] sm:text-[2.75rem]">Measured passes. Visible decisions.</h2><p className="mt-6 max-w-lg text-base leading-7 text-blue-100/70">The studio is small by design. We can slow down, check the reflection, and explain what changed before the keys come back to you.</p><Link href="/about" className="mt-7 inline-flex border-b border-blue-300 pb-2 text-sm font-bold text-white">Our approach <span aria-hidden className="ml-3">↗</span></Link></div><div className="image-frame corner-cut aspect-[4/3]"><Image src={stockImages.craft} alt="Detailer using a machine polisher on deep blue paint" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" /><span className="absolute bottom-4 left-4 bg-[var(--warm)] px-3 py-2 tech-label text-[var(--ink)]">AI-generated portfolio concept</span></div></div></section>

      <section className="bg-[var(--surface)] px-5 py-16 sm:px-8 sm:py-20 lg:py-20"><div className="mx-auto max-w-[1500px]"><div className="grid gap-8 lg:grid-cols-[.55fr_1.45fr] lg:items-end"><div><p className="editorial-kicker text-[var(--blue)]">04 / Surface comparison</p><h2 className="mt-5 max-w-sm text-[2rem] font-semibold tracking-[-.025em] text-[var(--ink)] sm:text-[2.75rem]">See the care in the surface.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">Use the slider to compare an illustrative before / after concept built from AI-generated portfolio imagery. It is not a customer result.</p></div><BeforeAfter /></div></div></section>

      <section className="section-grid border-y border-slate-200 bg-[var(--warm)] px-5 py-12 sm:px-8 sm:py-16 lg:py-16"><div className="mx-auto max-w-[1500px]"><div className="flex items-end justify-between gap-6 border-b border-slate-300 pb-7"><div><p className="editorial-kicker text-[var(--blue)]">05 / The visit</p><h2 className="mt-4 text-[2rem] font-semibold tracking-[-.025em] text-[var(--ink)] sm:text-[2.75rem]">A clean handoff from start to finish.</h2></div><span className="hidden tech-label text-slate-500 md:block">Walkaround → studio → handover</span></div><div className="grid gap-0 md:grid-cols-3">{[["01", "Choose service", "Pick a scope that fits the car, then choose a time while you’re here."], ["02", "Arrive at the studio", "We confirm the condition and plan together before work begins."], ["03", "Collect your car", "We walk you through what changed and leave a simple care note."]].map(([index, title, copy]) => <div key={index} className="border-b border-slate-300 py-7 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0"><span className="tech-label text-[var(--blue)]">{index}</span><h3 className="mt-4 text-xl font-semibold tracking-[-.03em] text-[var(--ink)]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">{copy}</p></div>)}</div></div></section>

      <section className="bg-[var(--pale)] px-5 py-12 sm:px-8 sm:py-16 lg:py-16"><div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="editorial-kicker text-[var(--blue)]">06 / Before you arrive</p><h2 className="mt-5 text-[2rem] font-semibold tracking-[-.025em] text-[var(--ink)] sm:text-[2.75rem]">A few clear answers.</h2><div className="mt-7 border-l-2 border-[var(--blue)] pl-5 text-sm leading-7 text-slate-600"><p>Tue—Sat · 08:00—18:00</p><p>19 Mercer Lane, Brooklyn</p><p>Appointments planned up to 60 days ahead.</p></div></div><div className="divide-y divide-blue-200 border-y border-blue-200">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-[var(--ink)]"><span>{question}</span><span className="text-2xl font-light text-[var(--blue)] transition-transform group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>

      <section className="dark-grid bg-[var(--navy)] px-5 py-12 text-white sm:px-8 sm:py-16 lg:py-16"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="editorial-kicker text-blue-300">07 / Start with the car</p><h2 className="mt-5 max-w-2xl text-[2rem] font-semibold tracking-[-.025em] sm:text-[2.75rem]">Make the next drive feel considered.</h2></div><Link href="/booking" className="action-primary shrink-0 px-5 py-3.5">Find an appointment <span aria-hidden className="ml-3">↗</span></Link></div></section>
      <p className="sr-only">Photography throughout this page is illustrative stock imagery or AI-generated portfolio concept imagery and does not depict DetailFlow customers or verified results.</p>
    </>
  );
}
