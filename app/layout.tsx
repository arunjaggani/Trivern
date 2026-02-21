import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Trivern - Growth-ready websites with built-in AI & automation",
  description:
    "Trivern installs calm, high-converting websites with an AI agent + automation that capture, qualify, follow up, and manage leads automatically.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className={`${manrope.className} min-h-screen overflow-x-hidden`}>
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Top surface noise + gridlines */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10">
            <div className="surface noise h-[520px] w-full" />
            <div className="absolute inset-0 gridlines" />
          </div>

          <Navigation />
          <main className="relative">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
