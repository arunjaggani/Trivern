"use client";

import { useState, useEffect } from "react";
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    Clock,
    TrendingUp,
    Flame,
    Calendar,
    ChevronDown,
    ChevronUp,
    Search,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────

interface VoiceCall {
    id: string;
    callerNumber: string;
    roomName: string | null;
    language: string;
    duration: number;
    outcome: string;
    leadTemperature: string;
    transcript: string | null;
    summary: string | null;
    recordingUrl: string | null;
    callType: string;
    createdAt: string;
    client?: { name: string; company: string | null; phone: string } | null;
}

interface Stats {
    totalCalls: number;
    bookedCalls: number;
    conversionRate: number;
    avgDuration: number;
    hotLeads: number;
}

// ─── Helpers ────────────────────────────────────────

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

function OutcomeBadge({ outcome }: { outcome: string }) {
    const colors: Record<string, string> = {
        booked: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        whatsapp_followup: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        callback: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        no_answer: "bg-red-500/20 text-red-400 border-red-500/30",
        unknown: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    };
    const labels: Record<string, string> = {
        booked: "Booked",
        whatsapp_followup: "WhatsApp",
        callback: "Callback",
        no_answer: "No Answer",
        unknown: "Unknown",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs border ${colors[outcome] || colors.unknown}`}>
            {labels[outcome] || outcome}
        </span>
    );
}

function TempBadge({ temp }: { temp: string }) {
    const colors: Record<string, string> = {
        hot: "text-red-400",
        warm: "text-amber-400",
        lukewarm: "text-yellow-300",
        cold: "text-blue-400",
    };
    return (
        <span className={`font-medium text-xs uppercase ${colors[temp] || "text-zinc-400"}`}>
            {temp === "hot" && "🔥 "}{temp}
        </span>
    );
}

function LangBadge({ lang }: { lang: string }) {
    const labels: Record<string, string> = {
        "en-IN": "English",
        "hi-IN": "Hindi",
        "te-IN": "Telugu",
        "ta-IN": "Tamil",
        "kn-IN": "Kannada",
    };
    return (
        <span className="text-xs text-zinc-400">
            {labels[lang] || lang}
        </span>
    );
}

// ─── Stat Card ──────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

// ─── Transcript Viewer ──────────────────────────────

function TranscriptViewer({ transcript }: { transcript: string | null }) {
    if (!transcript) return <p className="text-zinc-500 text-sm italic">No transcript available</p>;

    let messages: any[] = [];
    try {
        messages = JSON.parse(transcript);
    } catch {
        return <p className="text-zinc-500 text-sm italic">Transcript format error</p>;
    }

    return (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}>
                    <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "agent"
                                ? "bg-zinc-800 text-zinc-200"
                                : "bg-blue-900/40 text-blue-200"
                            }`}
                    >
                        <span className="text-[10px] uppercase font-bold opacity-50 block mb-1">
                            {msg.role === "agent" ? "Zara" : "Caller"}
                        </span>
                        {msg.content}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────

export default function VoiceAgentPage() {
    const [calls, setCalls] = useState<VoiceCall[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchCalls();
    }, []);

    async function fetchCalls() {
        try {
            const res = await fetch("/api/voice/calls");
            const data = await res.json();
            if (data.success) {
                setCalls(data.calls);
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch voice calls:", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredCalls = calls.filter((call) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            call.callerNumber.includes(q) ||
            (call.client?.name || "").toLowerCase().includes(q) ||
            call.outcome.includes(q) ||
            call.language.includes(q)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* ─── Header ─────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Phone className="w-6 h-6 text-blue-400" />
                        Voice Agent
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        All voice call activity — transcripts, outcomes, and analytics
                    </p>
                </div>
                <button
                    onClick={fetchCalls}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition"
                >
                    Refresh
                </button>
            </div>

            {/* ─── Stats ──────────────────────── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard icon={Phone} label="Total Calls" value={stats.totalCalls} color="bg-blue-500/20 text-blue-400" />
                    <StatCard icon={Calendar} label="Meetings Booked" value={stats.bookedCalls} color="bg-emerald-500/20 text-emerald-400" />
                    <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats.conversionRate}%`} color="bg-purple-500/20 text-purple-400" />
                    <StatCard icon={Clock} label="Avg Duration" value={formatDuration(stats.avgDuration)} color="bg-amber-500/20 text-amber-400" />
                    <StatCard icon={Flame} label="Hot Leads" value={stats.hotLeads} color="bg-red-500/20 text-red-400" />
                </div>
            )}

            {/* ─── Search ─────────────────────── */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search by phone, name, outcome, or language..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                />
            </div>

            {/* ─── Call Logs Table ─────────────── */}
            {filteredCalls.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                    <Phone className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400">No voice calls yet</p>
                    <p className="text-zinc-600 text-sm mt-1">
                        Calls will appear here once the voice agent starts handling calls.
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800">
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Type</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Caller</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Language</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Duration</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Lead</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Outcome</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Date</th>
                                <th className="text-left px-4 py-3 text-zinc-500 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCalls.map((call) => (
                                <>
                                    <tr
                                        key={call.id}
                                        className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition"
                                        onClick={() => setExpandedRow(expandedRow === call.id ? null : call.id)}
                                    >
                                        <td className="px-4 py-3">
                                            {call.callType === "inbound" ? (
                                                <PhoneIncoming className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <PhoneOutgoing className="w-4 h-4 text-blue-400" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <span className="text-white">
                                                    {call.client?.name || call.callerNumber}
                                                </span>
                                                {call.client?.company && (
                                                    <span className="text-zinc-500 text-xs ml-2">
                                                        {call.client.company}
                                                    </span>
                                                )}
                                            </div>
                                            {call.client?.name && (
                                                <span className="text-zinc-500 text-xs">{call.callerNumber}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3"><LangBadge lang={call.language} /></td>
                                        <td className="px-4 py-3 text-zinc-300">{formatDuration(call.duration)}</td>
                                        <td className="px-4 py-3"><TempBadge temp={call.leadTemperature} /></td>
                                        <td className="px-4 py-3"><OutcomeBadge outcome={call.outcome} /></td>
                                        <td className="px-4 py-3 text-zinc-400">{formatDate(call.createdAt)}</td>
                                        <td className="px-4 py-3">
                                            {expandedRow === call.id ? (
                                                <ChevronUp className="w-4 h-4 text-zinc-500" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRow === call.id && (
                                        <tr key={`${call.id}-detail`}>
                                            <td colSpan={8} className="px-4 py-4 bg-zinc-950/50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Summary */}
                                                    <div>
                                                        <h4 className="text-xs uppercase text-zinc-500 font-bold mb-2">
                                                            Call Summary
                                                        </h4>
                                                        <p className="text-zinc-300 text-sm">
                                                            {call.summary || "No summary available"}
                                                        </p>
                                                        {call.recordingUrl && (
                                                            <div className="mt-3">
                                                                <h4 className="text-xs uppercase text-zinc-500 font-bold mb-2">
                                                                    Recording
                                                                </h4>
                                                                <audio controls className="w-full">
                                                                    <source src={call.recordingUrl} />
                                                                </audio>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Transcript */}
                                                    <div>
                                                        <h4 className="text-xs uppercase text-zinc-500 font-bold mb-2">
                                                            Transcript
                                                        </h4>
                                                        <TranscriptViewer transcript={call.transcript} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
