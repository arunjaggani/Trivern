"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function ThankYouPage() {
    return (
        <main className="mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Request received.
                </h1>

                <p className="text-lg text-muted-foreground mb-3">
                    We&apos;ll review your context and respond with a concise install plan — not a pitch deck.
                </p>

                <p className="text-sm text-muted-foreground mb-10">
                    Expect a reply within <span className="text-accent font-semibold">24 hours</span>.
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-10 text-left noise">
                    <h3 className="font-semibold mb-3">What happens next?</h3>
                    <div className="space-y-3">
                        {[
                            "We review your context and requirements.",
                            "We prepare a concise install plan tailored to your needs.",
                            "We reach out via your preferred contact method within 24 hours.",
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-muted-foreground">{step}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-semibold hover:bg-accent/15 transition-all duration-300"
                >
                    Back to home
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </main>
    );
}
