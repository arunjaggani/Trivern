"use client";

import { useState, useEffect } from "react";
import { Link2, KeySquare, Cloud, CheckCircle, Save, Loader2, AlertTriangle, Blocks } from "lucide-react";

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        livekit_ws_url: "wss://trivern-prod.livekit.cloud",
        meta_whatsapp_token: "EAAPxyz...",
        sarvam_api_key: "sk_sarvam_...",
        openai_api_key: "sk-proj-...",
        sendgrid_api_key: "SG.x..."
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/site-config");
                const data = await res.json();
                
                const intEntry = data.find((item: any) => item.key === "integration_keys");
                if (intEntry && intEntry.value) {
                    setConfig({ ...config, ...JSON.parse(intEntry.value) });
                }
            } catch (error) {
                console.error("Failed to fetch Integrations config:", error);
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
                    { key: "integration_keys", value: JSON.stringify(config) }
                ]),
            });
            if (res.ok) alert("Integration keys securely saved!");
            else alert("Failed to save integrations.");
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    const InputRow = ({ label, propKey, type = "password" }: { label: string, propKey: keyof typeof config, type?: string }) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
            <label className="text-sm font-semibold text-white min-w-[200px]">{label}</label>
            <input 
                type={type}
                value={config[propKey]}
                onChange={e => setConfig({...config, [propKey]: e.target.value})}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none font-mono"
            />
        </div>
    );

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Blocks className="text-cyan-400" /> Third-Party Integrations
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage API keys and webhook connections for Trivern OS engines.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Keys
                </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-xs p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                <p>Keys saved here override the system .env file. Do not expose these to non-admin staff. Connections will securely route through the Next.js API layer to prevent client-side exposure.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                
                {/* Voice Infrastructure */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Cloud size={16} className="text-cyan-400" /> Voice & Telephony Layer
                    </h3>
                    <div className="space-y-1">
                        <InputRow label="LiveKit WSS Runtime URL" propKey="livekit_ws_url" type="text" />
                        <InputRow label="Sarvam TTS API Secret" propKey="sarvam_api_key" />
                    </div>
                </div>

                {/* AI & Brain */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <KeySquare size={16} className="text-purple-400" /> Cognitive Engine
                    </h3>
                    <div className="space-y-1">
                        <InputRow label="OpenAI (GPT-4o) API Key" propKey="openai_api_key" />
                    </div>
                </div>

                {/* Communication */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Link2 size={16} className="text-emerald-400" /> Comm Channels
                    </h3>
                    <div className="space-y-1">
                        <InputRow label="Meta Graph API Token" propKey="meta_whatsapp_token" />
                        <InputRow label="SendGrid API Key" propKey="sendgrid_api_key" />
                    </div>
                </div>

            </div>
        </div>
    );
}
