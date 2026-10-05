import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PasswordSettings } from "@/components/account/password-settings";
import { AccountDashboardFrame } from "@/components/account/account-dashboard-frame";

export const metadata: Metadata = { title: "Settings" };
export default async function AccountSettingsPage() {
  if (!isSupabaseConfigured()) return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-empty-state"><h1>Settings</h1><p>Connect the studio database to manage account settings.</p></div></section></AccountDashboardFrame>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/settings");
  return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Account access</p><h1>Settings</h1><p className="dashboard-subtitle">Manage your password and recovery options securely through Supabase Auth.</p></div></div><div className="dashboard-form-card"><p className="dashboard-card-label">Password</p><PasswordSettings email={user.email ?? ""} /></div></section></AccountDashboardFrame>;
}
