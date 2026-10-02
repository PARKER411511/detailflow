import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";
export const metadata: Metadata = { title: "Reset password" };
export default function ResetPasswordPage() {
  return <section className="functional-page reset-page"><div className="reset-shell"><Link href="/login" className="dashboard-back-link">← Back to sign in</Link><ResetPasswordForm /></div></section>;
}
