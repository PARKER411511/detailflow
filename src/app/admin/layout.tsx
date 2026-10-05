import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) return <DashboardShell role="admin">{children}</DashboardShell>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : { data: null };
  return <DashboardShell role="admin" email={user?.email} fullName={profile?.full_name}>{children}</DashboardShell>;
}
