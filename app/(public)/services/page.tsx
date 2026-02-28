"use client";

import React from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { SectionBadge } from "@/components/SectionWrapper";
import AnimatedSection from "@/components/AnimatedSection";
import {
    Globe,
    Smartphone,
    Settings,
    Search,
    Megaphone,
    BarChart3,
    Palette,
    Rocket,
    Bot,
    Mail,
    MessageSquare,
    Target,
    Database,
    Workflow,
    LineChart,
    RefreshCw,
    Layout,
    Layers,
    Cpu,
    Zap,
    Sparkles,
} from "lucide-react";

const sections = [
    {
        num: "01",
        title: "Development & Engineering",
        subtitle: "High-performance interfaces built for scale.",
        cards: [
            { icon: <Globe className="h-5 w-5" />, title: "Web Design & Development", desc: "Premium, high-contrast web experiences optimized for conversion and performance.", accent: true },
            { icon: <Smartphone className="h-5 w-5" />, title: "Mobile App Development", desc: "Native and cross-platform mobile solutions that feel fast and intuitive." },
            { icon: <Settings className="h-5 w-5" />, title: "Custom Software Systems", desc: "Internal tools, dashboards, and automated workflows tailored to your ops." },
        ],
    },
    {
        num: "02",
        title: "Marketing & Growth",
        subtitle: "Systematic customer acquisition and visibility.",
        cards: [
            { icon: <Search className="h-5 w-5" />, title: "SEO Strategy", desc: "Technical and content SEO designed to capture high-intent search traffic." },
            { icon: <Megaphone className="h-5 w-5" />, title: "Marketing Services", desc: "Performance marketing and automation sequences that nurture leads to close." },
            { icon: <BarChart3 className="h-5 w-5" />, title: "Growth Instrumentation", desc: "Full-funnel tracking and analytics to remove friction from your growth engine." },
        ],
    },
    {
        num: "03",
        title: "Branding & Identity",
        subtitle: "Visual systems that build immediate trust.",
        cards: [
            { icon: <Palette className="h-5 w-5" />, title: "Branding Services", desc: "Complete visual identity systems including logos, type, and color palettes." },
            { icon: <Rocket className="h-5 w-5" />, title: "Branding for Startups", desc: "Fast-track identity design for early-stage teams ready to launch confidently." },
            { icon: <Bot className="h-5 w-5" />, title: "AI Brand Integration", desc: "Deploying AI voice and personality that aligns perfectly with your brand DNA." },
        ],
    },
];

const automationCards = [
    { icon: <Mail className="h-5 w-5" />, title: "Email Automation", desc: "Automated email sequences, drip campaigns, triggered sends, and personalized follow-ups." },
    { icon: <MessageSquare className="h-5 w-5" />, title: "SMS Marketing Automation", desc: "Automated SMS campaigns, text-based follow-ups, and time-sensitive notifications." },
    { icon: <Target className="h-5 w-5" />, title: "Lead Scoring & Qualification", desc: "Automatic lead scoring based on behavior, demographics, and engagement." },
    { icon: <Database className="h-5 w-5" />, title: "CRM Integration", desc: "Seamless sync between marketing tools, forms, and CRM systems." },
    { icon: <Bot className="h-5 w-5" />, title: "Chatbot & AI Agents", desc: "AI-powered conversational agents for qualification and customer support." },
    { icon: <Workflow className="h-5 w-5" />, title: "Workflow Automation", desc: "Custom automation workflows for internal processes and lead routing." },
    { icon: <LineChart className="h-5 w-5" />, title: "Analytics & Reporting", desc: "Dashboard creation, custom reports, funnel analysis, performance tracking." },
    { icon: <RefreshCw className="h-5 w-5" />, title: "Data Sync & API Integration", desc: "Custom API integrations, real-time data syncing between systems." },
    { icon: <Layout className="h-5 w-5" />, title: "Landing Page Automation", desc: "Dynamic landing pages with automated form collection and data routing." },
];

export default function ServicesPage() {
    return (
        <>
            {/* Hero */}
            <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
                <div className="grid items-start gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <AnimatedSection>
                            <SectionBadge label="Comprehensive Solutions" icon />
                            <h1 className="mt-5 text-4xl leading-[1.02] md:text-6xl tracking-tight">
                                We install systems.{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[hsl(160_84%_45%)]">
                                    Across every touchpoint.
                                </span>
                            </h1>
                            <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground">
                                From web and mobile development to SEO and startup branding, we provide the variety of services needed to build a high-performance growth engine.
                            </p>
                            <div className="mt-7">
                                <Button href="/contact" size="lg">Start your project</Button>
                            </div>
                        </AnimatedSection>
                    </div>
                    <div className="lg:col-span-5">
                        <AnimatedSection fade delay={0.3}>
                            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[var(--shadow-md)] noise">
                                <div aria-hidden="true" className="absolute inset-0">
                                    <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.12] blur-3xl" />
                                    <div className="absolute inset-0 gridlines opacity-70" />
                                </div>
                                <div className="relative">
                                    <h3 className="text-sm font-semibold mb-4">Core Capabilities</h3>
                                    <div className="grid gap-2">
                                        {[
                                            { icon: <Layers className="h-4 w-4" />, label: "Systems Architecture" },
                                            { icon: <Cpu className="h-4 w-4" />, label: "AI Implementation" },
                                            { icon: <Zap className="h-4 w-4" />, label: "Performance Ops" },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/[0.07]">
                                                <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-foreground">
                                                    {item.icon}
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Service sections */}
            {sections.map((section, si) => (
                <section key={si} className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
                    <AnimatedSection>
                        <div className="max-w-3xl">
                            <p className="text-xs font-bold tracking-[0.08em] uppercase text-accent mb-1.5">{section.num}</p>
                            <h2 className="text-3xl md:text-4xl">{section.title}</h2>
                            <p className="mt-3 text-base md:text-lg text-muted-foreground">{section.subtitle}</p>
                        </div>
                    </AnimatedSection>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {section.cards.map((c, ci) => (
                            <AnimatedSection key={ci} delay={0.06 * ci}>
                                <Card icon={c.icon} title={c.title} description={c.desc} accent={c.accent} tagline="Built for clarity • instrumented • automation-ready" />
                            </AnimatedSection>
                        ))}
                    </div>
                </section>
            ))}

            {/* Automation */}
            <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
                <AnimatedSection>
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold tracking-[0.08em] uppercase text-accent mb-1.5">04</p>
                        <h2 className="text-3xl md:text-4xl">Automation &amp; Integrations</h2>
                        <p className="mt-3 text-base md:text-lg text-muted-foreground">End-to-end automation that runs without you.</p>
                    </div>
                </AnimatedSection>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {automationCards.map((c, i) => (
                        <AnimatedSection key={i} delay={0.04 * i}>
                            <Card icon={c.icon} title={c.title} description={c.desc} tagline="Built for clarity • instrumented • automation-ready" />
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
                                <h3 className="text-3xl md:text-4xl">Ready for a systems upgrade?</h3>
                                <p className="mt-3 text-base text-muted-foreground">Whether it&apos;s a new mobile app, a branding refresh, or a complete marketing overhaul, we&apos;ll map the system that works for you.</p>
                            </div>
                            <div className="md:col-span-4 md:justify-self-end">
                                <Button href="/contact" size="lg">Contact Us</Button>
                            </div>
                        </div>
                    </div>
                </AnimatedSection>
            </section>
        </>
    );
}
