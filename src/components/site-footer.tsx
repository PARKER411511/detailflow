import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[#0b1739] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div><p className="text-[14px] font-bold tracking-[.24em] text-white">DETAILFLOW</p><p className="mt-4 max-w-sm text-base leading-7 text-blue-100/75">Thoughtful care for cars worth keeping, in a fictional one-bay studio.</p></div>
          <div><h2 className="editorial-kicker text-blue-200">Explore</h2><div className="mt-5 space-y-3 text-sm text-blue-100/75"><Link className="block hover:text-white" href="/services">Services & pricing</Link><Link className="block hover:text-white" href="/gallery">Gallery</Link><Link className="block hover:text-white" href="/about">Our approach</Link></div></div>
          <div><h2 className="editorial-kicker text-blue-200">Visit</h2><p className="mt-5 text-sm leading-7 text-blue-100/75">19 Mercer Lane<br />Brooklyn, NY 11222<br /><br />Tue–Sat · 8am–6pm</p></div>
          <div><h2 className="editorial-kicker text-blue-200">Start here</h2><Link href="/booking" className="mt-5 inline-flex border-b border-blue-300 pb-1 text-sm font-semibold text-white hover:border-white">Book a detail <span aria-hidden className="ml-2">↗</span></Link><Link href="/contact" className="mt-4 block text-sm text-blue-100/75 hover:text-white">Contact the studio</Link><p className="mt-5 text-xs leading-5 text-blue-100/65">Portfolio demonstration — appointments cannot be confirmed here.</p></div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-xs text-blue-100/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><span>© 2026 DetailFlow Studio</span><span>Made for cars worth keeping.</span></div></div>
    </footer>
  );
}
