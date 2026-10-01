import Link from "next/link";
import Image from "next/image";
import { ServiceCard } from "@/components/service-card";
import { getPublicServices } from "@/lib/public-services";

const stockImages = {
  hero: "/images/detailflow-hero.png",
  interior:
    "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1100&q=85",
  detail:
    "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1100&q=85",
};

export default async function Home() {
  const services = await getPublicServices();
  return (
    <>
      <section className="relative overflow-hidden bg-[#0b1739] text-white">
        <Image
          src={stockImages.hero}
          alt="Royal blue coupe in a deep navy studio"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1739] via-[#0b1739]/85 to-[#0b1739]/25" />
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-end gap-10 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-24">
          <div className="max-w-2xl">
            <span className="mb-7 inline-flex rounded-full border border-blue-200/30 bg-blue-200/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-blue-100">Portfolio demo · fictional studio</span>
            <p className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[.25em] text-blue-200">
              <span className="h-px w-9 bg-blue-300" />
              Independent studio · Brooklyn
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-7xl">
              The good kind of
              <br />
              <span className="text-blue-300">particular.</span>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-blue-50/75">
              Thoughtful auto detailing for the cars you plan to keep. Clear
              process, careful hands, and a finish that holds its own in any
              light.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/booking"
                className="rounded-full bg-[#2563eb] px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-950/40 transition hover:bg-blue-500"
              >
                Book a detail{" "}
                <span className="ml-3" aria-hidden>
                  ↗
                </span>
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-white/30 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore services
              </Link>
            </div>
          </div>
          <div className="hidden justify-self-end lg:block">
            <div className="w-72 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">
                  Studio hours
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-200" />
              </div>
              <p className="mt-8 text-3xl font-semibold">Tue–Sat</p>
              <p className="mt-1 text-sm text-blue-100/70">8:00 am — 6:00 pm</p>
              <div className="my-6 h-px bg-white/15" />
              <p className="text-sm leading-6 text-blue-100/75">
                One bay. One car at a time. A little more attention where it
                counts.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              01 / Intentional
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We take fewer cars each day so every surface gets the time it
              deserves.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              02 / Transparent
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Clear packages, honest recommendations, and a plan you can
              understand.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
              03 / Built to last
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We focus on repeatable care that keeps your car looking right
              between visits.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-[#f8fafc] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
                The menu
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739] sm:text-5xl">
                Start with what
                <br />
                your car needs.
              </h2>
            </div>
            <Link
              href="/services"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all services <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {services.length ? services.map((service, index) => (
              <ServiceCard
                key={service.slug}
                service={service}
                featured={index === 1}
              />
            )) : <div className="rounded-3xl border border-blue-100 bg-blue-50 p-7 text-sm leading-6 text-slate-600 lg:col-span-3">No active service records are available yet. Connect the configured Supabase project to publish the live menu.</div>}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative h-[460px] overflow-hidden rounded-[2rem] bg-[#0b1739]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${stockImages.interior})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1739]/75 to-transparent" />
            <span className="absolute bottom-6 left-6 rounded-full bg-white/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#0b1739]">
              Illustrative stock image
            </span>
          </div>
          <div className="lg:pl-8">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              The DetailFlow way
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739] sm:text-5xl">
              Care you can
              <br />
              feel in the handover.
            </h2>
            <p className="mt-7 max-w-lg text-base leading-8 text-slate-600">
              We start with a walkaround, listen to what you’ve noticed, and
              make a plan around the actual condition of your car. At pickup,
              we’ll show you the work and give you a simple care plan for the
              weeks ahead.
            </p>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              <div className="border-l-2 border-blue-500 pl-4">
                <p className="font-semibold text-[#0b1739]">No mystery menu</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  You always know what’s included and why.
                </p>
              </div>
              <div className="border-l-2 border-blue-500 pl-4">
                <p className="font-semibold text-[#0b1739]">
                  One point of contact
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  A small studio means a human answer.
                </p>
              </div>
            </div>
            <Link
              href="/about"
              className="mt-9 inline-flex rounded-full bg-[#0b1739] px-6 py-4 text-sm font-semibold text-white hover:bg-blue-900"
            >
              See our approach{" "}
              <span aria-hidden className="ml-3">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-[#eff6ff] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739] sm:text-5xl">
              Three easy steps
              <br />
              to a better finish.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-7">
              <span className="text-5xl font-light text-blue-200">01</span>
              <h3 className="mt-10 text-xl font-semibold text-[#0b1739]">
                Choose your service
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Find the package that matches your car and how you use it.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-7">
              <span className="text-5xl font-light text-blue-200">02</span>
              <h3 className="mt-10 text-xl font-semibold text-[#0b1739]">
                Pick a time
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                We’ll show genuine openings from our one-bay calendar.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-7">
              <span className="text-5xl font-light text-blue-200">03</span>
              <h3 className="mt-10 text-xl font-semibold text-[#0b1739]">
                Hand over the keys
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                We’ll take it from here, then walk you through the result at
                pickup.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-7 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/detailflow-before.png')",
              }}
            />
            <div className="border-t border-white bg-white p-5">
              <p className="font-semibold text-[#0b1739]">
                Before · illustrative concept
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI-generated portfolio comparison, not a customer result.
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{ backgroundImage: `url(${stockImages.hero})` }}
            />
            <div className="border-t border-white bg-white p-5">
              <p className="font-semibold text-[#0b1739]">
                After · illustrative concept
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI-generated portfolio comparison, not a customer result.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#eff6ff] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
              A few answers
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-[#0b1739] sm:text-5xl">
              Before you arrive.
            </h2>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div className="border-t border-blue-200 pt-5">
              <h3 className="font-semibold text-[#0b1739]">
                How far ahead can I book?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The live calendar opens 60 days ahead in the studio’s local time
                zone.
              </p>
            </div>
            <div className="border-t border-blue-200 pt-5">
              <h3 className="font-semibold text-[#0b1739]">
                What if I need to change plans?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You can cancel or reschedule up to 24 hours before your
                appointment from your account.
              </p>
            </div>
            <div className="border-t border-blue-200 pt-5">
              <h3 className="font-semibold text-[#0b1739]">
                Do you work on all makes?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Yes. Tell us what you drive and what you’ve noticed; we’ll
                recommend the right scope.
              </p>
            </div>
            <div className="border-t border-blue-200 pt-5">
              <h3 className="font-semibold text-[#0b1739]">
                Where are you located?
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                DetailFlow is a fictional preview studio at 19 Mercer Lane in
                Brooklyn.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden bg-[#0b1739] px-5 py-24 text-white sm:px-8">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">
              Ready when you are
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
              Give your car
              <br />a little more room.
            </h2>
          </div>
          <Link
            href="/booking"
            className="rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#0b1739] hover:bg-blue-50"
          >
            Find an appointment{" "}
            <span aria-hidden className="ml-3">
              ↗
            </span>
          </Link>
        </div>
      </section>
      <p className="sr-only">
        Photography throughout this page is illustrative stock imagery from
        Unsplash and does not depict DetailFlow customers or results.
      </p>
    </>
  );
}
