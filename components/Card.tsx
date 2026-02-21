import React from "react";

interface CardProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    tagline?: string;
    accent?: boolean;
    className?: string;
}

export default function Card({
    icon,
    title,
    description,
    tagline,
    accent = false,
    className = "",
}: CardProps) {
    return (
        <div
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-white/[0.15] noise ${className}`}
        >
            {/* Decorative blob */}
            <div aria-hidden="true" className="absolute inset-0">
                <div
                    className={`absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl ${accent ? "bg-accent/[0.18]" : "bg-white/[0.06]"
                        }`}
                />
                <div className="absolute inset-0 gridlines opacity-50" />
            </div>

            <div className="relative">
                {/* Icon */}
                {icon && (
                    <div
                        className={`grid h-12 w-12 place-items-center rounded-2xl border border-white/10 shadow-[var(--shadow-xs)] ${accent
                                ? "bg-gradient-to-b from-accent/30 to-white/5 text-accent glow-ring"
                                : "bg-gradient-to-b from-white/10 to-white/5 text-foreground"
                            }`}
                    >
                        {icon}
                    </div>
                )}

                {/* Title */}
                <div className="mt-4 text-lg font-semibold">{title}</div>

                {/* Description */}
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                </p>

                {/* Tagline divider */}
                {tagline && (
                    <>
                        <div className="mt-5 h-px w-full bg-gradient-to-r from-white/[0.12] via-white/[0.06] to-transparent" />
                        <div className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground">
                            {tagline}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
