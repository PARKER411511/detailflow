import { getSupabaseUrl } from "@/lib/supabase/config";

const safeImageKey = /^(?:\/images\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)|services\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp))$/;

export function getServiceImageUrl(imageKey: string | null | undefined) {
  if (!imageKey || !safeImageKey.test(imageKey)) return null;
  if (imageKey.startsWith("/images/")) return imageKey;
  const origin = getSupabaseUrl().replace(/\/$/, "");
  return origin ? `${origin}/storage/v1/object/public/service-images/${imageKey}` : null;
}
