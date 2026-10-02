"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const standardNav = [["Services", "/services"], ["Gallery", "/gallery"], ["Our approach", "/about"], ["Contact", "/contact"]];
const homeNav = [["Services", "/services"], ["Work", "/gallery"], ["Studio", "/about"], ["Contact", "/contact"]];

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 38 38" className="site-header-mark" fill="none">
      <path d="M4 7h18l12 12-12 12H4l11-12L4 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 19h18M19 7v24" stroke="var(--header-blue)" strokeWidth="2" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const isHome = usePathname() === "/";
  const nav = isHome ? homeNav : standardNav;

  return (
    <header className={`site-header ${isHome ? "site-header-home" : ""}`}>
      <div className="site-header-inner">
        <Link href="/" onClick={() => setOpen(false)} aria-label="DetailFlow home" className="site-header-brand">
          <BrandMark />
          <span><span className="site-header-wordmark">DETAILFLOW</span><span className="site-header-subtitle">Automotive studio</span></span>
        </Link>
        <nav className="site-header-nav" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className="site-header-link">{label}</Link>)}
          <Link href="/login?next=/account" className="site-header-signin">Sign in</Link>
          <Link href="/booking" className="site-header-book">Book a detail <span aria-hidden="true">↗</span></Link>
        </nav>
        <button type="button" onClick={() => setOpen((isOpen) => !isOpen)} className="site-header-menu" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <span className="site-header-close" aria-hidden="true">×</span> : <><span /><span /><span /></>}
        </button>
      </div>
      {open && <nav id="mobile-navigation" className="site-header-mobile" aria-label="Mobile navigation">
        <div className="site-header-mobile-top"><span>Menu</span><span aria-hidden="true">/</span></div>
        {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="site-header-mobile-link">{label}<span aria-hidden="true">↗</span></Link>)}
        <Link href="/login?next=/account" onClick={() => setOpen(false)} className="site-header-mobile-link">Sign in<span aria-hidden="true">↗</span></Link>
        <Link href="/booking" onClick={() => setOpen(false)} className="site-header-book site-header-mobile-book">Book a detail <span aria-hidden="true">↗</span></Link>
      </nav>}
    </header>
  );
}
