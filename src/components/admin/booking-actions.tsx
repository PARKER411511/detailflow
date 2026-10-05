"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectMenu } from "@/components/dashboard/controls";

const transitions: Record<string, string[]> = {
  requested: ["confirmed", "cancelled"],
  confirmed: ["in_service", "cancelled"],
  in_service: ["completed"],
  completed: [],
  cancelled: [],
};

export function AdminBookingActions({ bookingId, status, initialNotes }: { bookingId: string; status: string; initialNotes?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(status);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const options = [status, ...(transitions[status] ?? [])];
  const statusOptions = options.map((option) => ({ value: option, label: option.replaceAll("_", " ") }));

  async function update() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, status: value, ...(initialNotes !== undefined ? { admin_notes: notes } : {}) }),
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
      <div className="min-w-[11rem]">
        <SelectMenu
          label="Status"
          ariaLabel={`Status for booking ${bookingId}`}
          value={value}
          onChange={setValue}
          options={statusOptions}
          disabled={busy || !(transitions[status]?.length ?? 0)}
        />
      </div>
      <button
        type="button"
        onClick={update}
        disabled={busy || (value === status && (initialNotes === undefined || notes === (initialNotes ?? ""))) || (value !== status && !transitions[status]?.includes(value))}
        className="action-primary px-3 py-2 text-xs disabled:opacity-40"
      >
        {busy ? "…" : "Save"}
      </button>
      {initialNotes !== undefined && (
        <label className="basis-full text-xs font-semibold uppercase tracking-[.12em] text-slate-500">
          Private staff note
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={4} placeholder="Only staff can see this note" className="field mt-2 font-normal normal-case tracking-normal" />
        </label>
      )}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
