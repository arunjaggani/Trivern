"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, Loader2, TrendingUp, Target, ShieldAlert, Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type ClientLead = {
    id: string;
    name: string;
    company: string | null;
    score: number;
    fitScore: number;
    painScore: number;
    intentScore: number;
    authorityScore: number;
    engagementScore: number;
    phone: string;
    status: string;
    createdAt: string;
};

export default function LeadIntelligencePage() {
    const [leads, setLeads] = useState<ClientLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const res = await fetch("/api/crm?sort=score");
                if (res.ok) setLeads(await res.json());
            } catch (error) {
                console.error("Failed to fetch lead intelligence");
            } finally {
                setLoading(false);
            }
        };
        fetchScores();
    }, []);

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    const topLeads = leads.filter(l => l.score >= 50);

    const getScoreColor = (score: number, max: number) => {
        const pct = score / max;
        if (pct >= 0.8) return "bg-emerald-500";
        if (pct >= 0.5) return "bg-amber-500";
        return "bg-slate-700";
    };

    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BrainCircuit className="text-yellow-400" /> AI Lead Intelligence
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Real-time 5-pillar composite scoring algorithms by Trivern OS.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-yellow-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Assessed Leads</p>
                        <TrendingUp size={16} className="text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{leads.length}</p>
                </div>
                <div className="bg-white/5 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">High Intent (80+ PTS)</p>
                        <Target size={16} className="text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{leads.filter(l => l.score >= 80).length}</p>
                </div>
                <div className="bg-white/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Cold Leads (Under 30 PTS)</p>
                        <ShieldAlert size={16} className="text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{leads.filter(l => l.score < 30).length}</p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Award size={18} className="text-cyan-400" /> High-Value Opportunities
                    </h3>
                </div>
                
                {topLeads.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">No high-scoring leads found. AI needs more conversation data.</div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {topLeads.map((lead) => (
                            <div key={lead.id} className="p-5 flex flex-col lg:flex-row gap-6 hover:bg-slate-800/50 transition-colors">
                                {/* Lead Meta */}
                                <div className="lg:w-1/4">
                                    <h4 className="text-lg font-bold text-white">{lead.name || 'Anonymous User'}</h4>
                                    <p className="text-sm text-cyan-400 font-mono mb-2">{lead.phone}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-black rounded-lg border border-slate-800 flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">Score</span>
                                            <span className={`text-xl font-bold ${lead.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{lead.score}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5-Pillar Breakdown */}
                                <div className="lg:w-3/4 grid grid-cols-2 sm:grid-cols-5 gap-4 bg-black/20 p-4 rounded-xl border border-slate-800/50 relative">
                                    {[
                                        { label: "Fit", score: lead.fitScore, max: 20 },
                                        { label: "Pain", score: lead.painScore, max: 25 },
                                        { label: "Intent", score: lead.intentScore, max: 20 },
                                        { label: "Auth", score: lead.authorityScore, max: 20 },
                                        { label: "Eng", score: lead.engagementScore, max: 15 }
                                    ].map((pillar) => (
                                        <div key={pillar.label} className="flex flex-col gap-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-400 font-semibold">{pillar.label}</span>
                                                <span className="text-gray-300 font-mono">{pillar.score}/{pillar.max}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all ${getScoreColor(pillar.score, pillar.max)}`}
                                                    style={{ width: `${(pillar.score / pillar.max) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="absolute -bottom-3 right-4">
                                        <div className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                            Stage: {lead.status}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
