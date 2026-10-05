import type { NextConfig } from "next";
import { isUnsafeSupabasePublicKey } from "./src/lib/supabase/config";

const exposedKeys = [
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
].filter((value): value is string => Boolean(value)).map((value) => value.trim());
const supabaseHostname = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname; } catch { return ""; }
})();
if (exposedKeys.some(isUnsafeSupabasePublicKey)) {
  throw new Error("A NEXT_PUBLIC_SUPABASE_* variable contains a server-only Supabase key. Use the publishable/anon key and keep secret keys server-only.");
}

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, ...(supabaseHostname ? [{ protocol: "https" as const, hostname: supabaseHostname, pathname: "/storage/v1/object/public/service-images/**" }] : [])] },
};

export default nextConfig;
