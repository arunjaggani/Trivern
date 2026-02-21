import React from "react";
import { Sparkles } from "lucide-react";

/* Simple badge pill used by all sections */
interface SectionBadgeProps {
    label: string;
    icon?: boolean;
    className?: string;
}

export function SectionBadge({
    label,
    icon = false,
    className = "",
}: SectionBadgeProps) {
    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground ${className}`}
        >
            {icon && <Sparkles className="h-3.5 w-3.5 text-accent" />}
            {label}
        </div>
    );
}
