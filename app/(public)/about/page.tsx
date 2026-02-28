"use client";

import React from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { SectionBadge } from "@/components/SectionWrapper";
import AnimatedSection from "@/components/AnimatedSection";
import {
    MousePointerClick,
    ShieldCheck,
    Puzzle,
    Activity,
    Heart,
    Signal,
    Zap,
} from "lucide-react";

const principles = [
    { icon: <MousePointerClick className="h-5 w-5" />, title: "Single clear actions", desc: "One CTA per moment. Reduce cognitive load and increase decision velocity." },
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Qualify before you ask", desc: "Capture intent and context first — contact last. Respect earns response." },
    { icon: <Puzzle className="h-5 w-5" />, title: "Composable modules", desc: "Each piece works alone. Together they multiply impact." },
    { icon: <Activity className="h-5 w-5" />, title: "Quality holds", desc: "Accessibility, performance, stability. The system should survive traffic." },
];

export default function AboutPage() {
    return (
        <>
            {/* Hero */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
                <AnimatedSection>
                    <div className="max-w-3xl">
                        <SectionBadge label="About" />
                        <h1 className="mt-5 text-4xl leading-[1.02] md:text-6xl tracking-tight">
                            We build systems that your team can run.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground">
                            Not vibes. Not buzzwords. A clean install: interface, qualification, automation, and a feedback loop.
                        </p>
                    </div>
                </AnimatedSection>
            </section>

            {/* Positioning + Avoid/Expect */}
            <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
                <div className="grid gap-4 lg:grid-cols-2">
                    <AnimatedSection>
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-sm)] noise h-full">
                            <div aria-hidden="true" className="absolute inset-0">
                                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl bg-accent/[0.12]" />
                                <div className="absolute inset-0 gridlines opacity-50" />
                            </div>
                            <div className="relative">
                                <h3 className="text-lg font-semibold">Positioning</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground mb-5">
                                    We install growth-ready websites with built-in AI and marketing automation that capture, qualify, follow up, and manage leads automatically.
                                </p>
                                <div className="grid gap-3">
                                    {[
                                        { icon: <Heart className="h-3.5 w-3.5" />, text: "Calm UX: text-first, respectful interactions." },
                                        { icon: <Signal className="h-3.5 w-3.5" />, text: "Signal-first data: intent captured early." },
                                        { icon: <Zap className="h-3.5 w-3.5" />, text: "Automation that starts immediately and routes correctly." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent/90 shadow-[0_0_0_6px_hsl(var(--accent)/0.08)]" />
                                            <p className="text-sm text-muted-foreground">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                    <AnimatedSection delay={0.1}>
                        <div className="grid gap-4 h-full" style={{ gridTemplateRows: "1fr 1fr" }}>
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-sm)] noise">
                                <div aria-hidden="true" className="absolute inset-0">
                                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl bg-white/[0.06]" />
                                    <div className="absolute inset-0 gridlines opacity-50" />
                                </div>
                                <div className="relative">
                                    <h4 className="text-lg font-semibold">What we avoid</h4>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        Loud claims, invasive popups, and &quot;growth hacks.&quot; The product is the system — and it should feel quiet and inevitable.
                                    </p>
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-sm)] noise">
                                <div aria-hidden="true" className="absolute inset-0">
                                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl bg-white/[0.06]" />
                                    <div className="absolute inset-0 gridlines opacity-50" />
                                </div>
                                <div className="relative">
                                    <h4 className="text-lg font-semibold">What you can expect</h4>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        Clear scope, short feedback loops, and measurable improvements over time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Principles */}
            <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
                <AnimatedSection>
                    <div className="max-w-3xl">
                        <SectionBadge label="Principles" />
                        <h2 className="mt-3 text-3xl md:text-4xl">Systems-driven, not style-driven.</h2>
                        <p className="mt-3 text-base md:text-lg text-muted-foreground">Design matters — but only as part of an operable mechanism.</p>
                    </div>
                </AnimatedSection>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {principles.map((p, i) => (
                        <AnimatedSection key={i} delay={0.06 * i}>
                            <Card icon={p.icon} title={p.title} description={p.desc} tagline="Built for clarity • instrumented • automation-ready" />
                        </AnimatedSection>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                <AnimatedSection>
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 shadow-[var(--shadow-lg)] noise">
                        <div aria-hidden="true" className="absolute inset-0">
                            <div className="absolute -left-24 -bottom-28 h-80 w-80 rounded-full bg-accent/[0.16] blur-3xl" />
                            <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-[hsl(265_85%_65%/0.12)] blur-3xl" />
                            <div className="absolute inset-0 gridlines opacity-70" />
                        </div>
                        <div className="relative grid gap-6 md:grid-cols-12 md:items-center">
                            <div className="md:col-span-8">
                                <h3 className="text-3xl md:text-4xl italic">If you want calm growth, install a calm system.</h3>
                                <p className="mt-3 text-base text-muted-foreground">We&apos;ll map your current funnel and recommend what to install first.</p>
                            </div>
                            <div className="md:col-span-4 md:justify-self-end">
                                <Button href="/contact" size="lg">Contact</Button>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>
            </section>
        </>
    );
}
