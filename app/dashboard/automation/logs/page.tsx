"use client";

import { useState, useEffect } from "react";
import { TerminalSquare, RefreshCw, Loader2, Activity, ShieldAlert, Cpu, Server, MessageSquare, PhoneCall } from "lucide-react";
import { format } from "date-fns";

type LogEntry = {
    id: string;
    type: string;
    channel: string;
    title: string;
    detail: string | null;
    triggeredBy: string;
    createdAt: string;
    client?: {
        name: string;
        company: string;
    };
};

export default function AutomationLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        try {
            setRefreshing(true);
            const res = await fetch("/api/activity?global=true&limit=60");
            const data = await res.json();
            if (data.activities) {
                // Filter specifically for SYSTEM channel or highly automated events
                const systemLogs = data.activities.filter((a: LogEntry) => 
                    a.channel === "SYSTEM" || 
                    a.triggeredBy === "SYSTEM" || 
                    a.triggeredBy === "Trivern Engine"
                );
                setLogs(systemLogs);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getIcon = (type: string, channel: string) => {
        if (channel === "VOICE") return <PhoneCall size={16} className="text-cyan-400" />;
        if (channel === "CHAT") return <MessageSquare size={16} className="text-emerald-400" />;
        if (type.includes("ERROR") || type.includes("FAIL")) return <ShieldAlert size={16} className="text-red-400" />;
        return <Cpu size={16} className="text-indigo-400" />;
    };

    const getColor = (type: string) => {
        if (type.includes("ERROR")) return "border-red-500/20 bg-red-500/5";
        if (type.includes("BOOKED")) return "border-emerald-500/20 bg-emerald-500/5";
        return "border-slate-800 bg-slate-900/50";
    };

    return (
        <div className="max-w-5xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TerminalSquare className="text-emerald-400" /> Server Logs
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Real-time trace logs of n8n webhooks, AI actions, and backend systems.</p>
                </div>
                <button 
                    onClick={fetchLogs}
                    disabled={refreshing || loading}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-white font-medium transition-colors"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-400" : "text-gray-400"} />
                    Refresh Feed
                </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-sm relative">
                
                {/* Server Header Bar */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                    <Server size={14} className="text-gray-500" />
                    <span className="text-gray-400">trivern-engine-prod // LIVE</span>
                    <div className="ml-auto flex gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                </div>

                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-emerald-500">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center text-gray-500">
                            [System idle: No recent automation logs detected]
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className={`flex items-start gap-4 p-3 rounded-lg border ${getColor(log.type)}`}>
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(log.type, log.channel)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex sm:items-center flex-col sm:flex-row gap-1 sm:gap-3 mb-1">
                                        <span className="text-emerald-400 truncate">{log.title}</span>
                                        <span className="text-gray-600 text-xs hidden sm:block">|</span>
                                        <span className="text-indigo-300 text-xs">{log.client?.name || 'System Payload'}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs break-all">{log.detail || `[${log.type}] executed successfully.`}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <span className="text-xs text-gray-500 block">{format(new Date(log.createdAt), 'MM-dd')}</span>
                                    <span className="text-[10px] text-gray-600">{format(new Date(log.createdAt), 'HH:mm:ss.SSS')}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
