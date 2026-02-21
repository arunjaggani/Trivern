"use client";

import React from "react";
import { Sparkles, Shield, Eye, Database, Cookie, Mail, Scale, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const sections = [
    {
        icon: <Eye className="h-5 w-5 text-accent" />,
        title: "Information We Collect",
        items: [
            "Contact information (name, email, phone number) when you submit our contact form.",
            "Business details you share during consultations, such as your website URL and company name.",
            "Usage data collected automatically, including pages visited, time spent, and referral source.",
            "Device and browser information for analytics purposes (screen size, OS, browser type).",
        ],
    },
    {
        icon: <Database className="h-5 w-5 text-accent" />,
        title: "How We Use Your Information",
        items: [
            "To respond to your inquiries and provide requested services.",
            "To prepare install plans, proposals, and project scopes tailored to your needs.",
            "To improve our website experience, performance, and content relevance.",
            "To send occasional updates about our services — only if you opt in.",
            "To comply with legal obligations and protect our legitimate business interests.",
        ],
    },
    {
        icon: <Shield className="h-5 w-5 text-accent" />,
        title: "Data Protection & Security",
        items: [
            "All form submissions are transmitted over encrypted HTTPS connections.",
            "We store data in secure, access-controlled environments with regular audits.",
            "We never sell, rent, or trade your personal information to third parties.",
            "Access to your data is limited to team members who need it to deliver our services.",
        ],
    },
    {
        icon: <Cookie className="h-5 w-5 text-accent" />,
        title: "Cookies & Tracking",
        items: [
            "We use essential cookies to ensure the website functions correctly.",
            "Analytics cookies (e.g., Google Analytics) help us understand traffic patterns — these are anonymized.",
            "No advertising or retargeting cookies are used on this website.",
            "You can disable cookies through your browser settings at any time.",
        ],
    },
    {
        icon: <Scale className="h-5 w-5 text-accent" />,
        title: "Your Rights",
        items: [
            "Access — Request a copy of the personal data we hold about you.",
            "Correction — Ask us to update or correct inaccurate data.",
            "Deletion — Request that we erase your personal data from our systems.",
            "Objection — Opt out of data processing for specific purposes, including marketing.",
            "Portability — Request your data in a structured, machine-readable format.",
        ],
    },
    {
        icon: <Clock className="h-5 w-5 text-accent" />,
        title: "Data Retention",
        items: [
            "Contact form submissions are retained for up to 24 months, then securely deleted.",
            "Analytics data is aggregated and anonymized after 14 months.",
            "Project-related data is retained for the duration of the engagement plus 12 months.",
            "You may request earlier deletion at any time by contacting us.",
        ],
    },
];

export default function PrivacyPolicyPage() {
    return (
        <>
            {/* ===== HERO ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Legal
                </div>
                <h1 className="mt-5 text-4xl md:text-6xl leading-[1.02]">
                    Privacy &amp; Policy
                </h1>
                <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground">
                    How we handle your data — clearly, responsibly, and with respect. No surprises.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                    Last updated: February 2026
                </p>
            </section>

            {/* ===== INTRO ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-6 md:p-8 shadow-[var(--shadow-sm)] noise">
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/[0.14] blur-3xl opacity-60" />
                    </div>
                    <div className="relative">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            At Trivern, we take your privacy seriously. This Privacy &amp; Policy page explains what
                            information we collect, why we collect it, and how we protect it. We believe in
                            transparency — the same way we build our systems: clear, structured, and respectful of
                            the people who use them.
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            This policy applies to all visitors and users of{" "}
                            <span className="text-foreground font-medium">trivern.com</span> and any associated
                            services we provide.
                        </p>
                    </div>
                </div>
            </section>

            {/* ===== SECTIONS ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sections.map((section, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow-sm)] noise transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-white/[0.15]"
                        >
                            {/* Decorative blob — hover only */}
                            <div aria-hidden="true" className="absolute inset-0">
                                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/[0.14] blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute inset-0 gridlines opacity-50" />
                            </div>

                            {/* Icon + Title */}
                            <div className="relative flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[var(--shadow-xs)] shrink-0">
                                    {section.icon}
                                </div>
                                <div className="mt-1">
                                    <div className="text-lg font-semibold">{section.title}</div>
                                </div>
                            </div>

                            {/* Items */}
                            <ul className="relative mt-4 grid gap-2.5">
                                {section.items.map((item, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/90 shadow-[0_0_0_6px_hsl(var(--accent)/0.08)]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== THIRD PARTIES ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        Third-party services
                    </div>
                    <h2 className="mt-3 text-3xl md:text-4xl">Tools we use</h2>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground">
                        We integrate with a small set of trusted third-party services to deliver our product.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { name: "Google Analytics", purpose: "Website traffic analysis (anonymized IP)" },
                        { name: "Google Sheets", purpose: "Secure storage of form submissions" },
                        { name: "Client-preferred hosting", purpose: "We deploy on the platform you choose (AWS, GCP, Azure, etc.)" },
                        { name: "WhatsApp Business", purpose: "Optional follow-up communication" },
                        { name: "Calendly", purpose: "Meeting scheduling (only if you choose to book)" },
                    ].map((tool, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-white/10 bg-white/5 p-5 noise"
                        >
                            <div className="text-sm font-semibold">{tool.name}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{tool.purpose}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CONTACT CTA ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 shadow-[var(--shadow-lg)] noise">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 text-accent" />
                                Questions?
                            </div>
                            <h3 className="mt-3 text-3xl md:text-4xl">
                                Have a privacy concern?
                            </h3>
                            <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                                Reach out and we&apos;ll respond within 24 hours. We take every data request seriously.
                            </p>
                        </div>
                        <Link href="/contact" className="inline-flex">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover-elevate active-elevate-2 bg-primary border border-primary-border min-h-9 group rounded-2xl px-6 py-6 h-auto text-base font-semibold bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground shadow-accent/[0.18] hover:shadow-accent/[0.22] transition-all duration-300 hover:-translate-y-0.5">
                                Contact us
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
