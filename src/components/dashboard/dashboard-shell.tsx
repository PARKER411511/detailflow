import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

const customerNav = [
  ["Overview", "/account"],
  ["Bookings", "/account/bookings"],
  ["Vouchers", "/account/vouchers"],
  ["Profile", "/account/profile"],
  ["Settings", "/account/settings"],
] as const;
const adminNav = [
  ["Overview", "/admin"],
  ["Appointments", "/admin/bookings"],
  ["Customers", "/admin/customers"],
  ["Vouchers", "/admin/vouchers"],
  ["Services", "/admin/services"],
  ["Studio settings", "/admin/settings"],
] as const;

function BrandMark() {
  return <svg aria-hidden="true" viewBox="0 0 38 38" className="dashboard-brand-mark" fill="none"><path d="M4 7h18l12 12-12 12H4l11-12L4 7Z" stroke="currentColor" strokeWidth="2" /><path d="M4 19h18M19 7v24" stroke="#60a5fa" strokeWidth="2" /></svg>;
}

export function DashboardShell({ children, role, email, fullName }: { children: React.ReactNode; role: "customer" | "admin"; email?: string | null; fullName?: string | null }) {
  const nav = role === "admin" ? adminNav : customerNav;
  const displayName = fullName?.trim() || email?.split("@")[0] || (role === "admin" ? "Studio team" : "Your account");
  return <div className={`dashboard-app dashboard-app-${role}`}>
    <aside className="dashboard-sidebar" aria-label={`${role === "admin" ? "Studio" : "Account"} navigation`}>
      <Link href="/" className="dashboard-brand" aria-label="Return to DetailFlow home"><BrandMark /><span><strong>DETAILFLOW</strong><small>{role === "admin" ? "Studio desk" : "Customer desk"}</small></span></Link>
      <div className="dashboard-sidebar-user"><span className="dashboard-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>{role === "admin" ? "Admin workspace" : "Customer account"}</small></span></div>
      <DashboardNav items={nav} />
      <div className="dashboard-sidebar-bottom"><Link href="/" className="dashboard-return">← Return to website</Link><form action="/auth/signout" method="post"><button type="submit" className="dashboard-signout">Sign out</button></form></div>
    </aside>
    <div className="dashboard-content"><header className="dashboard-mobile-top"><Link href="/" className="dashboard-mobile-brand"><BrandMark /><span>DETAILFLOW</span></Link><details className="dashboard-mobile-menu"><summary>Menu</summary><div><DashboardNav items={nav} /><Link href="/" className="dashboard-return">← Return to website</Link><form action="/auth/signout" method="post"><button type="submit" className="dashboard-signout">Sign out</button></form></div></details><Link href={role === "admin" ? "/admin" : "/account"} className="dashboard-mobile-account">{displayName}</Link></header>{children}</div>
  </div>;
}
