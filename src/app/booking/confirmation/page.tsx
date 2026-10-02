import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Booking confirmation" };

export default async function BookingConfirmation({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const { reference } = await searchParams;
  const hasReference = Boolean(reference?.trim());
  const confirmed = isSupabaseConfigured() && hasReference;
  if (!confirmed) {
    return <div className="functional-page confirmation-page"><section className="confirmation-card confirmation-empty"><span className="confirmation-mark" aria-hidden="true">i</span><p className="functional-eyebrow">Booking preview</p><h1>{isSupabaseConfigured() ? "No booking reference found." : "Appointment confirmation is unavailable here."}</h1><p>{isSupabaseConfigured() ? "Open this page from the confirmation link after submitting a booking request." : "This portfolio preview shows the booking flow, but it is not connected to a live studio calendar."}</p><div className="confirmation-actions"><Link href="/booking" className="action-primary">Back to booking</Link><Link href="/" className="action-secondary">Return home</Link></div></section></div>;
  }
  return <div className="functional-page confirmation-page"><section className="confirmation-card"><span className="confirmation-mark" aria-hidden="true">✓</span><p className="functional-eyebrow">Appointment requested</p><h1>You’re on the calendar.</h1><p>We’ve recorded your request. Keep this reference for your records; the studio will confirm the appointment details from the live schedule.</p><div className="confirmation-reference">Reference · {reference}</div><div className="confirmation-actions"><Link href="/account" className="action-primary">View your account</Link><Link href="/" className="action-secondary">Return home</Link></div></section></div>;
}
