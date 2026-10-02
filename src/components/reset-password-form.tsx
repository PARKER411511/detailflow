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
      setMessage("Portfolio demo — account access is unavailable in this preview.");
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
      className="reset-card"
    >
      <p className="dashboard-kicker">Password reset</p>
      <h1>Choose a new password</h1>
      <p className="reset-copy">Use at least 8 characters, then confirm the new password.</p>
      <div className="reset-fields">
        <label className="block text-sm font-medium text-slate-700">
          New password
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
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
            className="field"
          />
        </label>
        {message && (
          <p
            role="status"
            className="dashboard-alert dashboard-alert-info"
          >
            {message}
          </p>
        )}
        <button
          disabled={loading}
          type="submit"
          className="action-primary w-full"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
