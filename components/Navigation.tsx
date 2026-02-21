"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

export default function Navigation() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-transparent">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-3 focus-ring rounded-2xl"
                    >
                        <div className="relative h-10 w-10 overflow-hidden rounded-2xl glass soft-border shadow-[var(--shadow-sm)] grid place-items-center bg-gradient-to-b from-accent/20 to-accent/5">
                            <span className="text-accent font-bold text-lg">T</span>
                        </div>
                        <div className="leading-tight">
                            <div className="font-display text-[15px] font-semibold tracking-tight">
                                Trivern
                            </div>
                            <div className="text-[12px] text-muted-foreground">
                                Growth-ready systems
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-1 md:flex">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus-ring ${isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <span className="relative z-10">{link.label}</span>
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-0 -z-0 rounded-xl bg-white/5 border border-white/10 shadow-[var(--shadow-xs)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* CTA + mobile toggle */}
                <div className="flex items-center gap-2">
                    <Link href="/contact" className="hidden md:inline-flex">
                        <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover-elevate active-elevate-2 bg-primary border border-primary-border min-h-9 group relative overflow-hidden rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground shadow-accent/20 hover:shadow-accent/25 transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0">
                            Get an install plan
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </button>
                    </Link>
                    <div className="md:hidden">
                        <button
                            onClick={() => setOpen(!open)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover-elevate active-elevate-2 text-foreground min-h-9 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08]"
                        >
                            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            <span className="sr-only">{open ? "Close" : "Open"} menu</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
                    <div className="px-4 py-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${pathname === link.href
                                    ? "text-foreground bg-white/5"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/contact"
                            onClick={() => setOpen(false)}
                            className="block mt-2"
                        >
                            <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground transition-all duration-300">
                                Get an install plan
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
