"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/browser";
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!isConfigured()) {
      setMessage("Portfolio demonstration — accounts cannot be confirmed here.");
      return;
    }
    if (password.length < 8 || password !== confirm) {
      setMessage("Use at least 8 characters and make both passwords match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }
      router.push("/account");
    } catch {
      setMessage(
        "We could not update your password. Please request a fresh reset link.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9"
    >
      <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">
        Password reset
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-[#0b1739]">
        Choose a new password.
      </h1>
      <div className="mt-7 space-y-5">
        <label className="block text-sm font-medium text-slate-700">
          New password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 field"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Confirm password
          <input
            required
            minLength={8}
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-2 field"
          />
        </label>
        {message && (
          <p
            role="status"
            className="rounded-md bg-blue-50 p-4 text-sm leading-6 text-blue-800"
          >
            {message}
          </p>
        )}
        <button
          disabled={loading}
          type="submit"
          className="action-primary w-full px-5 py-4"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
