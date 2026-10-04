import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";
export function createClient() { return createBrowserClient(getSupabaseUrl(), getSupabasePublicKey()); }
export function isConfigured() { return isSupabaseConfigured(); }
