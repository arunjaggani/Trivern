import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ButtonProps {
    href?: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
    onClick?: () => void;
}

export default function Button({
    href,
    children,
    variant = "primary",
    size = "md",
    className = "",
    onClick,
}: ButtonProps) {
    const baseClasses =
        "inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover-elevate active-elevate-2 font-semibold transition-all duration-300";

    const variantClasses = {
        primary:
            "bg-gradient-to-b from-accent/95 to-accent/80 text-primary-foreground border border-primary-border shadow-accent/[0.18] hover:shadow-accent/[0.22] hover:-translate-y-0.5 active:translate-y-0",
        secondary:
            "text-muted-foreground hover:text-foreground border border-transparent",
        ghost:
            "rounded-xl bg-white/10 hover:bg-white/[0.14] border border-white/10 text-foreground",
    };

    const sizeClasses = {
        sm: "min-h-9 px-4 py-2 text-sm rounded-xl",
        md: "min-h-9 px-5 py-2.5 text-sm rounded-xl",
        lg: "group w-full sm:w-auto rounded-2xl px-6 py-6 h-auto text-base",
    };

    const cls = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    const inner = (
        <>
            {children}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </>
    );

    if (href) {
        return (
            <Link href={href} className="inline-flex">
                <button className={cls}>{inner}</button>
            </Link>
        );
    }

    return (
        <button className={cls} onClick={onClick}>
            {inner}
        </button>
    );
}
