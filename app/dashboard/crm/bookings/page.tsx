"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, ExternalLink, CheckCircle, XCircle, AlertCircle, RotateCcw, FileText, Loader2 } from "lucide-react";

function MeetingStatusBadge({ status }: { status: string }) {
    const config: Record<string, { icon: any; cls: string; label: string }> = {
        SCHEDULED: { icon: Clock, cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20", label: "Scheduled" },
        COMPLETED: { icon: CheckCircle, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", label: "Completed" },
        CANCELLED: { icon: XCircle, cls: "bg-red-500/15 text-red-400 border-red-500/20", label: "Cancelled" },
        NO_SHOW: { icon: AlertCircle, cls: "bg-amber-500/15 text-amber-400 border-amber-500/20", label: "No Show" },
        RESCHEDULED: { icon: RotateCcw, cls: "bg-purple-500/15 text-purple-400 border-purple-500/20", label: "Rescheduled" },
    };
    const c = config[status] || config.SCHEDULED;
    const Icon = c.icon;
    return <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${c.cls}`}><Icon size={12} />{c.label}</span>;
}

function MeetingActionModal({ meeting, onClose, onDone }: { meeting: any; onClose: () => void; onDone: () => void }) {
    const [action, setAction] = useState<string>("");
    const [highlights, setHighlights] = useState(meeting.highlights || "");
    const [requirements, setRequirements] = useState(meeting.requirements || "");
    const [outcome, setOutcome] = useState(meeting.outcome || "");
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!action) return;
        setLoading(true);
        try {
            await fetch(`/api/meetings/${meeting.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action, highlights, requirements, outcome, remarks }),
            });
            onDone();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#0d1117] border border-cyan-500/20 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white">Update Meeting — {meeting.client?.name || "Client"}</h3>
                <p className="text-xs text-gray-400">
                    {new Date(meeting.date).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* Action Selection */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { key: "COMPLETED", label: "✅ Completed", desc: "Client attended" },
                        { key: "NO_SHOW", label: "❌ No Show", desc: "Client didn't join" },
                        { key: "CANCELLED", label: "🚫 Cancel", desc: "Cancel meeting" },
                        { key: "RESCHEDULED", label: "🔄 Reschedule", desc: "Reschedule meeting" },
                    ].map((a) => (
                        <button
                            key={a.key}
                            onClick={() => setAction(a.key)}
                            className={`p-3 rounded-lg border text-left text-sm transition-all ${action === a.key
                                ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                                }`}
                        >
                            <div className="font-medium">{a.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{a.desc}</div>
                        </button>
                    ))}
                </div>

                {/* Details Fields */}
                {action === "COMPLETED" && (
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Meeting Highlights</label>
                            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} placeholder="Key discussion points..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Client Requirements</label>
                            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} placeholder="What the client needs..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Outcome / Next Steps</label>
                            <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="Agreed next steps..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                        </div>
                    </div>
                )}

                {(action === "CANCELLED" || action === "NO_SHOW") && (
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                            {action === "CANCELLED" ? "Cancellation Reason" : "Notes"}
                        </label>
                        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder={action === "CANCELLED" ? "Why is this being cancelled?" : "Any additional notes..."} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                        <p className="text-[10px] text-amber-400/70 mt-1.5">
                            ⚠️ {action === "NO_SHOW" ? "Client will receive a reschedule message via WhatsApp" : "Client will be notified of the cancellation with reschedule options"}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!action || loading}
                        className="px-5 py-2 text-sm font-medium rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BookingsPage() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<any>(null);
    const [tab, setTab] = useState<"today" | "upcoming" | "past">("today");

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/meetings-list");
            const data = await res.json();
            setMeetings(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMeetings(); }, []);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const today = meetings.filter((m) => {
        const d = new Date(m.date);
        return d >= todayStart && d < todayEnd;
    });
    const upcoming = meetings.filter((m) => new Date(m.date) >= todayEnd && m.status === "SCHEDULED");
    const past = meetings.filter((m) => new Date(m.date) < todayStart);

    const activeList = tab === "today" ? today : tab === "upcoming" ? upcoming : past;

    const MeetingCard = ({ meeting }: { meeting: any }) => (
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 hover:border-cyan-500/20 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">{meeting.client?.name?.[0] || "?"}</div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{meeting.client?.name || "Unknown"}</h3>
                        <p className="text-xs text-gray-500">{meeting.client?.company || meeting.client?.service || "—"}</p>
                    </div>
                </div>
                <MeetingStatusBadge status={meeting.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 mb-3">
                <div className="flex items-center gap-2"><Calendar size={14} className="text-cyan-500/50" /><span>{new Date(meeting.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span></div>
                <div className="flex items-center gap-2"><Clock size={14} className="text-cyan-500/50" /><span>{new Date(meeting.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · {meeting.duration}min</span></div>
            </div>

            {/* Meeting highlights/outcome if present */}
            {meeting.highlights && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 mb-3">
                    <p className="text-[10px] text-emerald-400 font-medium mb-0.5">Highlights</p>
                    <p className="text-xs text-gray-300 line-clamp-2">{meeting.highlights}</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
                {meeting.meetLink && (
                    <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all">
                        <Video size={12} />Join<ExternalLink size={10} />
                    </a>
                )}
                {meeting.status === "SCHEDULED" && (
                    <button onClick={() => setActiveModal(meeting)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-all">
                        <FileText size={12} />Update Status
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Booking Manager</h1>
                <p className="text-gray-400 text-sm mt-1">Manage meetings, track attendance, and update status</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
                {[
                    { key: "today" as const, label: `Today (${today.length})`, dot: today.length > 0 },
                    { key: "upcoming" as const, label: `Upcoming (${upcoming.length})` },
                    { key: "past" as const, label: `Past (${past.length})` },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${tab === t.key ? "bg-cyan-500/15 text-cyan-400" : "text-gray-400 hover:text-white"}`}
                    >
                        {t.dot && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-cyan-500" size={24} /></div>
            ) : activeList.length === 0 ? (
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-8 text-center">
                    <Calendar className="mx-auto text-gray-600 mb-2" size={32} />
                    <p className="text-gray-500 text-sm">No meetings in this tab</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {activeList.map((m) => <MeetingCard key={m.id} meeting={m} />)}
                </div>
            )}

            {activeModal && (
                <MeetingActionModal
                    meeting={activeModal}
                    onClose={() => setActiveModal(null)}
                    onDone={() => { setActiveModal(null); fetchMeetings(); }}
                />
            )}
        </div>
    );
}
