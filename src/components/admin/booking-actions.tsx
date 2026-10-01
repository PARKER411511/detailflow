"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const transitions: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_service", "cancelled"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
};

export function AdminBookingActions({ bookingId, status }: { bookingId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const options = [status, ...(transitions[status] ?? [])];

  async function update() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, status: value }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error ?? "Unable to update booking.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to reach the booking service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={!options.length || busy}
        aria-label={`Status for booking ${bookingId}`}
        className="field py-2 text-xs capitalize"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={update}
        disabled={busy || value === status || !transitions[status]?.includes(value)}
        className="action-primary px-3 py-2 text-xs disabled:opacity-40"
      >
        {busy ? "…" : "Save"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
