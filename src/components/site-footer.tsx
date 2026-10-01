import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#0b1739] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <p className="editorial-kicker text-blue-300">DetailFlow studio</p>
            <p className="mt-8 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl">Every surface deserves a little more attention.</p>
          </div>
          <div><h2 className="editorial-kicker text-blue-200">Explore</h2><div className="mt-6 space-y-3 text-sm text-blue-100/75"><Link className="block hover:text-white" href="/services">Services & pricing</Link><Link className="block hover:text-white" href="/gallery">Gallery</Link><Link className="block hover:text-white" href="/about">Our approach</Link></div></div>
          <div><h2 className="editorial-kicker text-blue-200">Visit</h2><p className="mt-6 text-sm leading-7 text-blue-100/75">19 Mercer Lane<br />Brooklyn, NY 11222<br /><br />Tue–Sat · 8am–6pm</p></div>
          <div><h2 className="editorial-kicker text-blue-200">Start here</h2><Link href="/booking" className="mt-6 inline-flex border-b border-blue-300 pb-1 text-sm font-semibold text-white hover:border-white">Find an appointment <span aria-hidden className="ml-2">↗</span></Link><p className="mt-6 text-xs leading-5 text-blue-100/55">Portfolio demo · Booking requires Supabase setup.</p></div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-xs text-blue-100/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© 2026 DetailFlow Studio</span><span>Made for cars worth keeping.</span></div></div>
    </footer>
  );
}
