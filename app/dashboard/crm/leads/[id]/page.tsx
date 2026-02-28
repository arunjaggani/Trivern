import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, Building2, TrendingUp, AlertTriangle, Calendar, MessageSquare, Clock, Video, Edit3 } from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
    if (score >= 80) return <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 font-semibold border border-red-500/20">🔥 HOT — {score}/100</span>;
    if (score >= 60) return <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold border border-yellow-500/20">🟡 WARM — {score}/100</span>;
    if (score >= 40) return <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">🔵 LUKEWARM — {score}/100</span>;
    if (score >= 20) return <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-gray-500/15 text-gray-400 font-semibold border border-gray-500/20">⚪ COLD — {score}/100</span>;
    return <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-gray-700/20 text-gray-500 font-semibold">❌ DQ — {score}/100</span>;
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
    const client = await prisma.client.findUnique({
        where: { id: params.id },
        include: {
            meetings: { orderBy: { date: "desc" } },
            conversations: { orderBy: { lastMessageAt: "desc" }, take: 1 },
        },
    });

    if (!client) return notFound();

    const pillars = [
        { label: "Fit", value: client.fitScore, max: 20, color: "bg-cyan-500" },
        { label: "Pain Intensity", value: client.painScore, max: 25, color: "bg-red-500" },
        { label: "Intent Strength", value: client.intentScore, max: 20, color: "bg-amber-500" },
        { label: "Authority & Readiness", value: client.authorityScore, max: 20, color: "bg-purple-500" },
        { label: "Engagement", value: client.engagementScore, max: 15, color: "bg-emerald-500" },
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/crm/leads" className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-white/5">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">{client.name[0]}</div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                {client.company && <span className="flex items-center gap-1"><Building2 size={14} /> {client.company}</span>}
                                {client.industry && <span>· {client.industry}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                <ScoreBadge score={client.scoreOverride ?? client.score} />
            </div>

            {/* Escalation Banner */}
            {client.escalated && (
                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3">
                    <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-semibold text-amber-400">Founder Escalation Active</p>
                        <p className="text-xs text-amber-400/70">{client.escalationReason || "High-value lead detected"}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column — Info + Score */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 space-y-3">
                        <h2 className="text-sm font-semibold text-white mb-3">Contact Info</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {client.phone && <div className="flex items-center gap-2 text-gray-300"><Phone size={14} className="text-gray-500" />{client.phone}</div>}
                            {client.email && <div className="flex items-center gap-2 text-gray-300"><Mail size={14} className="text-gray-500" />{client.email}</div>}
                            {client.service && <div className="flex items-center gap-2 text-gray-300"><TrendingUp size={14} className="text-gray-500" />{client.service}</div>}
                            {client.source && <div className="text-gray-300"><span className="text-gray-500 text-xs">Source:</span> {client.source}</div>}
                        </div>
                        {client.context && (
                            <div className="mt-3 pt-3 border-t border-cyan-500/5">
                                <p className="text-xs text-gray-500 mb-1">Context / Requirements</p>
                                <p className="text-sm text-gray-300 leading-relaxed">{client.context}</p>
                            </div>
                        )}
                    </div>

                    {/* 5-Pillar Score Breakdown */}
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-4">Score Breakdown — 5 Pillars</h2>
                        <div className="space-y-4">
                            {pillars.map((p) => (
                                <div key={p.label}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">{p.label}</span>
                                        <span className="text-xs text-white font-semibold">{p.value}/{p.max}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${(p.value / p.max) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-cyan-500/5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Composite Score</span>
                            <span className="text-lg font-bold text-white">{client.scoreOverride ?? client.score}/100</span>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-3">Lead Metadata</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                ["Status", client.status],
                                ["Urgency", client.urgency],
                                ["Business Type", client.businessType],
                                ["Decision Role", client.decisionRole],
                                ["Pain Category", client.painCategory],
                                ["Budget Hint", client.budgetHint],
                                ["Intent", client.intent],
                            ].filter(([, v]) => v).map(([label, value]) => (
                                <div key={label as string}>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                                    <p className="text-gray-300">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    {(client.notes || client.remarks) && (
                        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3">Notes & Remarks</h2>
                            {client.notes && <p className="text-sm text-gray-300 mb-2">{client.notes}</p>}
                            {client.remarks && <p className="text-sm text-gray-400 italic">{client.remarks}</p>}
                        </div>
                    )}
                </div>

                {/* Right Column — Meetings + Conversations */}
                <div className="space-y-6">
                    {/* Meetings */}
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Calendar size={14} /> Meetings ({client.meetings.length})</h2>
                        {client.meetings.length === 0 ? (
                            <p className="text-xs text-gray-500">No meetings yet</p>
                        ) : (
                            <div className="space-y-3">
                                {client.meetings.map((m) => (
                                    <div key={m.id} className="p-3 rounded-lg bg-white/[0.03] border border-cyan-500/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs text-gray-300">{new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${m.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" : m.status === "SCHEDULED" ? "bg-cyan-500/15 text-cyan-400" : "bg-gray-500/15 text-gray-400"}`}>{m.status}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500"><Clock size={10} className="inline mr-1" />{new Date(m.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {m.duration}min</p>
                                        {m.meetLink && <a href={m.meetLink} target="_blank" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 mt-1"><Video size={10} /> Meet link</a>}
                                        {m.remarks && <p className="text-[10px] text-gray-500 mt-2 italic">{m.remarks}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Last Conversation */}
                    {client.conversations.length > 0 && (
                        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessageSquare size={14} /> Last Conversation</h2>
                            {(() => {
                                const conv = client.conversations[0];
                                const msgs = JSON.parse(conv.messages as string);
                                const last3 = msgs.slice(-3);
                                return (
                                    <div className="space-y-2">
                                        {last3.map((msg: any, i: number) => (
                                            <div key={i} className={`text-xs px-3 py-2 rounded-lg ${msg.role === "agent" ? "bg-white/[0.05] text-gray-300" : "bg-cyan-500/10 text-cyan-100"}`}>
                                                <span className="text-[10px] text-gray-500 font-medium">{msg.role === "agent" ? "Zara (AI)" : client.name}:</span>
                                                <p className="mt-0.5">{msg.content.substring(0, 120)}{msg.content.length > 120 ? "..." : ""}</p>
                                            </div>
                                        ))}
                                        <Link href={`/dashboard/crm/conversations/${conv.id}`} className="block text-[10px] text-cyan-400 hover:underline text-center mt-2">View full conversation →</Link>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-white mb-3">Timeline</h2>
                        <div className="space-y-2 text-xs text-gray-400">
                            <p>Created: {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                            <p>Last updated: {new Date(client.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
