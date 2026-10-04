import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

const createSchema = z.object({
  service_slug: z.string().min(1).max(80),
  starts_at: z.string().datetime(),
  vehicle: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional().default(""),
});
const updateSchema = z.object({
  booking_id: z.string().uuid(),
  action: z.enum(["cancel", "reschedule"]),
  starts_at: z.string().datetime().optional(),
});

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function rpcFailure(error: { code?: string; message?: string }, fallback: string) {
  if (error.code === "23P01") {
    return { error: "That time was just taken. Choose another opening.", status: 409 };
  }
  if (error.code === "42501") {
    return { error: "You are not allowed to update this appointment.", status: 403 };
  }
  if (error.message?.includes("24 hours")) {
    return { error: "Changes need at least 24 hours’ notice.", status: 400 };
  }
  if (error.message?.includes("outside") || error.message?.includes("schedule") || error.message?.includes("closed")) {
    return { error: "That time is outside the studio schedule. Choose another opening.", status: 400 };
  }
  if (error.message?.includes("service unavailable")) {
    return { error: "That service is no longer available for rescheduling. Contact the studio for help.", status: 400 };
  }
  if (error.message?.includes("not found") || error.message?.includes("terminal")) {
    return { error: "That appointment can no longer be changed.", status: 400 };
  }
  return { error: fallback, status: 400 };
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Portfolio demonstration — appointments cannot be confirmed here." }, { status: 503 });
  const { supabase, user } = await getAuthedClient();
  if (!user) return NextResponse.json({ error: "Sign in to confirm an appointment." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the service, time, vehicle, and notes." }, { status: 400 });
  const { data, error } = await supabase.rpc("create_booking", {
    p_service_slug: parsed.data.service_slug,
    p_starts_at: parsed.data.starts_at,
    p_vehicle_description: parsed.data.vehicle,
    p_customer_notes: parsed.data.notes,
  });
  if (error) {
    const failure = rpcFailure(error, "We could not create that appointment.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  const booking = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ reference: booking?.reference ?? "created" }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Portfolio demonstration — appointments cannot be confirmed here." }, { status: 503 });
  const { supabase, user } = await getAuthedClient();
  if (!user) return NextResponse.json({ error: "Sign in to manage appointments." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || (parsed.data.action === "reschedule" && !parsed.data.starts_at)) return NextResponse.json({ error: "Choose a valid update." }, { status: 400 });
  const { data, error } = await supabase.rpc("update_my_booking", {
    p_booking_id: parsed.data.booking_id,
    p_action: parsed.data.action,
    p_new_starts_at: parsed.data.starts_at ?? null,
  });
  if (error) {
    const failure = rpcFailure(error, "We could not update that appointment.");
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
  return NextResponse.json({ booking: data });
}
