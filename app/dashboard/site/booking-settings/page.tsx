"use client";
import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Loader2 } from "lucide-react";

export default function BookingSettingsPage() {
    const [settings, setSettings] = useState({ startHour: 9, endHour: 21, slotDuration: 30, bufferMinutes: 30, maxPerDay: 6, blockedDates: [] as string[], holidays: [] as string[], automationOn: true });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newBlockedDate, setNewBlockedDate] = useState("");

    useEffect(() => {
        fetch("/api/booking-settings").then((r) => r.json()).then((data) => {
            if (data) setSettings({ ...data, blockedDates: JSON.parse(data.blockedDates || "[]"), holidays: JSON.parse(data.holidays || "[]") });
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await fetch("/api/booking-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, blockedDates: JSON.stringify(settings.blockedDates), holidays: JSON.stringify(settings.holidays) }) });
        setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Booking Settings</h1><p className="text-gray-400 text-sm mt-1">Configure availability and booking rules</p></div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition-all disabled:opacity-50">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saved ? "Saved ✓" : "Save Changes"}
                </button>
            </div>

            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Time Window</h2>
                <div className="grid grid-cols-2 gap-4">
                    {(["startHour", "endHour"] as const).map((field) => (
                        <div key={field}>
                            <label className="block text-xs text-gray-400 mb-1">{field === "startHour" ? "Start Hour" : "End Hour"}</label>
                            <select value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-cyan-500/20 text-white text-sm outline-none focus:border-cyan-500">
                                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i} className="bg-slate-900">{i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Slot Settings</h2>
                <div className="grid grid-cols-3 gap-4">
                    {([["slotDuration", "Duration (min)"], ["bufferMinutes", "Buffer (min)"], ["maxPerDay", "Max/Day"]] as const).map(([field, label]) => (
                        <div key={field}><label className="block text-xs text-gray-400 mb-1">{label}</label>
                            <input type="number" value={settings[field]} onChange={(e) => setSettings({ ...settings, [field]: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-cyan-500/20 text-white text-sm outline-none focus:border-cyan-500" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                <div className="flex items-center justify-between">
                    <div><h2 className="text-sm font-semibold text-white">Automation</h2><p className="text-xs text-gray-500 mt-1">AI-powered booking + notifications</p></div>
                    <button onClick={() => setSettings({ ...settings, automationOn: !settings.automationOn })} className={`relative w-12 h-6 rounded-full transition-colors ${settings.automationOn ? "bg-cyan-500" : "bg-gray-700"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${settings.automationOn ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 space-y-3">
                <h2 className="text-sm font-semibold text-white">Blocked Dates</h2>
                <div className="flex gap-2">
                    <input type="date" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-cyan-500/20 text-white text-sm outline-none focus:border-cyan-500" />
                    <button onClick={() => { if (newBlockedDate && !settings.blockedDates.includes(newBlockedDate)) { setSettings({ ...settings, blockedDates: [...settings.blockedDates, newBlockedDate] }); setNewBlockedDate(""); } }} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs border border-cyan-500/20 hover:bg-cyan-500/20"><Plus size={14} /> Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {settings.blockedDates.map((date) => (
                        <span key={date} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-white/5 rounded-full text-gray-300 border border-white/5">{date}
                            <button onClick={() => setSettings({ ...settings, blockedDates: settings.blockedDates.filter((d) => d !== date) })} className="text-gray-500 hover:text-red-400"><Trash2 size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
