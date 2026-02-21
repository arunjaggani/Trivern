"use client";

import React from "react";
import { SectionBadge } from "@/components/SectionWrapper";
import AnimatedSection from "@/components/AnimatedSection";
import {
    Compass,
    DraftingCompass,
    Gauge,
    Cpu,
    ClipboardCheck,
    Radar,
    WandSparkles,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import Link from "next/link";

const steps = [
    {
        num: "01",
        icon: <Compass className="h-5 w-5 text-accent" />,
        title: "Diagnose",
        desc: "We map your offer, audience, and current funnel. Where does intent drop? Where is signal missing?",
    },
    {
        num: "02",
        icon: <DraftingCompass className="h-5 w-5 text-accent" />,
        title: "Design the flow",
        desc: "Visitor questions, friction removal, and a single clear CTA per page section — built for decision-making.",
    },
    {
        num: "03",
        icon: <Gauge className="h-5 w-5 text-accent" />,
        title: "Install instrumentation",
        desc: "Events and funnel checkpoints so you can see reality: what works, what leaks, what to fix next.",
    },
    {
        num: "04",
        icon: <Cpu className="h-5 w-5 text-accent" />,
        title: "Install AI + automation",
        desc: "A text-first agent qualifies intent → context → contact; automation routes, tags, and follows up immediately.",
    },
    {
        num: "05",
        icon: <ClipboardCheck className="h-5 w-5 text-accent" />,
        title: "Validate & hand off",
        desc: "We run a quality pass, document the system, and give you an iteration cadence you can sustain.",
    },
];

export default function HowItWorksPage() {
    return (
        <>
            {/* ===== HERO ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    How it works
                </div>
                <h1 className="mt-5 text-4xl md:text-6xl leading-[1.02]">
                    A predictable install process — not a creative lottery.
                </h1>
                <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground">
                    We build a system you can operate. Clear steps, clean handoff, measurable outcomes.
                </p>
            </section>

            {/* ===== STEPS ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                        Process
                    </div>
                    <h2 className="mt-3 text-3xl md:text-4xl">Five steps. No chaos.</h2>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground">
                        Enough rigor to ship well — enough flexibility to fit your offer and audience.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Step cards */}
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow-sm)] noise transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-white/[0.15]"
                        >
                            {/* Decorative blob — only appears on hover */}
                            <div aria-hidden="true" className="absolute inset-0">
                                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/[0.14] blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute inset-0 gridlines opacity-50" />
                            </div>

                            {/* Icon + Step number row */}
                            <div className="relative flex items-start justify-between gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 shadow-[var(--shadow-xs)]">
                                    {step.icon}
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                    {step.num}
                                </div>
                            </div>

                            {/* Title + Description */}
                            <div className="relative mt-4 text-lg font-semibold">{step.title}</div>
                            <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                                {step.desc}
                            </p>
                        </div>
                    ))}

                    {/* "What you get" card */}
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-6 shadow-[var(--shadow-md)] noise">
                        <div className="text-sm font-semibold">What you get</div>
                        <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <Radar className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                                A flow that captures intent + context before contact.
                            </div>
                            <div className="flex items-start gap-3">
                                <WandSparkles className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                                Automation that starts immediately — no manual waiting.
                            </div>
                            <div className="flex items-start gap-3">
                                <ClipboardCheck className="mt-0.5 h-4 w-4 text-accent shrink-0" />
                                Documentation + playbook for operating the system.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== BOTTOM CTA ===== */}
            <section className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 shadow-[var(--shadow-lg)] noise">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                Next step
                            </div>
                            <h3 className="mt-3 text-3xl md:text-4xl">
                                Get a plan in one conversation.
                            </h3>
                            <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                                We&apos;ll recommend what to install first, what to defer, and how to measure success.
                            </p>
                        </div>
                        <Link href="/contact" className="inline-flex">
                            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover-elevate active-elevate-2 bg-primary border border-primary-border min-h-9 group rounded-2xl px-6 py-6 h-auto text-base font-semibold bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground shadow-accent/[0.18] hover:shadow-accent/[0.22] transition-all duration-300 hover:-translate-y-0.5">
                                Contact
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
