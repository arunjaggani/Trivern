"use client";

import { useState, useEffect } from "react";
import { Bot, Power, MessageSquare, Save, Loader2, AlertTriangle, Type } from "lucide-react";

export default function ZaraSettingsPage() {
    const [enabled, setEnabled] = useState(true);
    const [maxWords, setMaxWords] = useState(80);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetch("/api/chatbot-settings")
            .then(r => r.json())
            .then(data => {
                setEnabled(data.enabled);
                setMaxWords(data.maxWords);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/chatbot-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled, maxWords }),
            });
            if (res.ok) {
                setSuccess("Settings saved!");
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch { }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin" size={32} style={{ color: "#0D9488" }} />
            </div>
        );
    }

    const cardStyle = "bg-[hsl(var(--card))] border rounded-xl shadow-[var(--shadow-xs)]";

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--dash-text))" }}>Zara Chatbot</h1>
                <p className="text-sm mt-1" style={{ color: "hsl(var(--dash-text-muted))" }}>Configure Zara's behavior on your website</p>
            </div>

            {/* Success toast */}
            {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] text-sm font-medium" style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                    ✓ {success}
                </div>
            )}

            {/* Status Card */}
            <div className={`${cardStyle} p-5`} style={{ borderColor: "var(--dash-border)" }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] grid place-items-center" style={{
                            background: enabled ? "#CCFBF1" : "#F1F5F9",
                            color: enabled ? "#0D9488" : "#94A3B8",
                        }}>
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--dash-text))" }}>Website Chatbot</h3>
                            <p className="text-xs" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                {enabled ? "Zara is active on your site" : "Zara is hidden from visitors"}
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className="relative w-12 h-7 rounded-full transition-all duration-300"
                        style={{
                            background: enabled ? "#0D9488" : "#CBD5E1",
                            boxShadow: enabled ? "0 0 8px rgba(13,148,136,0.3)" : "none",
                        }}
                    >
                        <div
                            className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
                            style={{
                                left: enabled ? "22px" : "2px",
                            }}
                        />
                    </button>
                </div>

                {!enabled && (
                    <div className="flex items-start gap-2 mt-4 px-3 py-2.5 rounded-lg text-xs" style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>The chatbot is currently disabled. Visitors won't see the chat button on your website.</span>
                    </div>
                )}
            </div>

            {/* Word Limit Card */}
            <div className={`${cardStyle} p-5`} style={{ borderColor: "var(--dash-border)" }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-[10px] grid place-items-center" style={{ background: "#DBEAFE", color: "#2563EB" }}>
                        <Type size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--dash-text))" }}>Reply Word Limit</h3>
                        <p className="text-xs" style={{ color: "hsl(var(--dash-text-muted))" }}>
                            Maximum words Zara uses per response
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Slider */}
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-medium w-6" style={{ color: "hsl(var(--dash-text-muted))" }}>20</span>
                        <input
                            type="range"
                            min={20}
                            max={300}
                            step={10}
                            value={maxWords}
                            onChange={e => setMaxWords(Number(e.target.value))}
                            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #0D9488 0%, #0D9488 ${((maxWords - 20) / 280) * 100}%, #E2E8F0 ${((maxWords - 20) / 280) * 100}%, #E2E8F0 100%)`,
                                accentColor: "#0D9488",
                            }}
                        />
                        <span className="text-xs font-medium w-8" style={{ color: "hsl(var(--dash-text-muted))" }}>300</span>
                    </div>

                    {/* Current value */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={20}
                                max={300}
                                value={maxWords}
                                onChange={e => {
                                    const v = Number(e.target.value);
                                    if (v >= 20 && v <= 300) setMaxWords(v);
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg text-sm text-center font-semibold outline-none"
                                style={{
                                    border: "1px solid var(--dash-border)",
                                    background: "var(--dash-bg)",
                                    color: "hsl(var(--dash-text))",
                                }}
                            />
                            <span className="text-xs" style={{ color: "hsl(var(--dash-text-muted))" }}>words</span>
                        </div>

                        {/* Presets */}
                        <div className="flex gap-1.5">
                            {[
                                { label: "Brief", value: 50 },
                                { label: "Normal", value: 80 },
                                { label: "Detailed", value: 150 },
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => setMaxWords(preset.value)}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                                    style={{
                                        background: maxWords === preset.value ? "#CCFBF1" : "transparent",
                                        color: maxWords === preset.value ? "#0D9488" : "hsl(var(--dash-text-muted))",
                                        border: `1px solid ${maxWords === preset.value ? "#99F6E4" : "var(--dash-border)"}`,
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-[10px]" style={{ color: "hsl(var(--dash-text-muted))" }}>
                        💡 Shorter replies feel more conversational (like WhatsApp). Longer replies give more detail.
                    </p>
                </div>
            </div>

            {/* Preview Card */}
            <div className={`${cardStyle} p-5`} style={{ borderColor: "var(--dash-border)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--dash-text))" }}>Preview</h3>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--dash-border)" }}>
                    {/* Mini header */}
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)" }}>
                        <div className="w-7 h-7 rounded-full grid place-items-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                            <Bot size={14} color="white" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">Zara</div>
                            <div className="text-[10px] text-white/70">AI Growth Consultant</div>
                        </div>
                    </div>
                    {/* Mini chat */}
                    <div className="p-3 space-y-2" style={{ background: "#ECE5DD" }}>
                        <div className="flex">
                            <div className="text-xs px-3 py-1.5 rounded-lg bg-white shadow-sm" style={{ borderTopLeftRadius: 0, maxWidth: "85%", color: "#0F172A" }}>
                                Hey there! 👋 I'm Zara. What brings you here today?
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div className="text-xs px-3 py-1.5 rounded-lg shadow-sm" style={{ background: "#DCF8C6", borderTopRightRadius: 0, maxWidth: "85%", color: "#0F172A" }}>
                                I need help with my business website
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] mt-2 text-center" style={{ color: "hsl(var(--dash-text-muted))" }}>
                    Status: {enabled ? "✅ Visible to visitors" : "❌ Hidden"} • Max reply: {maxWords} words
                </p>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-white text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", boxShadow: "0 4px 12px rgba(13,148,136,0.35)" }}
            >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Settings
            </button>
        </div>
    );
}
