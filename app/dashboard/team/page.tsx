"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    UserPlus, Shield, User, Trash2, Pencil, X, AlertTriangle,
    Loader2, Phone, Mail, Eye, EyeOff, ShieldAlert, Users as UsersIcon,
} from "lucide-react";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
}

const inputStyle = "w-full px-3 py-2.5 rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#0D9488]/25 focus:border-[#0D9488]";
const labelStyle = "block text-xs font-medium uppercase tracking-wide mb-1.5";
const cardStyle = "bg-[hsl(var(--card))] border rounded-xl shadow-[var(--shadow-xs)]";

export default function TeamPage() {
    const { data: session } = useSession();
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editMember, setEditMember] = useState<TeamMember | null>(null);
    const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const adminCount = team.filter(m => m.role === "ADMIN").length;
    const employeeCount = team.filter(m => m.role === "EMPLOYEE").length;
    const currentUserId = (session?.user as any)?.id;

    const fetchTeam = () => {
        fetch("/api/team")
            .then(r => r.json())
            .then(data => { setTeam(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { fetchTeam(); }, []);

    const showMessage = (msg: string, type: "error" | "success") => {
        if (type === "error") { setError(msg); setTimeout(() => setError(""), 4000); }
        else { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); }
    };

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const body = {
            name: fd.get("name"),
            email: fd.get("email"),
            password: fd.get("password"),
            phone: fd.get("phone"),
            role: fd.get("role"),
        };
        try {
            const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { showMessage(data.error, "error"); setSaving(false); return; }
            setShowAdd(false);
            showMessage(`${data.name} added as ${data.role}`, "success");
            fetchTeam();
        } catch { showMessage("Failed to add member", "error"); }
        setSaving(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editMember) return;
        setSaving(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const body: any = {
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone"),
            role: fd.get("role"),
        };
        const pw = fd.get("password") as string;
        if (pw) body.password = pw;
        try {
            const res = await fetch(`/api/team/${editMember.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { showMessage(data.error, "error"); setSaving(false); return; }
            setEditMember(null);
            showMessage(`${data.name} updated`, "success");
            fetchTeam();
        } catch { showMessage("Failed to update", "error"); }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteMember) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/team/${deleteMember.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) { showMessage(data.error, "error"); setSaving(false); return; }
            setDeleteMember(null);
            showMessage("Member removed", "success");
            fetchTeam();
        } catch { showMessage("Failed to delete", "error"); }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin" size={32} style={{ color: "#0D9488" }} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--dash-text))" }}>Team Management</h1>
                    <p style={{ color: "hsl(var(--dash-text-muted))" }} className="text-sm mt-1">Manage admin and employee accounts</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-[10px] text-white font-semibold transition-all hover:brightness-110"
                    style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", boxShadow: "0 4px 12px rgba(13,148,136,0.35)" }}
                >
                    <UserPlus size={16} /> Add Member
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] text-sm font-medium" style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] text-sm font-medium" style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                    ✓ {success}
                </div>
            )}

            {/* Security warning */}
            {adminCount >= 2 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] text-sm" style={{ background: "#FEF9C3", color: "#92400E", border: "1px solid #FDE68A" }}>
                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Security Notice:</strong> You have {adminCount}/3 admin accounts. For security reasons, a maximum of 3 admin accounts are allowed. Admins have full control over the dashboard, team, and all data.
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`${cardStyle} p-5`} style={{ borderColor: "var(--dash-border)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--dash-text-muted))" }}>Admins</span>
                        <div className="w-8 h-8 rounded-[10px] grid place-items-center" style={{ background: "#CCFBF1", color: "#0D9488" }}>
                            <Shield size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold" style={{ color: "hsl(var(--dash-text))" }}>
                        {adminCount}<span className="text-sm font-normal" style={{ color: "hsl(var(--dash-text-muted))" }}> / 3</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#E8EDF2] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(adminCount / 3) * 100}%`, background: adminCount >= 3 ? "#EF4444" : "#0D9488" }} />
                    </div>
                </div>
                <div className={`${cardStyle} p-5`} style={{ borderColor: "var(--dash-border)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--dash-text-muted))" }}>Employees</span>
                        <div className="w-8 h-8 rounded-[10px] grid place-items-center" style={{ background: "#DBEAFE", color: "#2563EB" }}>
                            <UsersIcon size={16} />
                        </div>
                    </div>
                    <div className="text-3xl font-bold" style={{ color: "hsl(var(--dash-text))" }}>{employeeCount}</div>
                    <p className="text-xs mt-1" style={{ color: "hsl(var(--dash-text-muted))" }}>Active members</p>
                </div>
            </div>

            {/* Team Table */}
            <div className={`${cardStyle} overflow-hidden`} style={{ borderColor: "var(--dash-border)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--dash-border)" }}>
                    <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--dash-text))" }}>Team Members</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--dash-border)" }}>
                    {team.map(member => (
                        <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--dash-hover-bg,#F0F2F5)] transition-colors">
                            <div className="w-10 h-10 rounded-full grid place-items-center text-white text-sm font-bold shrink-0"
                                style={{ background: member.role === "ADMIN" ? "linear-gradient(135deg, #0D9488, #0F766E)" : "linear-gradient(135deg, #3B82F6, #2563EB)" }}>
                                {member.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--dash-text))" }}>{member.name}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                                        background: member.role === "ADMIN" ? "#CCFBF1" : "#DBEAFE",
                                        color: member.role === "ADMIN" ? "#0D9488" : "#2563EB",
                                    }}>{member.role}</span>
                                    {member.id === currentUserId && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "#F0FDF4", color: "#16A34A" }}>You</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                        <Mail size={10} /> {member.email}
                                    </span>
                                    {member.phone && (
                                        <span className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                            <Phone size={10} /> {member.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs" style={{ color: "hsl(var(--dash-text-muted))" }}>
                                {new Date(member.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setEditMember(member)} className="p-2 rounded-lg hover:bg-[#CCFBF1] transition" style={{ color: "#0D9488" }} title="Edit">
                                    <Pencil size={14} />
                                </button>
                                {member.id !== currentUserId && (
                                    <button onClick={() => setDeleteMember(member)} className="p-2 rounded-lg hover:bg-[#FEE2E2] transition" style={{ color: "#EF4444" }} title="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Permissions info */}
            <div className={`${cardStyle} px-5 py-4`} style={{ borderColor: "var(--dash-border)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--dash-text))" }}>Role Permissions</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={14} style={{ color: "#0D9488" }} />
                            <span className="font-semibold" style={{ color: "#0D9488" }}>Admin</span>
                        </div>
                        <ul className="space-y-1" style={{ color: "hsl(var(--dash-text-muted))" }}>
                            <li>✓ Full dashboard access</li>
                            <li>✓ Manage team members</li>
                            <li>✓ Edit site content & blog</li>
                            <li>✓ Manage bookings & settings</li>
                            <li>✓ View all conversations & leads</li>
                            <li>✓ Access analytics</li>
                        </ul>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <User size={14} style={{ color: "#2563EB" }} />
                            <span className="font-semibold" style={{ color: "#2563EB" }}>Employee</span>
                        </div>
                        <ul className="space-y-1" style={{ color: "hsl(var(--dash-text-muted))" }}>
                            <li>✓ View conversations (read-only)</li>
                            <li>✓ View leads (read-only)</li>
                            <li>✓ View assigned bookings</li>
                            <li>✓ View analytics</li>
                            <li>✗ Cannot manage team</li>
                            <li>✗ Cannot edit site or settings</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ══ ADD MEMBER MODAL ══ */}
            {showAdd && (
                <Modal title="Add Team Member" onClose={() => setShowAdd(false)}>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Full Name *</label>
                            <input name="name" required className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} placeholder="John Doe" />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Email *</label>
                            <input name="email" type="email" required className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} placeholder="john@trivern.com" />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>WhatsApp Number</label>
                            <input name="phone" className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} placeholder="919876543210" />
                            <p className="text-[10px] mt-1" style={{ color: "hsl(var(--dash-text-muted))" }}>Zara uses this to recognize team members on WhatsApp</p>
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Password *</label>
                            <PasswordInput name="password" required placeholder="Minimum 6 characters" />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Role *</label>
                            <select name="role" required className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN" disabled={adminCount >= 3}>Admin {adminCount >= 3 ? "(limit reached)" : `(${adminCount}/3)`}</option>
                            </select>
                        </div>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-[10px] text-white text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50" style={{ background: "#0D9488" }}>
                            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Add Member"}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ══ EDIT MEMBER MODAL ══ */}
            {editMember && (
                <Modal title={`Edit — ${editMember.name}`} onClose={() => setEditMember(null)}>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Full Name</label>
                            <input name="name" defaultValue={editMember.name} className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Email</label>
                            <input name="email" type="email" defaultValue={editMember.email} className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>WhatsApp Number</label>
                            <input name="phone" defaultValue={editMember.phone || ""} className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }} />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>New Password (leave blank to keep current)</label>
                            <PasswordInput name="password" placeholder="Leave blank to keep" />
                        </div>
                        <div>
                            <label className={labelStyle} style={{ color: "hsl(var(--dash-text-muted))" }}>Role</label>
                            <select name="role" defaultValue={editMember.role} className={inputStyle} style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))" }}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="ADMIN" disabled={editMember.role !== "ADMIN" && adminCount >= 3}>Admin {adminCount >= 3 && editMember.role !== "ADMIN" ? "(limit)" : ""}</option>
                            </select>
                        </div>
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-[10px] text-white text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50" style={{ background: "#0D9488" }}>
                            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Changes"}
                        </button>
                    </form>
                </Modal>
            )}

            {/* ══ DELETE CONFIRM MODAL ══ */}
            {deleteMember && (
                <Modal title="Remove Team Member" onClose={() => setDeleteMember(null)}>
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 rounded-full mx-auto grid place-items-center" style={{ background: "#FEE2E2", color: "#EF4444" }}>
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-sm" style={{ color: "hsl(var(--dash-text))" }}>
                            Are you sure you want to remove <strong>{deleteMember.name}</strong>?
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--dash-text-muted))" }}>
                            This action cannot be undone. They will lose all dashboard access and Zara will no longer recognize their WhatsApp number.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteMember(null)} className="flex-1 py-2.5 rounded-[10px] text-sm font-medium border transition" style={{ borderColor: "var(--dash-border)", color: "hsl(var(--dash-text))" }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-[10px] text-white text-sm font-semibold transition hover:brightness-110 disabled:opacity-50" style={{ background: "#EF4444" }}>
                                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Remove"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ── Reusable Modal ──
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: "hsl(var(--card))" }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold" style={{ color: "hsl(var(--dash-text))" }}>{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F1F5F9] transition" style={{ color: "hsl(var(--dash-text-muted))" }}>
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ── Password Input with toggle ──
function PasswordInput({ name, required, placeholder }: { name: string; required?: boolean; placeholder?: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                name={name}
                type={show ? "text" : "password"}
                required={required}
                minLength={required ? 6 : undefined}
                className={inputStyle}
                style={{ borderColor: "var(--dash-border)", background: "var(--dash-bg)", color: "hsl(var(--dash-text))", paddingRight: 40 }}
                placeholder={placeholder}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5" style={{ color: "hsl(var(--dash-text-muted))" }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );
}
