import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() {
  return <section className="px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[.95fr_1.05fr] lg:items-center"><div className="relative min-h-[520px] overflow-hidden bg-[#0b1739] p-7 text-white sm:p-10"><Image src="/images/detailflow-cinematic-hero.png" alt="AI-generated blue coupe in a premium studio" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-center opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b1739] via-[#0b1739]/30 to-transparent" /><div className="relative flex min-h-[450px] flex-col justify-between"><p className="editorial-kicker text-blue-200">Your DetailFlow account</p><div><h1 className="display max-w-xl text-6xl font-semibold sm:text-7xl">Keep the good stuff in motion.</h1><p className="mt-7 max-w-md text-base leading-7 text-white/75">Sign in to confirm appointments, keep your vehicle notes together, and see what’s coming up next.</p></div></div></div><div className="lg:px-8"><p className="editorial-kicker text-[#2563eb]">Welcome back</p><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] text-[#0b1739]">Sign in to continue.</h2><Suspense fallback={<div className="mt-8 h-96 animate-pulse border-t border-slate-200 bg-slate-50" />}><div className="mt-8"><AuthForm /></div></Suspense></div></div></section>;
}
