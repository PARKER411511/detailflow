"use client";

import Link from "next/link";
import { useState } from "react";

const nav = [["Services", "/services"], ["Gallery", "/gallery"], ["Our approach", "/about"], ["Contact", "/contact"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fffdfa]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" onClick={() => setOpen(false)} aria-label="DetailFlow home" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-[#0b1739] bg-[#0b1739] text-[11px] font-bold tracking-[-.08em] text-white">DF</span>
          <span>
            <span className="block text-[14px] font-bold tracking-[.24em] text-[#0b1739]">DETAILFLOW</span>
            <span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.17em] text-slate-500">Automotive studio</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#2563eb]">{label}</Link>)}
          <Link href="/login?next=/account" className="text-[13px] font-medium text-slate-600 transition-colors hover:text-[#2563eb]">Sign in</Link>
          <Link href="/booking" className="border-b border-[#2563eb] pb-1 text-[13px] font-bold text-[#2563eb] transition-colors hover:border-[#0b1739] hover:text-[#0b1739]">Book a detail <span aria-hidden className="ml-2">↗</span></Link>
        </nav>
        <button type="button" onClick={() => setOpen(!open)} className="rounded-none p-2 text-[#0b1739] lg:hidden" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
          <span className="block h-px w-6 bg-current" /><span className="my-1.5 block h-px w-6 bg-current" /><span className="block h-px w-6 bg-current" />
        </button>
      </div>
      {open && <nav className="border-t border-slate-200 bg-[#fffdfa] px-5 pb-6 pt-2 lg:hidden" aria-label="Mobile navigation">
        {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-slate-200 py-4 text-sm font-medium text-slate-700">{label}</Link>)}
        <Link href="/login?next=/account" onClick={() => setOpen(false)} className="block border-b border-slate-200 py-4 text-sm font-medium text-slate-700">Sign in</Link>
        <Link href="/booking" onClick={() => setOpen(false)} className="mt-5 inline-flex border-b border-[#2563eb] pb-1 text-sm font-bold text-[#2563eb]">Book a detail <span aria-hidden className="ml-2">↗</span></Link>
      </nav>}
    </header>
  );
}
