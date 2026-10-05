import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function getAdminContext(nextPath: string) {
  if (!isSupabaseConfigured()) return { supabase: null, user: null, allowed: false } as const;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const { data: allowed } = await supabase.rpc("is_admin");
  return { supabase, user, allowed: allowed === true } as const;
}
