"use client";

import { usePathname } from "next/navigation";

type SiteFrameProps = Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
}>;

export function SiteFrame({ children, header, footer }: SiteFrameProps) {
  const pathname = usePathname();
  const isFocusedAuthRoute = pathname === "/login" || pathname === "/account/reset";
  const isDashboardRoute = pathname === "/account" || pathname.startsWith("/account/") || pathname === "/admin" || pathname.startsWith("/admin/");

  if (isFocusedAuthRoute || isDashboardRoute) return <>{children}</>;

  return <>{header}{children}{footer}</>;
}
