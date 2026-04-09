"use client";

import { useState, useEffect } from "react";
import { Calendar, Link as LinkIcon, RefreshCw, Save, Loader2, AlertCircle } from "lucide-react";

export default function CalendarSyncPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        primary_calendar_email: "arun@trivern.com",
        auto_generate_meet: true,
        calendar_provider: "google",
        n8n_calendar_webhook: "https://trivern.app.n8n.cloud/webhook/calendar-sync",
        sync_frequency_mins: 15,
        default_meeting_title: "{client_name} - Trivern Discovery Strategy",
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/site-config");
                const data = await res.json();
                
                const calEntry = data.find((item: any) => item.key === "calendar_integration_settings");
                if (calEntry && calEntry.value) {
                    setConfig({ ...config, ...JSON.parse(calEntry.value) });
                }
            } catch (error) {
                console.error("Failed to fetch Calendar config:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/site-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([
                    { key: "calendar_integration_settings", value: JSON.stringify(config) }
                ]),
            });
            if (res.ok) alert("Calendar synchronization settings saved!");
            else alert("Failed to save settings.");
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-indigo-400" /> Calendar Sync
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage integration between Trivern OS and your booking provider.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Saving..." : "Save Configuration"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Integration Status Card */}
                <div className="bg-white/5 border border-indigo-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <LinkIcon size={16} className="text-indigo-400" /> Connection Details
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Provider</label>
                            <select 
                                value={config.calendar_provider}
                                onChange={e => setConfig({...config, calendar_provider: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none"
                            >
                                <option value="google">Google Calendar / Workspace</option>
                                <option value="outlook">Microsoft Outlook 365</option>
                                <option value="ical">Apple iCloud Calendar</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Primary Calendar Account Data (Email)</label>
                            <input 
                                type="email"
                                value={config.primary_calendar_email}
                                onChange={e => setConfig({...config, primary_calendar_email: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div className="pt-2">
                             <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-3">
                                 <AlertCircle className="text-indigo-400 mt-0.5" size={16} />
                                 <p className="text-xs text-indigo-200 leading-relaxed">
                                     Trivern accesses this calendar using service account keys (or the n8n logic node). Always ensure the configured email has write permissions open to the service account.
                                 </p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Webhook & Meeting Defaults */}
                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <RefreshCw size={16} className="text-cyan-400" /> Automation Handling
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">n8n Custom Sync Webhook URL</label>
                            <input 
                                type="text"
                                value={config.n8n_calendar_webhook}
                                onChange={e => setConfig({...config, n8n_calendar_webhook: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-gray-400 font-mono text-xs focus:border-cyan-500 outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Meeting Invite Title Format</label>
                            <input 
                                type="text"
                                value={config.default_meeting_title}
                                onChange={e => setConfig({...config, default_meeting_title: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Available variables: {'{client_name}'}, {'{business_name}'}, {'{service}'}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                            <div>
                                <h4 className="text-sm font-semibold text-white">Auto-Generate Video Link</h4>
                                <p className="text-xs text-gray-500">Attach Google Meet links to events instantly.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.auto_generate_meet} onChange={e => setConfig({...config, auto_generate_meet: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
