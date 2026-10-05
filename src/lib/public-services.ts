import { services as previewServices, type Service, getServicePresentation } from "@/data/services";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getServiceImageUrl } from "@/lib/service-images";

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
      "slug, name, eyebrow, description, details, duration_minutes, price_cents, image_url, image_alt",
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
    imageUrl: getServiceImageUrl(service.image_url),
    imageAlt: service.image_alt || `${service.name} in the DetailFlow studio`,
    accent: accents[service.slug] ?? "#93c5fd",
    ...(getServicePresentation(service.slug) ?? { bestFor: "A focused studio visit shaped around the car in front of us.", inclusions: service.details.split(" · ").slice(0, 3), stages: ["Condition walkaround", "Careful studio work", "Clear handover"], outcome: "A more considered finish with the work explained at handover.", care: "Follow the care note shared by the studio after your visit." }),
  }));
}
export async function getPublicService(slug: string) {
  return (await getPublicServices()).find((service) => service.slug === slug);
}
