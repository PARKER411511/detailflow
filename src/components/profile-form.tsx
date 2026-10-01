"use client";
import { useState } from "react";
export function ProfileForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, phone }),
      });
      const body = await response.json();
      setMessage(
        response.ok
          ? "Profile saved."
          : (body.error ?? "Unable to save profile."),
      );
    } catch {
      setMessage("Unable to reach the account service.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="mt-10 rounded-3xl bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-2xl font-semibold text-[#0b1739]">Profile</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 field"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2 field"
          />
        </label>
      </div>
      {message && (
        <p role="status" className="mt-4 text-sm text-blue-700">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="action-primary mt-5 px-5 py-3 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
