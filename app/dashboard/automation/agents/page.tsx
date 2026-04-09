"use client";

import { useState, useEffect } from "react";
import { Bot, PhoneCall, MessageCircle, Globe, Activity, Power, Save, Loader2 } from "lucide-react";

export default function AIAgentsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Stats fetched from DB
    const [stats, setStats] = useState({
        voiceCalls: 0,
        whatsappChats: 0
    });

    // Configuration linked to SiteConfig
    const [config, setConfig] = useState({
        voice_agent_active: true,
        whatsapp_agent_active: true,
        website_chatbot_active: true,
        master_kill_switch: false
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats concurrently
                const [voiceRes, chatRes, configRes] = await Promise.all([
                    fetch("/api/voice/log"),
                    fetch("/api/conversations"),
                    fetch("/api/site-config")
                ]);

                const voiceData = await voiceRes.json();
                const chatData = await chatRes.json();
                const configData = await configRes.json();

                setStats({
                    voiceCalls: voiceData.stats?.totalCalls || voiceData.calls?.length || 0,
                    whatsappChats: chatData.length || 0
                });

                const agentConfig = configData.find((c: any) => c.key === "ai_agents_config");
                if (agentConfig && agentConfig.value) {
                    setConfig({ ...config, ...JSON.parse(agentConfig.value) });
                }
            } catch (error) {
                console.error("Failed to fetch agent data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/site-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([{ key: "ai_agents_config", value: JSON.stringify(config) }]),
            });
            alert("Agent configurations saved and deployed!");
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
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bot className="text-cyan-400" /> AI Fleet Command
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage, monitor, and override Trivern OS AI endpoints.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-bold transition-colors ${config.master_kill_switch ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                        <Activity size={16} />
                        {config.master_kill_switch ? 'FLEET OFFLINE' : 'FLEET OPERATIONAL'}
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Network
                    </button>
                </div>
            </div>

            {/* Master Override Card */}
            <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between z-10 relative">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Power size={18} className="text-red-400" /> Emergency Kill Switch
                        </h3>
                        <p className="text-gray-400 text-sm mt-1 max-w-xl">
                            Activating this will instantly hard-stop ALL AI automated responses across Voice, WhatsApp, and Web. 
                            Manual human intervention will be required for all leads.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={config.master_kill_switch} onChange={e => setConfig({...config, master_kill_switch: e.target.checked})} />
                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Voice Agent Node */}
                <div className={`bg-white/5 border rounded-xl p-6 transition-all ${config.voice_agent_active && !config.master_kill_switch ? 'border-cyan-500/30' : 'border-gray-700 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <PhoneCall size={24} />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" disabled={config.master_kill_switch} className="sr-only peer" checked={config.voice_agent_active} onChange={e => setConfig({...config, voice_agent_active: e.target.checked})} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Zara Voice AI</h3>
                    <p className="text-sm text-gray-400 mb-6 min-h-[40px]">LiveKit powered outbound & inbound scheduling agent.</p>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Dispatched Calls</p>
                        <p className="text-2xl font-bold text-white">{stats.voiceCalls}</p>
                    </div>
                </div>

                {/* 2. WhatsApp Agent Node */}
                <div className={`bg-white/5 border rounded-xl p-6 transition-all ${config.whatsapp_agent_active && !config.master_kill_switch ? 'border-emerald-500/30' : 'border-gray-700 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <MessageCircle size={24} />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" disabled={config.master_kill_switch} className="sr-only peer" checked={config.whatsapp_agent_active} onChange={e => setConfig({...config, whatsapp_agent_active: e.target.checked})} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">WhatsApp Conversion</h3>
                    <p className="text-sm text-gray-400 mb-6 min-h-[40px]">n8n powered follow-up and objection handling agent.</p>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Active Conversations</p>
                        <p className="text-2xl font-bold text-white">{stats.whatsappChats}</p>
                    </div>
                </div>

                {/* 3. Website Chatbot Node */}
                <div className={`bg-white/5 border rounded-xl p-6 transition-all ${config.website_chatbot_active && !config.master_kill_switch ? 'border-purple-500/30' : 'border-gray-700 opacity-60'}`}>
                    <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Globe size={24} />
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" disabled={config.master_kill_switch} className="sr-only peer" checked={config.website_chatbot_active} onChange={e => setConfig({...config, website_chatbot_active: e.target.checked})} />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">Public Site Concierge</h3>
                    <p className="text-sm text-gray-400 mb-6 min-h-[40px]">Embedded web widget for 24/7 instant FAQ and capture.</p>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Widget Status</p>
                        <p className="text-lg font-bold text-white">{config.website_chatbot_active && !config.master_kill_switch ? "Live on Pages" : "Hidden"}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
