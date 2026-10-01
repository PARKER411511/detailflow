import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const DEFAULT_STUDIO_TIMEZONE = "America/New_York";
export const DEFAULT_BOOKING_HORIZON_DAYS = 60;

export async function getStudioSettings() {
  if (!isSupabaseConfigured()) return { timezone: DEFAULT_STUDIO_TIMEZONE, bookingHorizonDays: DEFAULT_BOOKING_HORIZON_DAYS };
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("business_settings")
      .select("timezone, booking_horizon_days")
      .eq("id", true)
      .maybeSingle();
    return {
      timezone: data?.timezone || DEFAULT_STUDIO_TIMEZONE,
      bookingHorizonDays: data?.booking_horizon_days ?? DEFAULT_BOOKING_HORIZON_DAYS,
    };
  } catch {
    return { timezone: DEFAULT_STUDIO_TIMEZONE, bookingHorizonDays: DEFAULT_BOOKING_HORIZON_DAYS };
  }
}

export async function getStudioTimezone() {
  return (await getStudioSettings()).timezone;
}
