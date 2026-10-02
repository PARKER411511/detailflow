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
  const [showPassword, setShowPassword] = useState(false);
  const isSignIn = mode === "signin";
  const configured = isConfigured();

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setMessage(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!configured) { setMessage("Portfolio demonstration — accounts cannot be confirmed here."); return; }
    setLoading(true);
    try { const supabase = createClient(); const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } }); if (result.error) { setMessage(result.error.message); return; } if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account, then come back here to sign in."); else router.push(next); } catch { setMessage("We could not complete that account request. Please try again."); } finally { setLoading(false); }
  }
  async function resetPassword() {
    setMessage(null);
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    if (!configured) { setMessage("Portfolio demonstration — accounts cannot be confirmed here."); return; }
    setLoading(true);
    try { const supabase = createClient(); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset` }); setMessage(error ? error.message : "If an account exists for that email, you’ll receive a reset link shortly."); } catch { setMessage("We could not complete that password request. Please try again."); } finally { setLoading(false); }
  }
  return (
    <div>
      <div className="flex gap-6 border-b border-slate-300">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          aria-pressed={isSignIn}
          className={`min-h-11 border-b-2 pb-3 text-sm font-bold ${isSignIn ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-slate-500"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          aria-pressed={!isSignIn}
          className={`min-h-11 border-b-2 pb-3 text-sm font-bold ${!isSignIn ? "border-[var(--blue)] text-[var(--blue)]" : "border-transparent text-slate-500"}`}
        >
          Create account
        </button>
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-[-.055em] text-[var(--ink)] sm:text-5xl">{isSignIn ? "Welcome back." : "Create your account."}</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{isSignIn ? "Sign in to manage appointments, vehicle notes, and your next handover." : "Keep your appointment details and vehicle notes together in one place."}</p>
      {!configured && <p className="mt-3 border-l-2 border-[var(--blue)] bg-blue-50 px-4 py-2 text-xs leading-5 text-blue-950">Portfolio demo — account access is unavailable in this preview.</p>}
      <form onSubmit={submit} className="mt-5 space-y-4" aria-describedby={message ? "auth-status" : undefined}>
        {mode === "signup" && (
          <label htmlFor="auth-name" className="block text-sm font-semibold text-slate-700">
            Name
            <input
              id="auth-name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field mt-2"
            />
          </label>
        )}
        <label htmlFor="auth-email" className="block text-sm font-semibold text-slate-700">
          Email
          <input
            id="auth-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field mt-2"
          />
        </label>
        <div>
          <label htmlFor="auth-password" className="block text-sm font-semibold text-slate-700">Password</label>
          <div className="relative mt-2">
            <input
              id="auth-password"
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              autoComplete={isSignIn ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pr-24"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 px-3 text-xs font-bold text-[var(--blue)] hover:text-[var(--blue-dark)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
          </div>
        </div>
        {message && (
          <p
            id="auth-status"
            role="status"
            className="border-l-2 border-[var(--blue)] bg-blue-50 p-4 text-sm leading-6 text-blue-900"
          >
            {message}
          </p>
        )}
        <button
          disabled={loading}
          type="submit"
          className="action-primary w-full px-5 py-4"
        >
          {loading
            ? "Working…"
            : isSignIn
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
          className="mt-5 min-h-11 text-left text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-dark)]"
        >
          Forgot your password?
        </button>
      )}
    </div>
  );
}
