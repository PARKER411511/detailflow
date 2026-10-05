"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isConfigured } from "@/lib/supabase/browser";

const DEMO_MESSAGE = "Portfolio demo — account access is unavailable in this preview.";

function EyeIcon({ crossed = false }: { crossed?: boolean }) {
  return crossed ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.1A10.8 10.8 0 0 1 12 4.9c5.1 0 8.5 4.8 9.5 7.1a12.4 12.4 0 0 1-3.1 4.2M6.2 6.3C3.8 8 2.6 10.5 2.5 12c1 2.3 4.4 7.1 9.5 7.1 1.1 0 2.1-.2 3-.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12S5.9 4.9 12 4.9 21.5 12 21.5 12 18.1 19.1 12 19.1 2.5 12 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const callbackError = searchParams.get("error");
  const next =
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
      ? rawNext
      : "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(
    callbackError === "auth_callback"
      ? "That sign-in link is invalid or has expired. Please try again."
      : null,
  );
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
    if (!configured) {
      setMessage(DEMO_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { full_name: name },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
              },
            });
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account, then come back here to sign in.");
      } else {
        router.push(next);
      }
    } catch {
      setMessage("We could not complete that account request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setMessage(null);
    if (!email) {
      setMessage("Enter your email first.");
      return;
    }
    if (!configured) {
      setMessage(DEMO_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/reset`,
      });
      setMessage(error ? error.message : "If an account exists for that email, you’ll receive a reset link shortly.");
    } catch {
      setMessage("We could not complete that password request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-content" data-auth-mode={mode}>
      <div className="auth-mode-tabs" role="group" aria-label="Account mode">
        <button type="button" aria-pressed={isSignIn} onClick={() => switchMode("signin")}>Sign in</button>
        <button type="button" aria-pressed={!isSignIn} onClick={() => switchMode("signup")}>Create an account</button>
      </div>
      <h1 className="auth-title">{isSignIn ? "Welcome back" : "Create your account"}</h1>
      <p className="auth-intro">
        {isSignIn ? "Sign in to manage appointments, vehicle notes, and your next visit." : "Create an account to keep appointments and vehicle notes together."}
      </p>
      <form onSubmit={submit} className="auth-form" aria-describedby={message ? "auth-status" : undefined}>
        {mode === "signup" && (
          <label htmlFor="auth-name" className="auth-label">
            Name
            <input
              id="auth-name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="auth-field"
            />
          </label>
        )}
        <label htmlFor="auth-email" className="auth-label">
          Email
          <input
            id="auth-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-field"
          />
        </label>
        <div className="auth-password-group">
          <div className="auth-label">
            <label htmlFor="auth-password">Password</label>
            <span className="auth-password-input">
              <input
                id="auth-password"
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                aria-describedby={!isSignIn ? "auth-password-hint" : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="auth-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="auth-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                <EyeIcon crossed={showPassword} />
              </button>
            </span>
          </div>
          {!isSignIn && <p id="auth-password-hint" className="auth-password-hint">At least 8 characters.</p>}
          {isSignIn && (
            <button type="button" onClick={resetPassword} disabled={loading} className="auth-recovery">
              Forgot password?
            </button>
          )}
        </div>
        <button disabled={loading} type="submit" className="auth-submit">
          {loading ? "Working…" : isSignIn ? "Sign in" : "Create account"}
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      {!configured && !message && <p className="auth-demo-note">{DEMO_MESSAGE}</p>}
      {message && (
        <p id="auth-status" role="status" className="auth-status">
          {message}
        </p>
      )}
      <div className="auth-benefits" aria-label="Account features">
        <span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M5 3.5h10v13H5zM7.5 7h5M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Appointments</span>
        <span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M3.5 5.5h13v9h-13zM6 5.5V4M14 5.5V4M6.5 9h7M6.5 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Vehicle notes</span>
        <span><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M10 4a6 6 0 1 0 5.2 3M10 6.5V10l2.5 1.5M14.5 4v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Visit history</span>
      </div>
    </div>
  );
}
