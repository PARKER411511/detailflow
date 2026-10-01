"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AccountActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  async function cancel() {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusy(true);
    setError(null); setSuccess(false);
    try { const response = await fetch("/api/bookings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ booking_id: bookingId, action: "cancel" }) }); const body = await response.json(); if (!response.ok) { setError(body.error ?? "Unable to cancel."); return; } setSuccess(true); router.refresh(); } catch { setError("Unable to reach the booking service."); } finally { setBusy(false); }
  }
  return (
    <div>
      {error && <p className="mb-3 text-xs text-rose-600">{error}</p>}
      {success && <p role="status" className="mb-3 text-xs text-emerald-700">Appointment cancelled.</p>}
      <button
        type="button"
        disabled={busy}
        onClick={cancel}
        className="text-sm font-semibold text-rose-600 hover:text-rose-800 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        {busy ? "Updating…" : "Cancel appointment"}
      </button>
    </div>
  );
}

export function RescheduleForm({
  bookingId,
  serviceSlug,
  studioTimezone,
  bookingHorizonDays,
}: {
  bookingId: string;
  serviceSlug: string;
  studioTimezone: string;
  bookingHorizonDays: number;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<
    Array<{ starts_at: string; label: string }>
  >([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const dateString = (dateValue: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: studioTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(dateValue)
      .filter((part) => part.type !== "literal")
      .reduce<Record<string, string>>((result, part) => {
        result[part.type] = part.value;
        return result;
      }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + bookingHorizonDays);
  async function find(value: string) {
    setDate(value);
    setSelected("");
    setSlots([]);
    setMessage(null);
    if (!value) return;
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/availability?date=${encodeURIComponent(value)}&service=${encodeURIComponent(serviceSlug)}`,
        { cache: "no-store" },
      );
      const body = await response.json();
      setSlots(response.ok ? (body.slots ?? []) : []);
      if (!response.ok)
        setMessage(body.error ?? "Availability is unavailable.");
      else if (!(body.slots ?? []).length)
        setMessage("There are no bookable openings on this date. Try another day.");
    } catch {
      setMessage("Unable to check availability.");
    } finally {
      setLoadingSlots(false);
    }
  }
  async function submit() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          action: "reschedule",
          starts_at: selected,
        }),
      });
      const body = await response.json();
      setMessage(
        response.ok
          ? "Appointment rescheduled."
          : (body.error ?? "Unable to reschedule."),
      );
      if (response.ok) router.refresh();
      if (response.status === 409 && date) await find(date);
    } catch {
      setMessage("Unable to reach the booking service.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-5">
      <p className="text-sm font-semibold text-[#0b1739]">Reschedule</p>
      <label className="mt-3 block text-xs font-semibold text-slate-600">
        New date
        <input
          type="date"
          min={dateString(minDate)}
          max={dateString(maxDate)}
          value={date}
          onChange={(event) => find(event.target.value)}
          className="field mt-2 font-normal"
        />
      </label>
      <p className="mt-2 text-xs text-slate-500">Times shown in {studioTimezone}.</p>
      {slots.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot) => (
            <label
              key={slot.starts_at}
              className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs focus-within:ring-2 focus-within:ring-blue-600 ${selected === slot.starts_at ? "border-blue-500 bg-white text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <input
                type="radio"
                name={`reschedule-${bookingId}`}
                checked={selected === slot.starts_at}
                onChange={() => setSelected(slot.starts_at)}
                className="sr-only"
              />
              {slot.label}
            </label>
          ))}
        </div>
      )}
      {loadingSlots && (
        <p className="mt-3 text-xs text-slate-500">Checking live availability…</p>
      )}
      {message && (
        <p role="status" className="mt-3 text-xs text-blue-700">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy || !selected}
        className="action-primary mt-4 px-4 py-2 text-xs disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save new time"}
      </button>
    </div>
  );
}

