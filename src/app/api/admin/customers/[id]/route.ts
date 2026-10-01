import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid customer id." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: allowed } = await supabase.rpc("is_admin");
  if (allowed !== true) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { data, error } = await supabase.rpc("admin_list_customer_bookings", {
    p_customer_id: id,
  });
  if (error) return NextResponse.json({ error: "Unable to load booking history." }, { status: 503 });
  return NextResponse.json({ bookings: data ?? [] });
}
