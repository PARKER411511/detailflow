import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { AccountDashboardFrame } from "@/components/account/account-dashboard-frame";

export const metadata: Metadata = { title: "Profile" };
export default async function AccountProfilePage() {
  if (!isSupabaseConfigured()) return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-empty-state"><h1>Profile</h1><p>Connect the studio database to manage your details.</p></div></section></AccountDashboardFrame>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/profile");
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
  return <AccountDashboardFrame><section className="dashboard-view"><div className="dashboard-view-header"><div><p className="dashboard-kicker">Your details</p><h1>Profile</h1><p className="dashboard-subtitle">Keep your contact details current for appointment updates.</p></div></div><div className="dashboard-form-card"><p className="dashboard-card-label">Contact details</p><ProfileForm initialName={profile?.full_name ?? ""} initialPhone={profile?.phone ?? ""} /><p className="dashboard-form-note">Signed in as {user.email}</p></div></section></AccountDashboardFrame>;
}
