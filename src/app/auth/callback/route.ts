import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
function safeInternalPath(value: string | null, origin: string) { if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/"; try { const resolved = new URL(value, origin); return resolved.origin === origin ? `${resolved.pathname}${resolved.search}${resolved.hash}` : "/"; } catch { return "/"; } }
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), url.origin);
  if (!isSupabaseConfigured() || !code) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "auth_callback");
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "auth_callback");
    login.searchParams.set("next", next);
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
