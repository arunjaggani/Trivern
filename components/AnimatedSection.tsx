"use client";

import React, { useRef, useEffect, useState } from "react";

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    fade?: boolean;
}

export default function AnimatedSection({
    children,
    className = "",
    delay = 0,
    fade = false,
}: AnimatedSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`${fade ? "animate-in-fade" : "animate-in-up"} ${className}`}
            style={{
                animationDelay: `${delay}s`,
                animationPlayState: visible ? "running" : "paused",
                opacity: visible ? undefined : 0,
            }}
        >
            {children}
        </div>
    );
}
