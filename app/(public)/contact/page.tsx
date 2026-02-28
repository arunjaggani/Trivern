"use client";

import { useState, useRef } from "react";
import { Send, Calendar, MessageCircle, Loader2 } from "lucide-react";

// ⚠️ Replace with your WhatsApp number (country code + number, no + or spaces)
const WHATSAPP_NUMBER = "917794905052";

export default function ContactPage() {
    const [selectedOption, setSelectedOption] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "+91 ",
        website: "",
        context: "",
    });

    const submittedRef = useRef(false);

    // Map option values to human-readable labels for the WhatsApp message
    const optionLabels: Record<string, string> = {
        "build-website": "Build a professional website",
        "get-leads": "Get more leads consistently",
        "automate-followups": "Automate follow-ups & WhatsApp replies",
        "improve-branding": "Improve branding & positioning",
        "full-growth": "Set up full growth system (end-to-end)",
        "audit-setup": "Audit my current setup",
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Prevent double submit
        if (submittedRef.current) return;

        // --- Client-side validation ---
        const name = formData.name.trim();
        const phone = formData.phone.replace(/[\s\-\(\)]/g, "");

        if (!name) {
            setError("Name is required.");
            return;
        }
        if (!phone || phone === "+91" || phone.length < 10) {
            setError("A valid WhatsApp number is required.");
            return;
        }

        // Lock submissions
        submittedRef.current = true;
        setIsSubmitting(true);

        // --- Fire-and-forget: send data to backend ---
        const serviceName = optionLabels[selectedOption] || selectedOption || "";
        fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                company: formData.company,
                email: formData.email,
                phone,
                website: formData.website,
                service: serviceName,
                context: formData.context,
            }),
        }).catch((err) => console.error("Lead API error (non-blocking):", err));

        // --- Build WhatsApp message & redirect ---
        const message = [
            `Hi, this is ${name} from ${formData.company || "my company"}.`,
            `I'm interested in ${serviceName || "your services"}.`,
            `Phone: ${phone}`,
            `Looking forward to discussing further.`,
        ].join("\n");

        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

        // Small delay so the user sees the "Redirecting…" state
        setTimeout(() => {
            window.open(waUrl, "_blank", "noopener,noreferrer");
        }, 400);
    };

    const options = [
        {
            value: "build-website",
            title: "Build a professional website",
            desc: "Clear, modern website that brings clients.",
        },
        {
            value: "get-leads",
            title: "Get more leads consistently",
            desc: "Fix conversion gaps and improve inquiries.",
        },
        {
            value: "automate-followups",
            title: "Automate follow-ups & WhatsApp replies",
            desc: "So no lead is missed.",
        },
        {
            value: "improve-branding",
            title: "Improve branding & positioning",
            desc: "Look more premium and trustworthy.",
        },
        {
            value: "full-growth",
            title: "Set up full growth system (end-to-end)",
            desc: "Website + automation + tracking.",
        },
        {
            value: "audit-setup",
            title: "Audit my current setup",
            desc: "Find leaks and improve performance.",
        },
    ];

    const principles = [
        {
            icon: Calendar,
            title: "Short reply",
            desc: "A concise plan — not a pitch deck.",
        },
        {
            icon: MessageCircle,
            title: "Clean system",
            desc: "Intent → context → contact → follow-up.",
        },
        {
            icon: Send,
            title: "Operable",
            desc: "Handoff that your team can run.",
        },
    ];

    const inputClass = "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:bg-white/[0.07] focus:border-accent/40 outline-none transition-all duration-200";

    return (
        <main className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Left: Info */}
                <div>
                    <div className="inline-block px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6">
                        Contact
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Get an install plan.</h1>
                    <p className="text-lg text-muted-foreground mb-12">
                        Tell us what you sell and what &quot;success&quot; looks like. We&apos;ll recommend the smallest system that produces qualified pipeline.
                    </p>

                    <div className="space-y-6">
                        {principles.map((principle) => (
                            <div key={principle.title} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                                    <principle.icon className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">{principle.title}</h3>
                                    <p className="text-sm text-muted-foreground">{principle.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Form */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.03] p-6 sm:p-8 shadow-[var(--shadow-md)] noise relative overflow-hidden">
                    <div aria-hidden="true" className="absolute inset-0">
                        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.08] blur-3xl" />
                        <div className="absolute inset-0 gridlines opacity-70" />
                    </div>

                    <div className="relative">
                        <div className="mb-6">
                            <div className="inline-block px-2 py-1 rounded bg-accent/10 text-accent text-xs font-semibold mb-4">
                                Request
                            </div>
                            <h2 className="text-2xl font-semibold">A few quick details</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Options */}
                            <div>
                                <label className="text-sm font-medium block mb-3">🔥 How can we help you?</label>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {options.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSelectedOption(option.value)}
                                            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${selectedOption === option.value
                                                ? "border-accent/40 bg-accent/[0.06] shadow-[0_0_0_1px_hsl(var(--accent)/0.15)]"
                                                : "border-white/10 bg-white/5 hover:border-white/[0.15] hover:bg-white/[0.07]"
                                                }`}
                                        >
                                            <p className="text-sm font-semibold mb-1">{option.title}</p>
                                            <p className="text-xs text-muted-foreground">{option.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Your Name */}
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={inputClass}
                                    placeholder="Your full name"
                                />
                            </div>

                            {/* Business Name & WhatsApp Number */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-2">Business Name (optional)</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className={inputClass}
                                        placeholder="Your business name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-2">� WhatsApp Number <span className="text-accent">*</span></label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className={inputClass}
                                        placeholder="+91 98765 43210"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1.5">We&apos;ll message you only regarding your request.</p>
                                </div>
                            </div>

                            {/* Website */}
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Website (optional)</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className={inputClass}
                                    placeholder="https://yoursite.com"
                                />
                            </div>

                            {/* Situation */}
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Tell us briefly about your situation</label>
                                <textarea
                                    value={formData.context}
                                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    placeholder="What do you sell? Who do you serve? What feels stuck right now?"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground border border-primary-border shadow-accent/[0.18] hover:shadow-accent/[0.22] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Redirecting to WhatsApp…
                                    </>
                                ) : (
                                    <>
                                        💬 Continue on WhatsApp
                                        <MessageCircle className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-muted-foreground mt-6">
                            <strong className="text-foreground">Tip:</strong> You can also use the Install Agent button (bottom-right) for a text-first conversation before contact.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
