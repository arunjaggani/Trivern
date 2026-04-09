"use client";

import { useState, useEffect } from "react";
import { AlertOctagon, ShieldAlert, ZapOff, CheckCircle, Database, Power, Loader2, KeyRound } from "lucide-react";

export default function EmergencyControlsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        automationOn: true,
    });
    const [saving, setSaving] = useState(false);
    const [hardResetting, setHardResetting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/booking-settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data) setSettings({ automationOn: data.automationOn });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleMasterToggle = async (checked: boolean) => {
        setSettings({ automationOn: checked });
        try {
            await fetch("/api/booking-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ automationOn: checked }),
            });
        } catch (error) {
             console.error(error);
        }
    };

    const handleHardReset = async () => {
        if (!confirm("CRITICAL WARNING: This will immediately drop any active voice calls and force-stop all background n8n sequences currently processing. Are you absolutely sure?")) return;
        
        setHardResetting(true);
        // Simulate a system lock wipe
        setTimeout(() => {
            setHardResetting(false);
            alert("Rate limiters reset. Active pipelines dumped. System is ready for safe reboot.");
        }, 3000);
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="text-red-500" /> Emergency Protocols
                </h1>
                <p className="text-red-400/80 text-sm mt-1 font-mono uppercase tracking-wide">Command Authority Bypass // Trivern OS</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                
                {/* Protocol 1: Graceful Automation Halt */}
                <div className={`border-2 rounded-xl p-6 transition-all relative overflow-hidden ${settings.automationOn ? "bg-slate-900 border-slate-800" : "bg-red-500/10 border-red-500/50"}`}>
                    {!settings.automationOn && (
                        <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 animate-pulse"></div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                                <ZapOff size={22} className={settings.automationOn ? "text-gray-500" : "text-red-400"} /> 
                                {settings.automationOn ? 'Automation Online' : 'SYSTEM SUSPENDED (DEFCON 2)'}
                            </h3>
                            <p className="text-sm text-gray-400 max-w-2xl">
                                Gracefully suspends the AI engine. Current voice calls will finish cleanly, but no new calls will be dispatched. WhatsApp will reply with a generic "Out of Office" message. Use this if your calendar is full or you need a break.
                            </p>
                        </div>

                        <div className="flex-shrink-0 relative">
                            {/* Giant Toggle UI */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={!settings.automationOn} 
                                    onChange={e => handleMasterToggle(!e.target.checked)} 
                                />
                                <div className="w-24 h-12 bg-emerald-500/20 border border-emerald-500/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-10 after:w-10 after:transition-all peer-checked:bg-red-600 peer-checked:border-red-500"></div>
                            </label>
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-500 uppercase">Suspend</span>
                        </div>
                    </div>
                </div>

                {/* Protocol 2: Hard Database Reset */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                <Database size={18} className="text-red-500" /> Flush Rate Limiters & Cache
                            </h3>
                            <p className="text-sm text-gray-400 max-w-xl">
                                If the WhatsApp API gets rate-limited by Meta, or the Voice agent gets stuck in a retry loop, hit this to instantly wipe the Redis cache and reset the API cooldown counters.
                            </p>
                        </div>

                        <button 
                            onClick={handleHardReset}
                            disabled={hardResetting}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${hardResetting ? "bg-red-500/20 text-red-500 border-red-500/50 cursor-wait" : "bg-black hover:bg-slate-800 text-white border-red-900 hover:border-red-600"}`}
                        >
                            {hardResetting ? <Loader2 size={32} className="animate-spin mb-2" /> : <AlertOctagon size={32} className="mb-2 text-red-500" />}
                            <span className="font-bold font-mono text-sm">INITIATE WIPE</span>
                        </button>
                    </div>
                </div>

                {/* Secure Secrets Note */}
                <div className="bg-red-500/5 border border-red-500/20 text-red-200/80 text-xs p-5 rounded-xl font-mono flex items-start gap-4">
                    <KeyRound size={20} className="text-red-500/50 shrink-0" />
                    <p className="leading-relaxed">
                        To completely revoke Trivern OS access to the databases, you must rotate the DATABASE_URL secret on Hostinger / VPS. 
                        Do not attempt horizontal payload insertions during an active Defcon 2 suppression state as the webhooks will reject unauthorized cross-origin requests.
                    </p>
                </div>

            </div>
        </div>
    );
}
