"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function SecurityPage() {
    const { data: session } = useSession();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        if (newPassword !== confirmPassword) {
            setResult({ type: "error", message: "New passwords don't match" });
            return;
        }
        if (newPassword.length < 6) {
            setResult({ type: "error", message: "New password must be at least 6 characters" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setResult({ type: "success", message: "Password changed successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setResult({ type: "error", message: data.error || "Something went wrong" });
            }
        } catch {
            setResult({ type: "error", message: "Network error. Please try again." });
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: "32px", maxWidth: "520px" }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "hsl(var(--dash-text))", marginBottom: "6px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Shield size={22} color="#0D9488" /> Security
                </h1>
                <p style={{ color: "hsl(var(--dash-text-muted))", fontSize: "14px" }}>
                    Logged in as <strong style={{ color: "hsl(var(--dash-text))" }}>{session?.user?.email}</strong>
                    &nbsp;·&nbsp;<span style={{ color: "#0D9488", textTransform: "capitalize" }}>{(session?.user as any)?.role}</span>
                </p>
            </div>

            <div style={{ background: "var(--dash-card)", borderRadius: "12px", border: "1px solid var(--dash-border)", padding: "24px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "hsl(var(--dash-text))", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Lock size={16} color="#0D9488" /> Change Password
                </h2>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ fontSize: "13px", color: "hsl(var(--dash-text-muted))", marginBottom: "6px", display: "block" }}>Current Password</label>
                        <div style={{ position: "relative" }}>
                            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="Enter current password"
                                style={{ width: "100%", padding: "10px 40px 10px 12px", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "8px", color: "hsl(var(--dash-text))", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                            <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--dash-text-muted))" }}>
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", color: "hsl(var(--dash-text-muted))", marginBottom: "6px", display: "block" }}>New Password</label>
                        <div style={{ position: "relative" }}>
                            <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters"
                                style={{ width: "100%", padding: "10px 40px 10px 12px", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "8px", color: "hsl(var(--dash-text))", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                            <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(var(--dash-text-muted))" }}>
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: "13px", color: "hsl(var(--dash-text-muted))", marginBottom: "6px", display: "block" }}>Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat new password"
                            style={{ width: "100%", padding: "10px 12px", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "8px", color: "hsl(var(--dash-text))", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                    </div>

                    {result && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "8px", background: result.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${result.type === "success" ? "#10B981" : "#EF4444"}`, color: result.type === "success" ? "#10B981" : "#EF4444", fontSize: "13px" }}>
                            {result.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                            {result.message}
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        style={{ padding: "11px", background: loading ? "#0F766E" : "#0D9488", color: "white", fontWeight: 600, fontSize: "14px", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
                        {loading ? "Changing..." : "Change Password"}
                    </button>
                </form>
            </div>
        </div>
    );
}
