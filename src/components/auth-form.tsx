"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/browser";
export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next =
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/account";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!isConfigured()) { setMessage("Supabase is not configured for this preview. Add the variables in .env.local to enable accounts."); return; }
    setLoading(true);
    try { const supabase = createClient(); const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } }); if (result.error) { setMessage(result.error.message); return; } if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then come back here to sign in."); else router.push(next); } catch { setMessage("We could not reach Supabase. Check your project URL and network connection."); } finally { setLoading(false); }
  }
  async function resetPassword() {
    setMessage(null);
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    if (!isConfigured()) { setMessage("Supabase is not configured for this preview."); return; }
    setLoading(true);
    try { const supabase = createClient(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset` }); setMessage(error ? error.message : "If an account exists for that email, you’ll receive a reset link shortly."); } catch { setMessage("We could not reach Supabase. Check your project configuration."); } finally { setLoading(false); }
  }
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="flex gap-6 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`pb-4 text-sm font-semibold ${mode === "signin" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`pb-4 text-sm font-semibold ${mode === "signup" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}
        >
          Create account
        </button>
      </div>
      <form onSubmit={submit} className="mt-7 space-y-5">
        {mode === "signup" && (
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
            />
          </label>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            required
            minLength={8}
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal"
          />
        </label>
        {message && (
          <p
            role="status"
            className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800"
          >
            {message}
          </p>
        )}
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-full bg-[#2563eb] px-5 py-4 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {loading
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
          <span aria-hidden className="ml-3">
            ↗
          </span>
        </button>
      </form>
      {mode === "signin" && (
        <button
          type="button"
          onClick={resetPassword}
          disabled={loading}
          className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Forgot your password?
        </button>
      )}
    </div>
  );
}

