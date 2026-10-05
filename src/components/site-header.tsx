"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEffect, useRef } from "react";
import { createClient, isConfigured } from "@/lib/supabase/browser";

const standardNav = [["Services", "/services"], ["Work", "/gallery"], ["Studio", "/about"], ["Contact", "/contact"]];
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const darkHeader = true;
  const nav = isHome ? homeNav : standardNav;

  useEffect(() => {
    if (!isConfigured()) return;
    const supabase = createClient();
    let active = true;
    async function loadIdentity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setEmail(user?.email ?? null);
      if (user) {
        const { data: allowed } = await supabase.rpc("is_admin");
        if (active) setIsAdmin(allowed === true);
      } else setIsAdmin(false);
    }
    void loadIdentity();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadIdentity(); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const identityLabel = email?.split("@")[0] || "Account";
  useEffect(() => {
    function close(event: PointerEvent) { if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setProfileOpen(false); }
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);

  return (
    <header className={`site-header ${darkHeader ? "site-header-dark" : ""} ${isHome ? "site-header-home" : ""}`}>
      <div className="site-header-inner">
        <Link href="/" onClick={() => setOpen(false)} aria-label="DetailFlow home" className="site-header-brand">
          <BrandMark />
          <span><span className="site-header-wordmark">DETAILFLOW</span><span className="site-header-subtitle">Automotive studio</span></span>
        </Link>
        <nav className="site-header-nav" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={href} href={href} className="site-header-link">{label}</Link>)}
          {email ? <div ref={profileRef} className="site-header-profile"><button type="button" className="site-header-profile-button" aria-label="Open your profile" aria-expanded={profileOpen} aria-haspopup="true" onClick={() => setProfileOpen((current) => !current)}><span className="site-header-avatar" aria-hidden="true">{identityLabel.slice(0, 1).toUpperCase()}</span><span className="site-header-profile-label">{identityLabel}</span><span aria-hidden="true">⌄</span></button>{profileOpen ? <div className="site-header-profile-menu"><Link href="/account" onClick={() => setProfileOpen(false)}>Account overview</Link>{isAdmin ? <Link href="/admin" onClick={() => setProfileOpen(false)}>Studio workspace</Link> : null}<form action="/auth/signout" method="post"><button type="submit">Sign out</button></form></div> : null}</div> : <Link href="/login?next=/" className="site-header-signin">Sign in</Link>}
          <Link href="/booking" className="site-header-book">Book a detail <span aria-hidden="true">↗</span></Link>
        </nav>
        <button type="button" onClick={() => setOpen((isOpen) => !isOpen)} className="site-header-menu" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <span className="site-header-close" aria-hidden="true">×</span> : <><span /><span /><span /></>}
        </button>
      </div>
      {open && <nav id="mobile-navigation" className="site-header-mobile" aria-label="Mobile navigation">
        <div className="site-header-mobile-top"><span>Menu</span><span aria-hidden="true">/</span></div>
        {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="site-header-mobile-link">{label}<span aria-hidden="true">↗</span></Link>)}
        {email ? <><Link href="/account" onClick={() => setOpen(false)} className="site-header-mobile-link">Account<span aria-hidden="true">↗</span></Link>{isAdmin ? <Link href="/admin" onClick={() => setOpen(false)} className="site-header-mobile-link">Studio workspace<span aria-hidden="true">↗</span></Link> : null}<form action="/auth/signout" method="post"><button type="submit" onClick={() => setOpen(false)} className="site-header-mobile-link">Sign out<span aria-hidden="true">↗</span></button></form></> : <Link href="/login?next=/" onClick={() => setOpen(false)} className="site-header-mobile-link">Sign in<span aria-hidden="true">↗</span></Link>}
        <Link href="/booking" onClick={() => setOpen(false)} className="site-header-book site-header-mobile-book">Book a detail <span aria-hidden="true">↗</span></Link>
      </nav>}
    </header>
  );
}
