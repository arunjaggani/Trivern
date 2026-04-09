"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, ShieldAlert, CheckCircle, Save, Loader2, Calendar } from "lucide-react";

export default function BookingEnginePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        startHour: 9,
        endHour: 21,
        slotDuration: 30,
        bufferMinutes: 30,
        maxPerDay: 6,
        automationOn: true,
        blockedDates: '[]',
        holidays: '[]'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/booking-settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data) setSettings(data);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/booking-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) alert("Booking engine parameters locked in!");
        } catch (error) {
            console.error("Error saving booking settings:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    const parseLabelArr = (jsonStr: string) => {
        try { return JSON.parse(jsonStr).join(", "); } catch { return ""; }
    };
    const updateLabelArr = (key: string, val: string) => {
        const arr = val.split(",").map(s => s.trim()).filter(Boolean);
        setSettings({...settings, [key]: JSON.stringify(arr)});
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-amber-400" /> Booking Engine
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Global logic controls for AI scheduling injections.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Apply Engine Specs
                </button>
            </div>

            {/* Master Toggle */}
            <div className={`p-6 rounded-xl border flex items-center justify-between transition-all ${settings.automationOn ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {settings.automationOn ? <CheckCircle size={20} className="text-emerald-400" /> : <ShieldAlert size={20} className="text-red-400" />}
                        Scheduling Automation is {settings.automationOn ? "ACTIVE" : "PAUSED"}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 max-w-xl">
                        When active, Zara and the Web Agents will dynamically check your calendar and inject booking links into conversations. When paused, they will route leads to WhatsApp only.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={settings.automationOn} onChange={e => setSettings({...settings, automationOn: e.target.checked})} />
                    <div className={"w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all " + (settings.automationOn ? "peer-checked:bg-emerald-500" : "bg-red-500")}></div>
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Time Fences */}
                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Clock size={16} className="text-cyan-400" /> Operational Fences
                    </h3>
                    
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Start Hour (24H)</label>
                                <input 
                                    type="number" min="0" max="23"
                                    value={settings.startHour}
                                    onChange={e => setSettings({...settings, startHour: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">End Hour (24H)</label>
                                <input 
                                    type="number" min="0" max="23"
                                    value={settings.endHour}
                                    onChange={e => setSettings({...settings, endHour: parseInt(e.target.value) || 23})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Slot Duration (Mins)</label>
                                <input 
                                    type="number" min="15" step="15"
                                    value={settings.slotDuration}
                                    onChange={e => setSettings({...settings, slotDuration: parseInt(e.target.value) || 30})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Buffer Gap (Mins)</label>
                                <input 
                                    type="number" min="0" step="5"
                                    value={settings.bufferMinutes}
                                    onChange={e => setSettings({...settings, bufferMinutes: parseInt(e.target.value) || 0})}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Capacity & Overrides */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Calendar size={16} className="text-purple-400" /> Capacity & Exclusions
                    </h3>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Maximum Bookings Per Day</label>
                            <input 
                                type="number" min="1"
                                value={settings.maxPerDay}
                                onChange={e => setSettings({...settings, maxPerDay: parseInt(e.target.value) || 1})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Zara will stop offering slots entirely for the day if this threshold is hit.</p>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Blocked Dates (MM-DD-YYYY)</label>
                            <input 
                                type="text" placeholder="e.g. 12-25-2026, 01-01-2027"
                                value={parseLabelArr(settings.blockedDates)}
                                onChange={e => updateLabelArr("blockedDates", e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Recurring Holidays</label>
                            <input 
                                type="text" placeholder="e.g. Sunday, Saturday"
                                value={parseLabelArr(settings.holidays)}
                                onChange={e => updateLabelArr("holidays", e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
