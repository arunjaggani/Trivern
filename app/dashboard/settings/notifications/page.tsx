"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Save, Loader2, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        email_notifications_enabled: true,
        whatsapp_notifications_enabled: true,
        notification_email: "arun@trivern.com",
        notification_phone: "+919999999999",
        alert_on_new_lead: true,
        alert_on_booking: true,
        alert_on_escalation: true,
        daily_summary_enabled: false
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/site-config");
                const data = await res.json();
                
                const notifEntry = data.find((item: any) => item.key === "admin_notification_settings");
                if (notifEntry && notifEntry.value) {
                    setConfig({ ...config, ...JSON.parse(notifEntry.value) });
                }
            } catch (error) {
                console.error("Failed to fetch notification config:", error);
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
                    { key: "admin_notification_settings", value: JSON.stringify(config) }
                ]),
            });
            if (res.ok) alert("Notification preferences updated.");
            else alert("Failed to save notifications.");
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    const ToggleRow = ({ label, propKey, subText }: { label: string, propKey: keyof typeof config, subText?: string }) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
            <div>
                <h4 className="text-sm font-semibold text-white">{label}</h4>
                {subText && <p className="text-[10px] text-gray-500">{subText}</p>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={config[propKey] as boolean} 
                    onChange={e => setConfig({...config, [propKey]: e.target.checked})} 
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
        </div>
    );

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="text-cyan-400" /> Webhook Routing Alerts
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Configure where and how the Trivern engine notifies your team.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Alerts
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Routing Addresses */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Mail size={16} className="text-indigo-400" /> Delivery Endpoints
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Primary Root Email</label>
                            <input 
                                type="email"
                                value={config.notification_email}
                                onChange={e => setConfig({...config, notification_email: e.target.value})}
                                disabled={!config.email_notifications_enabled}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">WhatsApp Admin Number</label>
                            <input 
                                type="text"
                                value={config.notification_phone}
                                onChange={e => setConfig({...config, notification_phone: e.target.value})}
                                disabled={!config.whatsapp_notifications_enabled}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-indigo-500 outline-none disabled:opacity-50"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Must include country code (e.g. +91)</p>
                        </div>
                    </div>
                </div>

                {/* Event Triggers */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                     <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <CheckCircle2 size={16} className="text-emerald-400" /> Trigger Rules
                    </h3>
                    <div className="flex flex-col">
                        <ToggleRow label="Alert on New Meeting Booked" propKey="alert_on_booking" subText="Fires when Zara or web captures a solid time block." />
                        <ToggleRow label="Alert on Lead Escalation" propKey="alert_on_escalation" subText="Fires if Zara drops a call or lead demands human admin." />
                        <ToggleRow label="Alert on ANY new Web Lead" propKey="alert_on_new_lead" subText="High volume - use cautiously." />
                        <ToggleRow label="Enable Daily Summary Rollup" propKey="daily_summary_enabled" subText="Sends a 6PM IST digest of the day's activity." />
                    </div>
                </div>

                {/* Channel Toggles */}
                 <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-black border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Master Routing Interfaces</h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-between ${config.email_notifications_enabled ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-slate-800 bg-slate-950'}`}>
                            <div className="flex items-center gap-3">
                                <Mail size={24} className={config.email_notifications_enabled ? "text-cyan-400" : "text-gray-500"} />
                                <div><h4 className="font-bold text-white text-sm">SendGrid Push</h4><p className="text-xs text-gray-500">Standard Email</p></div>
                            </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.email_notifications_enabled} onChange={e => setConfig({...config, email_notifications_enabled: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>

                         <div className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-between ${config.whatsapp_notifications_enabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'}`}>
                            <div className="flex items-center gap-3">
                                <MessageSquare size={24} className={config.whatsapp_notifications_enabled ? "text-emerald-400" : "text-gray-500"} />
                                <div><h4 className="font-bold text-white text-sm">Meta Push</h4><p className="text-xs text-gray-500">Direct WhatsApp Ping</p></div>
                            </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.whatsapp_notifications_enabled} onChange={e => setConfig({...config, whatsapp_notifications_enabled: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
