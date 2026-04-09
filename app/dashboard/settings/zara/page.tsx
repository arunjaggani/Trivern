"use client";

import { useState, useEffect } from "react";
import { Mic, Languages, Save, Loader2, UserRound, Sparkles } from "lucide-react";

export default function ZaraConfigurationPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        agent_name: "Zara",
        primary_language: "te-IN", // Telugu default per specs
        secondary_languages: "hi-IN, en-IN",
        tts_pace: 1.0,
        pitch: "default",
        greeting_style: "Namaskaram",
        formality_level: "Professional yet warm",
        max_call_duration_mins: 10
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/site-config");
                const data = await res.json();
                
                const zaraEntry = data.find((item: any) => item.key === "zara_agent_config");
                if (zaraEntry && zaraEntry.value) {
                    setConfig({ ...config, ...JSON.parse(zaraEntry.value) });
                }
            } catch (error) {
                console.error("Failed to fetch Zara config:", error);
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
                    { key: "zara_agent_config", value: JSON.stringify(config) }
                ]),
            });
            if (res.ok) alert("Zara identity profile updated.");
            else alert("Failed to save profile.");
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Mic className="text-pink-400" /> Zara Voice Engine Profile
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Configure language fallback logic, vocal styles, and identity parameters.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Profile
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Agent Identity */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <UserRound size={16} className="text-cyan-400" /> Core Identity
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Agent Name</label>
                            <input 
                                type="text"
                                value={config.agent_name}
                                onChange={e => setConfig({...config, agent_name: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Greeting Style</label>
                            <input 
                                type="text"
                                value={config.greeting_style}
                                onChange={e => setConfig({...config, greeting_style: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Formality Level Directive</label>
                            <input 
                                type="text"
                                value={config.formality_level}
                                onChange={e => setConfig({...config, formality_level: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">This context is injected into the LLM system prompt.</p>
                        </div>
                    </div>
                </div>

                {/* Voice & Synthesis */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Languages size={16} className="text-emerald-400" /> Synthesis & Language
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Primary Dialect Code</label>
                            <select 
                                value={config.primary_language}
                                onChange={e => setConfig({...config, primary_language: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="te-IN">Telugu (te-IN)</option>
                                <option value="hi-IN">Hindi (hi-IN)</option>
                                <option value="en-IN">English India (en-IN)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">TTS Voice Pitch</label>
                            <select 
                                value={config.pitch}
                                onChange={e => setConfig({...config, pitch: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                            >
                                <option value="high">High (Soft)</option>
                                <option value="default">Default Neutral</option>
                                <option value="low">Deep (Professional)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Speaking Pace Multiplier (1.0 = normal)</label>
                            <input 
                                type="number" step="0.1" min="0.5" max="2.0"
                                value={config.tts_pace}
                                onChange={e => setConfig({...config, tts_pace: parseFloat(e.target.value) || 1.0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Technical Constraints */}
                <div className="md:col-span-2 bg-slate-900 border border-slate-800 shadow-inner rounded-xl p-6">
                     <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Sparkles size={16} className="text-purple-400" /> Operational Constraints
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 mb-1 block">Max Call Duration (Minutes)</label>
                            <input 
                                type="number"
                                value={config.max_call_duration_mins}
                                onChange={e => setConfig({...config, max_call_duration_mins: parseInt(e.target.value) || 10})}
                                className="w-full bg-black border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Zara will politely wrap up and end the call after this threshold to avoid huge TTS bills.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
