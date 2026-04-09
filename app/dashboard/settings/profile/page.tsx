"use client";

import { useState } from "react";
import { User, ShieldCheck, Mail, Phone, Lock, Save, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const [saving, setSaving] = useState(false);
    
    // In a real session, this pulls from useSession() or /api/auth/session
    const [profile, setProfile] = useState({
        name: "Arun",
        email: "arun@trivern.com",
        phone: "+919000000000",
        role: "ADMIN"
    });

    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    const handleSave = async () => {
        if (passwords.new && passwords.new !== passwords.confirm) {
            alert("New passwords do not match!");
            return;
        }
        
        setSaving(true);
        // Simulated API call payload to Prisma.User update
        setTimeout(() => {
            setSaving(false);
            alert("Security Profile Updated!");
        }, 1000);
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <User className="text-pink-500" /> Identity & Access
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manage your administrative credentials and security layer.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Update Profile
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* General Info */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <ShieldCheck size={16} className="text-emerald-400" /> Basic Information
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                            <input 
                                type="text"
                                value={profile.name}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Mail size={12}/> Email Address (Login ID)</label>
                            <input 
                                type="email"
                                value={profile.email}
                                onChange={e => setProfile({...profile, email: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-gray-400 text-sm focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1"><Phone size={12}/> System WhatsApp Recognition Number</label>
                            <input 
                                type="text"
                                value={profile.phone}
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-emerald-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1 flex items-start gap-1">
                                Zara WhatsApp bot uses this exact number to identify you dynamically. If you message the bot from this number, it will grant admin-level debug feedback instead of standard paths.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Password Management */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Lock size={16} className="text-pink-400" /> Authentication
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Current Password</label>
                            <input 
                                type="password"
                                value={passwords.current}
                                onChange={e => setPasswords({...passwords, current: e.target.value})}
                                placeholder="Required for changes"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-pink-500 outline-none"
                            />
                        </div>
                        <div className="pt-2 border-t border-slate-800">
                            <label className="text-xs text-gray-400 mb-1 block">New Password</label>
                            <input 
                                type="password"
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                                className="w-full bg-black border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-pink-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Confirm New Password</label>
                            <input 
                                type="password"
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                className="w-full bg-black border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-pink-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Authority Level</h3>
                            <p className="text-xs text-gray-400 mt-1">You are classified as <span className="text-red-400 font-bold uppercase tracking-wider">{profile.role}</span>. You cannot downgrade your own privileges.</p>
                        </div>
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-bold font-mono tracking-widest">
                            MASTER_NODE
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
