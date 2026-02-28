import prisma from "@/lib/prisma";
import { Calendar, Clock, Video } from "lucide-react";

export default async function EmployeeDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [todayMeetings, upcomingMeetings] = await Promise.all([
        prisma.meeting.findMany({ where: { date: { gte: todayStart, lt: todayEnd } }, include: { client: true }, orderBy: { date: "asc" } }),
        prisma.meeting.findMany({ where: { date: { gt: todayEnd }, status: "SCHEDULED" }, include: { client: true }, orderBy: { date: "asc" }, take: 10 }),
    ]);

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Team Dashboard</h1><p className="text-gray-400 text-sm mt-1">View your meetings and client info</p></div>

            <div>
                <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Today&apos;s Meetings ({todayMeetings.length})</h2>
                {todayMeetings.length === 0 ? (
                    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-8 text-center"><Calendar className="mx-auto text-gray-600 mb-2" size={32} /><p className="text-gray-500 text-sm">No meetings today</p></div>
                ) : (
                    <div className="space-y-3">
                        {todayMeetings.map((meeting) => (
                            <div key={meeting.id} className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">{meeting.client.name[0]}</div>
                                        <div><h3 className="text-sm font-semibold text-white">{meeting.client.name}</h3><p className="text-xs text-gray-500">{meeting.client.company || "—"}</p></div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-white font-medium"><Clock size={12} className="inline mr-1 text-cyan-500" />{new Date(meeting.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                        <p className="text-xs text-gray-500">{meeting.duration} min</p>
                                    </div>
                                </div>
                                {meeting.meetLink && <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all w-fit mb-3"><Video size={14} />Join Meeting</a>}
                                {meeting.client.context && <div className="text-xs text-gray-500 bg-white/[0.03] rounded-lg px-3 py-2 mt-2"><span className="text-gray-400 font-medium">Context: </span>{meeting.client.context}</div>}
                                <div className="flex items-center gap-2 mt-3 text-xs">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${meeting.status === "SCHEDULED" ? "bg-cyan-500/15 text-cyan-400" : meeting.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>{meeting.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {upcomingMeetings.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-cyan-400 mb-3">Upcoming ({upcomingMeetings.length})</h2>
                    <div className="space-y-2">
                        {upcomingMeetings.map((meeting) => (
                            <div key={meeting.id} className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">{meeting.client.name[0]}</div>
                                    <div><p className="text-sm text-white font-medium">{meeting.client.name}</p><p className="text-[10px] text-gray-500">{meeting.client.company || "—"}</p></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-300">{new Date(meeting.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(meeting.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
