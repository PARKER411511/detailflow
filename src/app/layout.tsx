import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteFrame } from "@/components/site-frame";

const geist = localFont({ src: "../fonts/Geist-wght.woff2", variable: "--font-geist-sans", weight: "100 900", style: "normal", display: "swap" });
const barlow = localFont({ src: [{ path: "../fonts/BarlowCondensed-SemiBold.ttf", weight: "600" }, { path: "../fonts/BarlowCondensed-Bold.ttf", weight: "700" }], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "DetailFlow | Thoughtful detailing, beautifully finished", template: "%s | DetailFlow" },
  description: "A considered auto detailing studio for paint, leather, and every small detail in between.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} ${barlow.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--surface)] text-[var(--ink)]">
        <SiteFrame header={<SiteHeader />} footer={<SiteFooter />}><main>{children}</main></SiteFrame>
        <Script
          id="kivohelp-widget"
          src="https://kivohelp.com/widget.js"
          strategy="afterInteractive"
          async
          data-kivohelp-workspace="f28fa3ca-4a37-44c0-8531-945915c4ab1a"
          data-kivohelp-key="a3043e644fdc2758bde9fc24eeb9d6d2a75c"
        />
      </body>
    </html>
  );
}
