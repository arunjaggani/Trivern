"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Phone, PhoneCall, PhoneOff, Clock, TrendingUp, Users,
    Calendar, ChevronDown, ChevronUp, RefreshCw, Mic, Activity
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface VoiceCall {
    id: string;
    callerNumber: string;
    roomName: string | null;
    language: string;
    duration: number;
    outcome: string;
    leadTemperature: string;
    summary: string | null;
    transcript: string | null;
    callType: string;
    createdAt: string;
    client: { name: string; company: string | null; phone: string; score: number } | null;
}

interface Stats {
    totalCalls: number;
    bookedCalls: number;
    hotLeads: number;
    avgDuration: number;
    conversionRate: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const OUTCOME_CONFIG: Record<string, { label: string; color: string; dot: string; icon: typeof Phone }> = {
    booked:            { label: "Booked",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", icon: Calendar },
    whatsapp_followup: { label: "WhatsApp FU", color: "text-blue-400 bg-blue-500/10 border-blue-500/20",       dot: "bg-blue-400",    icon: PhoneCall },
    completed:         { label: "Completed",  color: "text-gray-400 bg-gray-500/10 border-gray-500/20",        dot: "bg-gray-400",    icon: PhoneOff },
    no_answer:         { label: "No Answer",  color: "text-red-400 bg-red-500/10 border-red-500/20",           dot: "bg-red-400",     icon: PhoneOff },
    unknown:           { label: "In Progress", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400",  icon: Activity },
};

const TEMP_CONFIG: Record<string, { label: string; color: string }> = {
    hot:      { label: "🔥 HOT",      color: "text-red-400 bg-red-500/10 border border-red-500/20" },
    warm:     { label: "🟡 WARM",     color: "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20" },
    lukewarm: { label: "🔵 LUKEWARM", color: "text-blue-400 bg-blue-500/10 border border-blue-500/20" },
    cold:     { label: "⚪ COLD",     color: "text-gray-400 bg-gray-500/10 border border-gray-500/20" },
};

function fmtDuration(secs: number): string {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
        timeZone: "Asia/Kolkata",
    });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string | number; sub?: string;
    icon: typeof Phone; color: string;
}) {
    return (
        <div className="bg-white/5 border border-white/[0.06] rounded-xl p-5 flex items-start gap-4 hover:border-cyan-500/20 transition-all">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function CallRow({ call }: { call: VoiceCall }) {
    const [expanded, setExpanded] = useState(false);
    const outcome = OUTCOME_CONFIG[call.outcome] ?? OUTCOME_CONFIG.unknown;
    const temp = TEMP_CONFIG[call.leadTemperature] ?? TEMP_CONFIG.warm;
    const OutcomeIcon = outcome.icon;

    // Parse transcript if it's a JSON string
    let transcriptMessages: { role: string; content: string }[] = [];
    if (call.transcript) {
        try {
            transcriptMessages = JSON.parse(call.transcript);
        } catch {
            transcriptMessages = [{ role: "system", content: call.transcript }];
        }
    }

    return (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden hover:border-cyan-500/15 transition-all">
            {/* Main row */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => setExpanded(!expanded)}
            >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <span className="text-cyan-400 text-xs font-bold">
                        {(call.client?.name || call.callerNumber)[0].toUpperCase()}
                    </span>
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                        {call.client?.name || call.callerNumber}
                    </p>
                    <p className="text-[11px] text-gray-500">
                        {call.client?.company ? `${call.client.company} · ` : ""}{call.callerNumber}
                    </p>
                </div>

                {/* Outcome badge */}
                <span className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${outcome.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${outcome.dot}`} />
                    {outcome.label}
                </span>

                {/* Lead temp */}
                <span className={`hidden md:inline text-[11px] font-medium px-2 py-0.5 rounded-full ${temp.color}`}>
                    {temp.label}
                </span>

                {/* Duration */}
                <span className="flex items-center gap-1 text-xs text-gray-400 w-16 justify-end shrink-0">
                    <Clock size={11} className="text-gray-600" />
                    {fmtDuration(call.duration)}
                </span>

                {/* Time */}
                <span className="text-[11px] text-gray-500 hidden lg:block w-28 text-right shrink-0">
                    {fmtTime(call.createdAt)}
                </span>

                {/* Expand */}
                <div className="text-gray-600 shrink-0">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {/* Expanded transcript */}
            {expanded && (
                <div className="border-t border-white/[0.06] bg-black/20 p-4 space-y-3">
                    {/* Summary */}
                    {call.summary && (
                        <div className="px-3 py-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-gray-300">
                            <span className="text-cyan-400 font-semibold">Summary: </span>
                            {call.summary}
                        </div>
                    )}

                    {/* Language & room */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            🌐 {call.language}
                        </span>
                        {call.roomName && (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                                Room: {call.roomName}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 capitalize">
                            📞 {call.callType}
                        </span>
                    </div>

                    {/* Transcript */}
                    {transcriptMessages.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Transcript</p>
                            {transcriptMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex gap-2 ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Mic size={9} className="text-cyan-400" />
                                        </div>
                                    )}
                                    <div
                                        className={`text-xs px-3 py-2 rounded-xl max-w-[85%] ${
                                            msg.role === "assistant"
                                                ? "bg-cyan-500/10 text-gray-200 rounded-tl-none"
                                                : "bg-white/10 text-gray-300 rounded-tr-none"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 italic">No transcript available for this call.</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ZaraVoiceDashboard() {
    const [calls, setCalls] = useState<VoiceCall[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<string>("all");
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await fetch("/api/voice/log");
            if (res.ok) {
                const data = await res.json();
                setCalls(data.calls || []);
                setStats(data.stats || null);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error("Failed to fetch voice calls:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Real-time polling every 30 seconds
        const interval = setInterval(() => fetchData(true), 30_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const filtered = filter === "all"
        ? calls
        : calls.filter(c => c.outcome === filter);

    const FILTERS = [
        { key: "all",            label: "All Calls" },
        { key: "booked",         label: "Booked" },
        { key: "whatsapp_followup", label: "WhatsApp FU" },
        { key: "completed",      label: "Completed" },
        { key: "unknown",        label: "In Progress" },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                <p className="text-sm text-gray-500">Loading call data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🎙️</span> Zara Voice Monitor
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Live call intelligence · Updated {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-300 border border-white/10 hover:border-cyan-500/30 hover:text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Total Calls"      value={stats.totalCalls}      icon={Phone}      color="bg-cyan-500/10 text-cyan-400" />
                    <StatCard label="Meetings Booked"  value={stats.bookedCalls}     icon={Calendar}   color="bg-emerald-500/10 text-emerald-400" />
                    <StatCard label="Conversion Rate"  value={`${stats.conversionRate}%`} icon={TrendingUp} color="bg-purple-500/10 text-purple-400" />
                    <StatCard label="Hot Leads"        value={stats.hotLeads}        icon={Users}      color="bg-red-500/10 text-red-400" />
                    <StatCard label="Avg Duration"     value={fmtDuration(stats.avgDuration)} icon={Clock} color="bg-yellow-500/10 text-yellow-400" />
                </div>
            )}

            {/* Filters + Call Log */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 px-4 py-3 border-b border-white/[0.06] overflow-x-auto">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                                filter === f.key
                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                        >
                            {f.label}
                            {f.key === "all" && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 text-[10px]">
                                    {calls.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Call list */}
                <div className="p-4 space-y-3">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 space-y-2">
                            <PhoneOff size={32} className="text-gray-700 mx-auto" />
                            <p className="text-gray-500 text-sm">No calls recorded yet</p>
                            <p className="text-gray-600 text-xs">
                                Zara will log every outbound call here automatically.
                            </p>
                        </div>
                    ) : (
                        filtered.map(call => <CallRow key={call.id} call={call} />)
                    )}
                </div>
            </div>
        </div>
    );
}
