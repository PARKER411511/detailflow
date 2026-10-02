"use client";

import Link from "next/link";
import { useState } from "react";

const nav = [["Services", "/services"], ["Gallery", "/gallery"], ["Our approach", "/about"], ["Contact", "/contact"]];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-[color:var(--surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" onClick={() => setOpen(false)} aria-label="DetailFlow home" className="group flex items-center gap-3">
          <svg aria-hidden="true" viewBox="0 0 38 38" className="h-9 w-9 text-[var(--ink)]" fill="none">
            <path d="M4 7h18l12 12-12 12H4l11-12L4 7Z" stroke="currentColor" strokeWidth="2" />
            <path d="M4 19h18M19 7v24" stroke="var(--blue)" strokeWidth="2" />
          </svg>
          <span><span className="block text-[13px] font-bold tracking-[.24em] text-[var(--ink)]">DETAILFLOW</span><span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.18em] text-slate-500">Automotive studio</span></span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className="text-[14px] font-semibold text-slate-600 transition-colors hover:text-[var(--blue)]">{label}</Link>)}
          <Link href="/login?next=/account" className="border-l border-slate-300 pl-7 text-[14px] font-semibold text-slate-600 transition-colors hover:text-[var(--blue)]">Sign in</Link>
          <Link href="/booking" className="action-primary px-4 py-2.5 text-[14px]">Book a detail <span aria-hidden className="ml-2">↗</span></Link>
        </nav>
        <button type="button" onClick={() => setOpen(!open)} className="min-h-11 min-w-11 rounded-md border border-slate-300 p-2 text-[var(--ink)] lg:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <span className="block text-2xl leading-none" aria-hidden>×</span> : <><span className="block h-px w-6 bg-current" /><span className="my-1.5 block h-px w-6 bg-current" /><span className="block h-px w-6 bg-current" /></>}
        </button>
      </div>
      {open && <nav id="mobile-navigation" className="border-t border-slate-200 bg-[var(--surface)] px-5 pb-7 pt-2 shadow-xl lg:hidden" aria-label="Mobile navigation">
        <div className="mb-4 border-b border-slate-300 py-3"><span className="tech-label text-slate-500">Navigation / 01</span></div>
        {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="block border-b border-slate-200 py-4 text-[16px] font-semibold text-[var(--ink)]">{label}</Link>)}
        <Link href="/login?next=/account" onClick={() => setOpen(false)} className="block border-b border-slate-200 py-4 text-[16px] font-semibold text-[var(--ink)]">Sign in</Link>
        <Link href="/booking" onClick={() => setOpen(false)} className="action-primary mt-5 flex w-full items-center justify-between px-4 py-3.5 text-[15px]">Book a detail <span aria-hidden>↗</span></Link>
      </nav>}
    </header>
  );
}
