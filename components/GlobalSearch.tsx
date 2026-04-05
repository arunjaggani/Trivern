"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search, X, Users, Calendar, MessageSquare,
    FileText, UserCog, Loader2, ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchResult {
    id: string;
    type: "lead" | "meeting" | "conversation" | "blog" | "team";
    title: string;
    subtitle: string;
    badge: string;
    score?: number;
    href: string;
}

interface SearchResults {
    leads: SearchResult[];
    meetings: SearchResult[];
    conversations: SearchResult[];
    blog: SearchResult[];
    team: SearchResult[];
}

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
    lead:         { icon: Users,         color: "text-cyan-400",   bg: "bg-cyan-500/10"   },
    meeting:      { icon: Calendar,      color: "text-emerald-400", bg: "bg-emerald-500/10" },
    conversation: { icon: MessageSquare, color: "text-blue-400",   bg: "bg-blue-500/10"   },
    blog:         { icon: FileText,      color: "text-purple-400", bg: "bg-purple-500/10" },
    team:         { icon: UserCog,       color: "text-orange-400", bg: "bg-orange-500/10" },
};

const SECTION_LABELS: Record<string, string> = {
    leads: "Leads",
    meetings: "Meetings",
    conversations: "Conversations",
    blog: "Blog Posts",
    team: "Team Members",
};

const SCORE_COLOR = (s: number) => {
    if (s >= 80) return "text-red-400";
    if (s >= 60) return "text-yellow-400";
    return "text-gray-500";
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function GlobalSearch() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Flatten results for keyboard nav
    const flatResults: SearchResult[] = results
        ? Object.values(results).flat()
        : [];

    // Fetch with debounce
    const fetchResults = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results);
            setActiveIndex(-1);
        } catch {
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchResults(query), 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, fetchResults]);

    // Keyboard shortcut: Ctrl+K / Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
            if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Auto-focus when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        };
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    // Keyboard nav inside results
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!flatResults.length) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, flatResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            navigate(flatResults[activeIndex].href);
        }
    };

    const navigate = (href: string) => {
        router.push(href);
        setOpen(false);
        setQuery("");
        setResults(null);
    };

    const hasResults = results && Object.values(results).some(arr => arr.length > 0);
    const showEmpty = query.length >= 2 && !loading && !hasResults;

    return (
        <>
            {/* ── Trigger Button (visible in topbar) ─── */}
            <button
                id="global-search-trigger"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-sm transition-all duration-200 group"
                style={{
                    background: "hsl(var(--dash-card))",
                    border: "1px solid var(--dash-border)",
                    color: "hsl(var(--dash-text-muted))",
                    minWidth: 200,
                }}
                title="Search (Ctrl+K)"
            >
                <Search size={14} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="flex-1 text-left text-[13px]">Search anything…</span>
                <kbd
                    className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: "var(--dash-border)", color: "hsl(var(--dash-text-muted))" }}
                >
                    Ctrl K
                </kbd>
            </button>

            {/* ── Overlay + Panel ────────────────────── */}
            {open && (
                <div className="fixed inset-0 z-[999] flex items-start justify-center pt-20 px-4"
                    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
                >
                    <div
                        ref={panelRef}
                        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            background: "hsl(var(--dash-sidebar))",
                            border: "1px solid var(--dash-border)",
                        }}
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3.5"
                            style={{ borderBottom: results || loading ? "1px solid var(--dash-border)" : "none" }}
                        >
                            {loading
                                ? <Loader2 size={16} className="shrink-0 animate-spin" style={{ color: "#0D9488" }} />
                                : <Search size={16} className="shrink-0" style={{ color: "hsl(var(--dash-text-muted))" }} />
                            }
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search leads, meetings, conversations…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 text-sm bg-transparent border-none outline-none"
                                style={{ color: "hsl(var(--dash-text))" }}
                                autoComplete="off"
                            />
                            {query && (
                                <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
                                    className="shrink-0 p-0.5 rounded hover:bg-white/10 transition"
                                >
                                    <X size={14} style={{ color: "hsl(var(--dash-text-muted))" }} />
                                </button>
                            )}
                            <button onClick={() => { setOpen(false); setQuery(""); }}
                                className="shrink-0 text-[11px] px-2 py-1 rounded-lg transition hover:bg-white/10"
                                style={{ color: "hsl(var(--dash-text-muted))", border: "1px solid var(--dash-border)" }}
                            >
                                Esc
                            </button>
                        </div>

                        {/* Results */}
                        {hasResults && (
                            <div className="max-h-[60vh] overflow-y-auto py-2">
                                {Object.entries(results!).map(([section, items]) => {
                                    if (!items.length) return null;
                                    return (
                                        <div key={section}>
                                            {/* Section label */}
                                            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                                                style={{ color: "hsl(var(--dash-text-muted))" }}
                                            >
                                                {SECTION_LABELS[section]}
                                            </p>

                                            {(items as SearchResult[]).map((result) => {
                                                const cfg = TYPE_CONFIG[result.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.lead;
                                                const TypeIcon = cfg.icon;
                                                const flatIdx = flatResults.findIndex(r => r.id === result.id && r.type === result.type);
                                                const isActive = flatIdx === activeIndex;

                                                return (
                                                    <button
                                                        key={`${result.type}-${result.id}`}
                                                        onClick={() => navigate(result.href)}
                                                        onMouseEnter={() => setActiveIndex(flatIdx)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group"
                                                        style={{
                                                            background: isActive ? "rgba(13,148,136,0.08)" : "transparent",
                                                        }}
                                                    >
                                                        {/* Type icon */}
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                                            <TypeIcon size={15} className={cfg.color} />
                                                        </div>

                                                        {/* Text */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate"
                                                                style={{ color: "hsl(var(--dash-text))" }}
                                                            >
                                                                {result.title}
                                                            </p>
                                                            <p className="text-[11px] truncate"
                                                                style={{ color: "hsl(var(--dash-text-muted))" }}
                                                            >
                                                                {result.subtitle}
                                                            </p>
                                                        </div>

                                                        {/* Score for leads */}
                                                        {result.type === "lead" && result.score !== undefined && (
                                                            <span className={`text-[11px] font-bold shrink-0 ${SCORE_COLOR(result.score)}`}>
                                                                {result.score}
                                                            </span>
                                                        )}

                                                        {/* Badge */}
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                                                            style={{
                                                                background: "var(--dash-border)",
                                                                color: "hsl(var(--dash-text-muted))",
                                                            }}
                                                        >
                                                            {result.badge}
                                                        </span>

                                                        {/* Arrow */}
                                                        <ArrowRight
                                                            size={13}
                                                            className={`shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
                                                            style={{ color: "#0D9488" }}
                                                        />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty state */}
                        {showEmpty && (
                            <div className="py-10 text-center">
                                <Search size={28} className="mx-auto mb-3 opacity-20" style={{ color: "hsl(var(--dash-text))" }} />
                                <p className="text-sm" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                    No results for <span className="font-semibold">"{query}"</span>
                                </p>
                            </div>
                        )}

                        {/* Idle hint */}
                        {!query && (
                            <div className="px-4 py-4 flex flex-wrap gap-2">
                                {["Leads", "Meetings", "Conversations"].map(hint => (
                                    <button
                                        key={hint}
                                        onClick={() => { setQuery(hint.toLowerCase()); }}
                                        className="text-[11px] px-2.5 py-1 rounded-lg transition hover:bg-white/10"
                                        style={{ border: "1px solid var(--dash-border)", color: "hsl(var(--dash-text-muted))" }}
                                    >
                                        {hint}
                                    </button>
                                ))}
                                <span className="text-[11px] ml-auto self-center" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                    ↑↓ navigate · Enter to open
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
