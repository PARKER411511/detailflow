import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in" };

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 38 38" className={className} fill="none">
      <path d="M4 7h18l12 12-12 12H4l11-12L4 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4 19h18M19 7v24" stroke="var(--blue-bright)" strokeWidth="2" />
    </svg>
  );
}

function BrandLink({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`auth-wordmark ${light ? "auth-wordmark-light" : ""}`}
      aria-label="Back to DetailFlow home"
    >
      <BrandMark className="h-8 w-8" />
      <span>DETAILFLOW</span>
    </Link>
  );
}

export default function LoginPage() {
  return (
    <section className="auth-shell" aria-label="DetailFlow account access">
      <div className="auth-visual">
        <Image
          src="/images/detailflow-auth-split-v1.png"
          alt=""
          fill
          sizes="(min-width: 768px) 48vw, 0px"
          className="auth-visual-image"
          priority
        />
        <div className="auth-visual-shade" />
        <div className="auth-visual-brand">
          <BrandLink light />
        </div>
        <div className="auth-visual-caption">
          <p className="auth-overline">DetailFlow studio</p>
          <p className="auth-craft-line">Care is a craft. Every visit starts here.</p>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-mobile-header">
          <BrandLink />
          <Link href="/" className="auth-back-link">
            Back home <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <Link href="/" className="auth-back-link auth-desktop-back">
          Back home <span aria-hidden="true">↗</span>
        </Link>
        <div className="auth-form-column">
          <Suspense fallback={<div className="auth-loading" aria-hidden="true" />}>
            <AuthForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
