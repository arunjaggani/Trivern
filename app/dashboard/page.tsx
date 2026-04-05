import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    Calendar, Users, MessageSquare, TrendingUp, ArrowUpRight, Clock,
    Mic, MessageCircle, Settings, Zap
} from "lucide-react";
import { CHANNEL_CONFIG, TYPE_CONFIG } from "@/lib/activity";

async function getStats() {
    const [clientCount, meetingCount, conversationCount, hotLeads] = await Promise.all([
        prisma.client.count(),
        prisma.meeting.count(),
        prisma.conversation.count(),
        prisma.client.count({ where: { score: { gte: 80 } } }),
    ]);

    const [recentClients, upcomingMeetings, recentActivity] = await Promise.all([
        prisma.client.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
        prisma.meeting.findMany({
            where: { status: "SCHEDULED", date: { gte: new Date() } },
            include: { client: true },
            take: 5,
            orderBy: { date: "asc" },
        }),
        // God-View: last 20 cross-lead activities
        prisma.leadActivity.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
                client: {
                    select: { id: true, name: true, company: true, status: true, score: true, scoreOverride: true },
                },
            },
        }).catch(() => []), // Graceful — returns empty if table doesn't exist yet
    ]);

    return { clientCount, meetingCount, conversationCount, hotLeads, recentClients, upcomingMeetings, recentActivity };
}

function ScoreLabel({ score }: { score: number }) {
    if (score >= 80) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">🔥 HOT</span>;
    if (score >= 60) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">🟡 WARM</span>;
    if (score >= 40) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">🔵 LUKEWARM</span>;
    if (score >= 20) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-medium">⚪ COLD</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/30 text-gray-500 font-medium">❌ DQ</span>;
}

function timeAgo(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default async function DashboardPage() {
    const { clientCount, meetingCount, conversationCount, hotLeads, recentClients, upcomingMeetings, recentActivity } = await getStats();

    const stats = [
        { label: "Total Leads", value: clientCount, icon: Users, color: "cyan" },
        { label: "Hot Leads 🔥", value: hotLeads, icon: TrendingUp, color: "red" },
        { label: "Meetings", value: meetingCount, icon: Calendar, color: "green" },
        { label: "Conversations", value: conversationCount, icon: MessageSquare, color: "purple" },
    ];

    const colorMap: Record<string, string> = {
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    const channelIcon: Record<string, any> = {
        VOICE: Mic,
        CHAT: MessageCircle,
        MANUAL: Settings,
        SYSTEM: Zap,
    };

    const channelColor: Record<string, string> = {
        VOICE: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        CHAT: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        MANUAL: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        SYSTEM: "text-gray-400 bg-gray-500/10 border-gray-500/20",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-gray-400 text-sm mt-1">Your agency at a glance — Voice + Chat, unified.</p>
            </div>

            {/* Stats row */}
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

            {/* Main grid: Feed + Meetings + Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── God-View Activity Feed (full left column) ───────────── */}
                <div className="lg:col-span-1 bg-white/5 border border-cyan-500/10 rounded-xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-white">God-View Feed</h2>
                            <p className="text-[10px] text-gray-500 mt-0.5">Live activity — Voice + Chat unified</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live" />
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                            <Zap size={24} className="text-gray-600 mb-2" />
                            <p className="text-gray-500 text-sm">No activity yet</p>
                            <p className="text-gray-600 text-xs mt-1">Events will appear here as leads interact</p>
                        </div>
                    ) : (
                        <div className="space-y-0 flex-1 overflow-y-auto max-h-[480px] pr-1">
                            {(recentActivity as any[]).map((activity, i) => {
                                const ChannelIcon = channelIcon[activity.channel] || Zap;
                                const typeConf = TYPE_CONFIG[activity.type as keyof typeof TYPE_CONFIG];
                                return (
                                    <div key={activity.id} className="relative">
                                        {/* Vertical connector */}
                                        {i < recentActivity.length - 1 && (
                                            <div className="absolute left-4 top-8 bottom-0 w-px bg-white/5" />
                                        )}
                                        <div className="flex gap-3 py-3">
                                            {/* Channel icon */}
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${channelColor[activity.channel] || "bg-gray-500/10 border-gray-500/20"}`}>
                                                <ChannelIcon size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Lead name link */}
                                                {activity.client && (
                                                    <Link
                                                        href={`/dashboard/crm/leads/${activity.client.id}`}
                                                        className="text-[11px] font-semibold text-cyan-400 hover:underline truncate block"
                                                    >
                                                        {activity.client.name}
                                                        {activity.client.company && <span className="text-gray-500 font-normal"> · {activity.client.company}</span>}
                                                    </Link>
                                                )}
                                                <p className="text-xs text-gray-200 mt-0.5 leading-snug">
                                                    {typeConf?.icon} {activity.title}
                                                </p>
                                                {activity.detail && (
                                                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{activity.detail}</p>
                                                )}
                                                {/* Status change pill */}
                                                {activity.fromStatus && activity.toStatus && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{activity.fromStatus}</span>
                                                        <span className="text-[9px] text-gray-600">→</span>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{activity.toStatus}</span>
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-gray-600 mt-1">{timeAgo(activity.createdAt)}</p>
                                            </div>
                                            {/* Score snapshot */}
                                            {activity.scoreAtEvent !== null && activity.scoreAtEvent !== undefined && (
                                                <span className={`text-[10px] font-bold shrink-0 self-start mt-1 ${activity.scoreAtEvent >= 80 ? "text-red-400" : activity.scoreAtEvent >= 60 ? "text-yellow-400" : "text-gray-500"}`}>
                                                    {activity.scoreAtEvent}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right 2 columns: Meetings + Recent Leads ───────────── */}
                <div className="lg:col-span-2 space-y-6">
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
                                    <Link
                                        key={client.id}
                                        href={`/dashboard/crm/leads/${client.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-cyan-500/5 hover:border-cyan-500/20 transition-all"
                                    >
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
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
