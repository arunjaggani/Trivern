"use client";

import React from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { SectionBadge } from "@/components/SectionWrapper";
import AnimatedSection from "@/components/AnimatedSection";
import {
  Globe,
  Bot,
  Workflow,
  Radar,
  Database,
  Sparkles,
  BadgeCheck,
  Shield,
  MessageSquareText,
  Gauge,
  Fingerprint,
  Smartphone,
  Search,
  Paintbrush,
  ArrowRight,
} from "lucide-react";

const flowSteps = [
  { icon: <Globe className="h-5 w-5" />, label: "Visitor", desc: "Arrives with a goal — not a form." },
  { icon: <Bot className="h-5 w-5" />, label: "AI agent", desc: "Asks only what's needed to qualify." },
  { icon: <Workflow className="h-5 w-5" />, label: "Automation", desc: "Routes, tags, follows up — instantly." },
  { icon: <Radar className="h-5 w-5" />, label: "Lead", desc: "Structured + enriched, not messy notes." },
  { icon: <Database className="h-5 w-5" />, label: "CRM", desc: "Clean handoff to your team's system." },
];

function SystemDiagram() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 shadow-[var(--shadow-md)] noise">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.12] blur-3xl" />
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-[hsl(265_85%_65%/0.12)] blur-3xl" />
        <div className="absolute inset-0 gridlines opacity-70" />
      </div>
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            The install
          </div>
          <h3 className="mt-3 text-2xl md:text-3xl">A simple system that compounds</h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every step is designed to reduce friction, increase signal, and hand your team clean context — automatically.
          </p>
        </div>
      </div>
      <div className="relative mt-6 grid gap-3">
        {flowSteps.map((step, i) => (
          <div
            key={i}
            className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.15]"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[var(--shadow-xs)] text-foreground">
              {step.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{step.label}</div>
              <div className="mt-0.5 text-sm text-muted-foreground">{step.desc}</div>
            </div>
            {i < flowSteps.length - 1 && (
              <div aria-hidden="true" className="absolute -bottom-2 left-9 h-4 w-px bg-gradient-to-b from-white/20 to-transparent" />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ boxShadow: "0 0 0 1px hsl(var(--accent) / 0.10) inset" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <AnimatedSection>
              <SectionBadge label="Systems-first web + AI installs" />
              <h1 className="mt-5 text-4xl leading-[1.02] md:text-6xl tracking-tight">
                We install growth-ready websites with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[hsl(160_84%_45%)]">
                  built-in AI &amp; automation
                </span>
                .
              </h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground">
                Capture intent, qualify context, and follow up automatically — without adding noise to your brand.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/contact" size="lg">Get an install plan</Button>
                <div className="text-sm text-muted-foreground">
                  1 CTA, no pressure. We&apos;ll map what to install.
                </div>
              </div>
              <div className="mt-9 flex flex-wrap gap-2">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <BadgeCheck className="mr-2 h-3.5 w-3.5 text-accent" />
                  Conversion instrumentation
                </div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Shield className="mr-2 h-3.5 w-3.5 text-accent" />
                  High-contrast, accessible UI
                </div>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  <Workflow className="mr-2 h-3.5 w-3.5 text-accent" />
                  Follow-up automation
                </div>
              </div>
            </AnimatedSection>
          </div>
          <div className="lg:col-span-5">
            <AnimatedSection fade delay={0.3}>
              <SystemDiagram />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-3xl">
            <SectionBadge label="The problem" />
            <h2 className="mt-3 text-3xl md:text-4xl">
              Most websites collect attention — not decision-ready context.
            </h2>
            <p className="mt-3 text-base md:text-lg text-muted-foreground">
              Traffic isn&apos;t the bottleneck. Signal is. When a visitor is ready, forms feel like a tax. The result: low conversion, low clarity, slow follow-up.
            </p>
          </div>
        </AnimatedSection>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <MessageSquareText className="h-5 w-5" />, title: "Forms don't qualify", desc: "They collect contact details without knowing what the visitor actually needs." },
            { icon: <Gauge className="h-5 w-5" />, title: "Follow-up is late", desc: "Minutes become hours. Momentum decays. The best leads go cold first." },
            { icon: <Fingerprint className="h-5 w-5" />, title: "No instrumentation", desc: "You can't improve what you can't measure. Most sites ship without a feedback loop." },
          ].map((c, i) => (
            <AnimatedSection key={i} delay={0.06 * i}>
              <Card icon={c.icon} title={c.title} description={c.desc} tagline="Built for clarity • instrumented • automation-ready" />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== THE SYSTEM ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <AnimatedSection>
              <div className="max-w-3xl">
                <SectionBadge label="The system" />
                <h2 className="mt-3 text-3xl md:text-4xl">
                  Visitor → AI Agent → Automation → Lead → CRM
                </h2>
                <p className="mt-3 text-base md:text-lg text-muted-foreground">
                  A calm flow that reduces friction and increases signal. Designed to qualify before it asks.
                </p>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[var(--shadow-sm)] noise">
                <div className="text-sm font-semibold">What changes after the install</div>
                <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
                  {[
                    "Your site asks 1–2 context questions before contact — respectful and effective.",
                    "Leads arrive structured: intent, context, source, and status.",
                    "Follow-up triggers immediately with the right message and route.",
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent/90 shadow-[0_0_0_6px_hsl(var(--accent)/0.08)]" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
          <div className="lg:col-span-7">
            <AnimatedSection fade delay={0.15}>
              <SystemDiagram />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== CAPABILITIES ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-3xl">
            <SectionBadge label="Capabilities" />
            <h2 className="mt-3 text-3xl md:text-4xl">Web, Mobile, SEO &amp; Marketing.</h2>
            <p className="mt-3 text-base md:text-lg text-muted-foreground">
              We provide a variety of high-performance services to build and scale your growth engine.
            </p>
          </div>
        </AnimatedSection>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[
            { icon: <Globe className="h-5 w-5" />, title: "Web Design & Development", desc: "Premium, high-contrast web experiences optimized for conversion and performance.", accent: true },
            { icon: <Smartphone className="h-5 w-5" />, title: "Mobile App Development", desc: "Native and cross-platform mobile solutions that feel fast and intuitive." },
            { icon: <Search className="h-5 w-5" />, title: "SEO & Marketing", desc: "Systematic SEO and performance marketing that captures high-intent traffic." },
            { icon: <Paintbrush className="h-5 w-5" />, title: "Branding for Startups", desc: "Complete visual identity systems for early-stage teams ready to launch confidently." },
          ].map((c, i) => (
            <AnimatedSection key={i} delay={0.06 * i}>
              <Card icon={c.icon} title={c.title} description={c.desc} accent={c.accent} tagline="Built for clarity • instrumented • automation-ready" />
            </AnimatedSection>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button href="/services" variant="secondary" size="sm">View all services</Button>
        </div>
      </section>

      {/* ===== OUTCOMES ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="max-w-3xl">
            <SectionBadge label="Why it works" />
            <h2 className="mt-3 text-3xl md:text-4xl">Outcomes that feel inevitable.</h2>
            <p className="mt-3 text-base md:text-lg text-muted-foreground">
              The goal isn&apos;t more complexity — it&apos;s fewer manual steps between interest and action.
            </p>
          </div>
        </AnimatedSection>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <BadgeCheck className="h-5 w-5" />, title: "Higher conversion", desc: "Less friction, more relevance. Visitors feel understood quickly." },
            { icon: <Gauge className="h-5 w-5" />, title: "Faster response", desc: "Automation starts immediately — when intent is highest." },
            { icon: <Shield className="h-5 w-5" />, title: "Cleaner pipeline", desc: "Qualified context reduces back-and-forth and improves close rates." },
          ].map((c, i) => (
            <AnimatedSection key={i} delay={0.06 * i}>
              <Card icon={c.icon} title={c.title} description={c.desc} tagline="Built for clarity • instrumented • automation-ready" />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
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
                <h3 className="text-3xl md:text-4xl">
                  Want the system installed on your site?
                </h3>
                <p className="mt-3 text-base text-muted-foreground">
                  We&apos;ll map a clean flow: what to ask, what to automate, and how to hand off to your CRM.
                </p>
              </div>
              <div className="md:col-span-4 md:justify-self-end">
                <Button href="/contact" size="lg">Get an install plan</Button>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
