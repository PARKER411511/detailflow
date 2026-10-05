import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ vouchers: [] });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [{ data, error }, { data: activeBookings, error: activeBookingsError }] = await Promise.all([
    supabase.from("customer_vouchers").select("id, code, discount_kind, discount_value, expires_at, status, redeemed_at, service:services(slug, name)").eq("customer_id", user.id).order("expires_at", { ascending: true }),
    supabase.from("bookings").select("voucher_id").eq("customer_id", user.id).in("status", ["requested", "confirmed", "in_service"]).not("voucher_id", "is", null),
  ]);
  if (error || activeBookingsError) return NextResponse.json({ error: "Unable to load vouchers." }, { status: 503 });
  const reserved = new Set((activeBookings ?? []).map((booking) => booking.voucher_id).filter((id): id is string => Boolean(id)));
  return NextResponse.json({ vouchers: (data ?? []).map((voucher) => ({ ...voucher, reserved: reserved.has(voucher.id) })) }, { headers: { "Cache-Control": "private, no-store" } });
}
