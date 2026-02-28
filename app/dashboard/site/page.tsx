import prisma from "@/lib/prisma";
import { FileText, Settings, ArrowUpRight, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

export default async function SitePage() {
    const [clientCount, bookedCount] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: "BOOKED" } }),
    ]);
    const settings = await prisma.bookingSettings.findFirst();
    const conversionRate = clientCount > 0 ? Math.round((bookedCount / clientCount) * 100) : 0;

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-white">Site Control Panel</h1><p className="text-gray-400 text-sm mt-1">Manage your website and automation</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2"><p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Conversion Rate</p><TrendingUp size={16} className="text-emerald-400" /></div>
                    <p className="text-3xl font-bold text-white">{conversionRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">{bookedCount} booked / {clientCount} leads</p>
                </div>
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2"><p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Automation</p><div className={`w-2 h-2 rounded-full ${settings?.automationOn ? "bg-emerald-400" : "bg-red-400"}`} /></div>
                    <p className="text-xl font-bold text-white">{settings?.automationOn ? "Active" : "Paused"}</p>
                    <p className="text-xs text-gray-500 mt-1">AI booking + notifications</p>
                </div>
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2"><p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Booking Window</p><Calendar size={16} className="text-cyan-400" /></div>
                    <p className="text-xl font-bold text-white">{settings?.startHour || 9}AM – {(settings?.endHour || 21) > 12 ? `${(settings?.endHour || 21) - 12}PM` : `${settings?.endHour}AM`}</p>
                    <p className="text-xs text-gray-500 mt-1">Max {settings?.maxPerDay || 6}/day · {settings?.slotDuration || 30}min slots</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { href: "/dashboard/site/content", label: "Edit Content", icon: FileText, desc: "Update page copy, services, FAQs" },
                    { href: "/dashboard/site/booking-settings", label: "Booking Settings", icon: Settings, desc: "Time window, blocked dates, holidays" },
                ].map((link) => (
                    <Link key={link.href} href={link.href} className="flex items-center gap-4 p-5 bg-white/5 border border-cyan-500/10 rounded-xl hover:border-cyan-500/25 transition-all group">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400"><link.icon size={20} /></div>
                        <div className="flex-1"><p className="text-sm font-semibold text-white">{link.label}</p><p className="text-xs text-gray-500">{link.desc}</p></div>
                        <ArrowUpRight size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
