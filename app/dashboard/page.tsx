import prisma from "@/lib/prisma";
import { Calendar, Users, MessageSquare, TrendingUp, ArrowUpRight, Clock } from "lucide-react";

async function getStats() {
    const [clientCount, meetingCount, conversationCount, hotLeads] = await Promise.all([
        prisma.client.count(),
        prisma.meeting.count(),
        prisma.conversation.count(),
        prisma.client.count({ where: { score: { gte: 80 } } }),
    ]);

    const recentClients = await prisma.client.findMany({ take: 5, orderBy: { createdAt: "desc" } });
    const upcomingMeetings = await prisma.meeting.findMany({
        where: { status: "SCHEDULED", date: { gte: new Date() } },
        include: { client: true },
        take: 5,
        orderBy: { date: "asc" },
    });

    return { clientCount, meetingCount, conversationCount, hotLeads, recentClients, upcomingMeetings };
}

function ScoreLabel({ score }: { score: number }) {
    if (score >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">🔥 HOT</span>;
    if (score >= 60) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">🟡 WARM</span>;
    if (score >= 40) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">🔵 LUKEWARM</span>;
    if (score >= 20) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">⚪ COLD</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/30 text-gray-500 font-medium">❌ DQ</span>;
}

export default async function DashboardPage() {
    const { clientCount, meetingCount, conversationCount, hotLeads, recentClients, upcomingMeetings } = await getStats();

    const stats = [
        { label: "Total Leads", value: clientCount, icon: Users, color: "cyan" },
        { label: "Hot Leads", value: hotLeads, icon: TrendingUp, color: "red" },
        { label: "Meetings", value: meetingCount, icon: Calendar, color: "green" },
        { label: "Conversations", value: conversationCount, icon: MessageSquare, color: "purple" },
    ];

    const colorMap: Record<string, string> = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 text-sm mt-1">Your agency at a glance</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 hover:border-cyan-500/20 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colorMap[stat.color]}`}>
                                <stat.icon size={16} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white">Upcoming Meetings</h2>
                        <a href="/dashboard/crm/bookings" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">View all <ArrowUpRight size={12} /></a>
                    </div>
                    {upcomingMeetings.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No upcoming meetings</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingMeetings.map((meeting) => (
                                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-cyan-500/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">{meeting.client.name[0]}</div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{meeting.client.name}</p>
                                            <p className="text-xs text-gray-500">{meeting.client.company}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-300">{new Date(meeting.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end"><Clock size={10} />{new Date(meeting.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Leads */}
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-white">Recent Leads</h2>
                        <a href="/dashboard/crm/leads" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">View all <ArrowUpRight size={12} /></a>
                    </div>
                    {recentClients.length === 0 ? (
                        <p className="text-gray-500 text-sm py-4">No leads yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentClients.map((client) => (
                                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-cyan-500/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">{client.name[0]}</div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{client.name}</p>
                                            <p className="text-xs text-gray-500">{client.company || client.industry || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ScoreLabel score={client.scoreOverride ?? client.score} />
                                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">{client.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
