"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const pageLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

export default function Footer() {
    return (
        <footer className="relative border-t border-border/60 mt-16">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-3">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-2xl glass soft-border shadow-[var(--shadow-sm)] grid place-items-center bg-gradient-to-b from-accent/20 to-accent/5">
                                <span className="text-accent font-bold text-lg">T</span>
                            </div>
                            <div>
                                <div className="font-display text-base font-semibold">
                                    Trivern
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Systems-first growth delivery.
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 max-w-md text-sm text-muted-foreground">
                            We install websites that capture, qualify, and follow up
                            automatically — so your pipeline grows while you work.
                        </p>
                    </div>

                    {/* Pages */}
                    <div className="grid gap-2 md:justify-self-center">
                        <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                            Pages
                        </div>
                        <div className="grid gap-2 text-sm">
                            {pageLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 focus-ring rounded-lg"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* CTA card */}
                    <div className="md:justify-self-end">
                        <div className="rounded-2xl glass soft-border p-5 shadow-[var(--shadow-sm)]">
                            <div className="text-sm font-semibold">
                                Ready for a clean install?
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                One conversation, then we map the system.
                            </p>
                            <Link href="/contact" className="mt-4 inline-flex">
                                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none hover-elevate active-elevate-2 min-h-9 px-4 py-2 group rounded-xl bg-white/10 hover:bg-white/[0.14] border border-white/10 text-foreground transition-all duration-300">
                                    Contact
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span>&copy; 2026 Trivern</span>
                        <Link href="/privacy-policy" className="hover:text-foreground transition-colors duration-300">Privacy &amp; Policy</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent/90 shadow-[0_0_0_6px_hsl(var(--accent)/0.08)]" />
                            High-contrast, low-noise UI.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
