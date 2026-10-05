"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  const pathname = usePathname();
  return <nav className="dashboard-nav">{items.map(([label, href]) => { const active = href === "/account" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`dashboard-nav-link ${active ? "is-active" : ""}`}><span aria-hidden="true" className="dashboard-nav-mark" />{label}</Link>; })}</nav>;
}
