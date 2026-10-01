import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <section className="bg-[#f8fafc] px-5 py-24 sm:px-8"><div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-[1fr_420px] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Your DetailFlow account</p><h1 className="mt-5 text-5xl font-semibold tracking-[-.05em] text-[#0b1739] sm:text-6xl">Keep the good<br />stuff in motion.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-slate-600">Sign in to confirm appointments, keep your vehicle notes together, and see what’s coming up next.</p></div><Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" />}><AuthForm /></Suspense></div></section>; }
