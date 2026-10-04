/**
 * Supabase's current browser-safe key is called a publishable key. Keep the
 * legacy anon key as a fallback so existing deployments can upgrade without
 * a flag day, while never accepting the server-only secret here.
 */
export function getSupabasePublicKey() {
  const publishable = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return [publishable, anon].find((value) => value && !value.startsWith("your-") && !value.includes("example")) ?? "";
}

export function getSupabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

export function isUnsafeSupabasePublicKey(key: string) {
  if (key.startsWith("sb_secret_") || key.includes("service_role")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const decoded = atob(payload.replaceAll("-", "+").replaceAll("_", "/"));
    return JSON.parse(decoded).role === "service_role";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  const configuredKeys = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  ].map((value) => value.trim()).filter(Boolean);
  if (
    !url ||
    url.includes("your-project") ||
    !key ||
    key.startsWith("your-") ||
    key.includes("example") ||
    configuredKeys.some(isUnsafeSupabasePublicKey)
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}
