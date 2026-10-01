import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "DetailFlow | Thoughtful detailing, beautifully finished", template: "%s | DetailFlow" },
  description: "A considered auto detailing studio for paint, leather, and every small detail in between.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${geist.variable} antialiased`}><body className="min-h-screen bg-white text-slate-900"><SiteHeader /><main>{children}</main><SiteFooter /></body></html>;
}
