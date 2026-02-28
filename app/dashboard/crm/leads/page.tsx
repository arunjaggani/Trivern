import prisma from "@/lib/prisma";
import Link from "next/link";
import { Phone, Mail, Building2, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
    if (score >= 80) return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-semibold border border-red-500/20">🔥 {score}</span>;
    if (score >= 60) return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold border border-yellow-500/20">🟡 {score}</span>;
    if (score >= 40) return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">🔵 {score}</span>;
    if (score >= 20) return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-500/15 text-gray-400 font-semibold border border-gray-500/20">⚪ {score}</span>;
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-700/20 text-gray-500 font-semibold">❌ {score}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        NEW: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
        CONTACTED: "bg-purple-500/15 text-purple-400 border-purple-500/20",
        BOOKED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
        CLOSED: "bg-green-500/15 text-green-400 border-green-500/20",
        LOST: "bg-red-500/15 text-red-400 border-red-500/20",
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider ${colors[status] || "bg-gray-500/15 text-gray-400"}`}>{status}</span>
    );
}

export default async function LeadsPage() {
    const clients = await prisma.client.findMany({
        orderBy: { score: "desc" },
        include: { meetings: { take: 1, orderBy: { date: "desc" } }, conversations: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Lead Intelligence</h1>
                    <p className="text-gray-400 text-sm mt-1">{clients.length} leads tracked</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {clients.map((client) => (
                    <div key={client.id} className={`bg-white/5 rounded-xl p-5 border transition-all hover:border-cyan-500/30 group ${client.escalated ? "border-amber-500/30" : "border-cyan-500/10"}`}>
                        {client.escalated && (
                            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-3">
                                <AlertTriangle size={14} /><span className="font-medium">Founder Escalation</span>
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">{client.name[0]}</div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white">{client.name}</h3>
                                    {client.company && <p className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={10} /> {client.company}</p>}
                                </div>
                            </div>
                            <ScoreBadge score={client.scoreOverride ?? client.score} />
                        </div>

                        <div className="space-y-2 text-xs text-gray-400 mb-4">
                            {client.phone && <p className="flex items-center gap-2"><Phone size={12} /> {client.phone}</p>}
                            {client.email && <p className="flex items-center gap-2"><Mail size={12} /> {client.email}</p>}
                            {client.service && <p className="flex items-center gap-2"><TrendingUp size={12} /> {client.service}</p>}
                        </div>

                        <div className="grid grid-cols-5 gap-1 mb-4">
                            {[
                                { label: "FIT", value: client.fitScore, max: 20 },
                                { label: "PAIN", value: client.painScore, max: 25 },
                                { label: "INTENT", value: client.intentScore, max: 20 },
                                { label: "AUTH", value: client.authorityScore, max: 20 },
                                { label: "ENG", value: client.engagementScore, max: 15 },
                            ].map(({ label, value, max }) => (
                                <div key={label} className="text-center">
                                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-1">
                                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
                                    </div>
                                    <p className="text-[9px] text-gray-500">{label}</p>
                                    <p className="text-[10px] text-gray-300 font-medium">{value}/{max}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-cyan-500/5">
                            <div className="flex items-center gap-2">
                                <StatusBadge status={client.status} />
                                {client.urgency && (
                                    <span className="text-[10px] text-gray-500">
                                        {client.urgency === "CRITICAL" ? "🚨" : client.urgency === "HIGH" ? "⚡" : client.urgency === "MEDIUM" ? "⏳" : "💤"} {client.urgency}
                                    </span>
                                )}
                            </div>
                            <Link href={`/dashboard/crm/leads/${client.id}`} className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                Details <ChevronRight size={10} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
