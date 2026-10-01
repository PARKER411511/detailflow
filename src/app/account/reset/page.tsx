import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";
export const metadata: Metadata = { title: "Reset password" };
export default function ResetPasswordPage() { return <section className="bg-[#f8fafc] px-5 py-24 sm:px-8"><div className="mx-auto max-w-md"><ResetPasswordForm /></div></section>; }
