"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient, isConfigured } from "@/lib/supabase/browser";

export function PasswordSettings({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function sendRecovery() {
    setMessage(null);
    if (!isConfigured()) { setMessage("Password recovery is unavailable in this preview."); return; }
    setBusy(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset` });
    setMessage(error ? error.message : "If this account can receive mail, a recovery link is on its way.");
    setBusy(false);
  }
  return <div className="dashboard-settings-stack"><p className="dashboard-card-copy">Send a secure recovery link to <strong>{email}</strong>. The link opens a short password update form and expires according to your auth settings.</p><button type="button" className="dashboard-secondary-action" onClick={sendRecovery} disabled={busy}>{busy ? "Sending…" : "Email a password reset link"}</button><Link href="/account/reset" className="dashboard-text-link">Already have a recovery link? Open the reset form <span aria-hidden="true">↗</span></Link>{message ? <p role="status" className="dashboard-alert">{message}</p> : null}</div>;
}
