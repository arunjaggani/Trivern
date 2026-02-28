import prisma from "@/lib/prisma";
import { BarChart3, TrendingUp, Users, Calendar, MessageSquare, Target } from "lucide-react";

export default async function AnalyticsPage() {
    const [totalLeads, hotLeads, warmLeads, coldLeads, totalMeetings, noShows, totalConversations, bookedClients] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { score: { gte: 80 } } }),
        prisma.client.count({ where: { score: { gte: 60, lt: 80 } } }),
        prisma.client.count({ where: { score: { lt: 40 } } }),
        prisma.meeting.count(),
        prisma.meeting.count({ where: { status: "NO_SHOW" } }),
        prisma.conversation.count(),
        prisma.client.count({ where: { status: "BOOKED" } }),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((bookedClients / totalLeads) * 100) : 0;
    const showRate = totalMeetings > 0 ? Math.round(((totalMeetings - noShows) / totalMeetings) * 100) : 0;
    const sources = await prisma.client.groupBy({ by: ["source"], _count: { id: true }, orderBy: { _count: { id: "desc" } } });

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Analytics</h1><p className="text-gray-400 text-sm mt-1">Performance overview</p></div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Total Leads", value: totalLeads, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                    { label: "Conversion", value: `${conversionRate}%`, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Meetings", value: totalMeetings, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                    { label: "Show Rate", value: `${showRate}%`, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                    { label: "Hot Leads", value: hotLeads, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                    { label: "Conversations", value: totalConversations, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                ].map((m) => (
                    <div key={m.label} className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">{m.label}</p>
                        <p className="text-2xl font-bold text-white">{m.value}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Lead Score Distribution</h2>
                    {[
                        { label: "🔥 HOT (80-100)", count: hotLeads, color: "bg-red-500" },
                        { label: "🟡 WARM (60-79)", count: warmLeads, color: "bg-yellow-500" },
                        { label: "⚪ COLD (<40)", count: coldLeads, color: "bg-gray-500" },
                    ].map((t) => (
                        <div key={t.label} className="flex items-center gap-3 mb-3">
                            <span className="text-xs text-gray-400 w-32">{t.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                                <div className={`h-full ${t.color} rounded-full`} style={{ width: `${totalLeads > 0 ? (t.count / totalLeads) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-white font-medium w-6 text-right">{t.count}</span>
                        </div>
                    ))}
                </div>
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-white mb-4">Lead Sources</h2>
                    {sources.map((s) => (
                        <div key={s.source || "unknown"} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] mb-2">
                            <span className="text-xs text-gray-300">{s.source || "Unknown"}</span>
                            <span className="text-xs text-white font-semibold">{s._count.id}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
