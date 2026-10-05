"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, type DashboardIconName } from "@/components/dashboard/dashboard-icon";

export function DashboardNav({ items }: { items: ReadonlyArray<readonly [string, string, DashboardIconName?]> }) {
  const pathname = usePathname();
  return <nav className="dashboard-nav" aria-label="Workspace sections">{items.map(([label, href, icon = "overview"]) => { const active = href === "/account" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`dashboard-nav-link ${active ? "is-active" : ""}`}><span aria-hidden="true" className="dashboard-nav-icon"><DashboardIcon name={icon} size={17} /></span><span>{label}</span></Link>; })}</nav>;
}
