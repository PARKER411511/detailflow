"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DashboardIcon } from "@/components/dashboard/dashboard-icon";

export function ProfileControl({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const identityLabel = email.split("@")[0] || "Account";

  useEffect(() => {
    function closeProfile(returnFocus = false) {
      setProfileOpen(false);
      if (returnFocus) window.requestAnimationFrame(() => profileButtonRef.current?.focus());
    }
    function close(event: PointerEvent) {
      if (!profileRef.current?.contains(event.target as Node)) closeProfile();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && profileOpen) closeProfile(true);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [profileOpen]);

  return <div ref={profileRef} className="site-header-profile">
    <button ref={profileButtonRef} type="button" className="site-header-profile-button" aria-label="Open your profile" aria-expanded={profileOpen} aria-haspopup="true" aria-controls="site-header-profile-menu" onClick={() => setProfileOpen((current) => !current)}>
      <span className="site-header-avatar" aria-hidden="true">{identityLabel.slice(0, 1).toUpperCase()}</span>
      <span className="site-header-profile-label">{identityLabel}</span>
      <svg className={`site-header-profile-caret ${profileOpen ? "is-open" : ""}`} aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {profileOpen ? <div id="site-header-profile-menu" className="site-header-profile-menu">
      <div className="site-header-profile-menu-head"><span className="site-header-avatar" aria-hidden="true">{identityLabel.slice(0, 1).toUpperCase()}</span><span><strong>{identityLabel}</strong><small>{email}</small></span></div>
      <Link href="/account" onClick={() => setProfileOpen(false)}><DashboardIcon name="profile" size={16} /><span>Account overview</span></Link>
      {isAdmin ? <Link href="/admin" onClick={() => setProfileOpen(false)}><DashboardIcon name="overview" size={16} /><span>Studio workspace</span></Link> : null}
      <form action="/auth/signout" method="post"><button type="submit"><DashboardIcon name="logout" size={16} /><span>Sign out</span></button></form>
    </div> : null}
  </div>;
}
