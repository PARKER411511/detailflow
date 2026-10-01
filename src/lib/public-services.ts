import { services as previewServices, type Service } from "@/data/services";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const accents: Record<string, string> = {
  "the-refresh": "#bfdbfe",
  "the-correction": "#93c5fd",
  "the-signature": "#2563eb",
};
function durationLabel(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0)
    return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `${minutes} minutes`;
}
export async function getPublicServices(): Promise<Service[]> {
  if (!isSupabaseConfigured()) return previewServices;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "slug, name, eyebrow, description, details, duration_minutes, price_cents",
    )
    .eq("active", true)
    .order("display_order");
  if (error || !data) return [];
  return data.map((service) => ({
    slug: service.slug,
    name: service.name,
    eyebrow: service.eyebrow,
    description: service.description,
    details: service.details,
    duration: durationLabel(service.duration_minutes),
    price: service.price_cents / 100,
    accent: accents[service.slug] ?? "#93c5fd",
  }));
}
export async function getPublicService(slug: string) {
  return (await getPublicServices()).find((service) => service.slug === slug);
}
