import prisma from "@/lib/prisma";
import { Mail, Phone, Download } from "lucide-react";

export default async function ContactsPage() {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });

    function ScoreBadge({ score }: { score: number }) {
        if (score >= 80) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">HOT</span>;
        if (score >= 60) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 font-medium">WARM</span>;
        if (score >= 40) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-medium">LUKEWARM</span>;
        if (score >= 20) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-400 font-medium">COLD</span>;
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/20 text-gray-500 font-medium">DQ</span>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Contacts & Email List</h1>
                    <p className="text-gray-400 text-sm mt-1">{clients.length} contacts</p>
                </div>
                <a href="/api/contacts/export" className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all">
                    <Download size={14} />Export CSV
                </a>
            </div>

            <div className="bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-cyan-500/10 text-left">
                                {["Name", "Email", "Phone", "Source", "Status", "Score", "Date"].map((h) => (
                                    <th key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-500/5">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">{client.name[0]}</div>
                                            <div><p className="text-sm text-white font-medium">{client.name}</p><p className="text-[10px] text-gray-500">{client.company || "—"}</p></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">{client.email ? <span className="text-xs text-gray-300 flex items-center gap-1"><Mail size={10} className="text-gray-500" /> {client.email}</span> : <span className="text-xs text-gray-600">—</span>}</td>
                                    <td className="px-5 py-3"><span className="text-xs text-gray-300 flex items-center gap-1"><Phone size={10} className="text-gray-500" /> {client.phone}</span></td>
                                    <td className="px-5 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">{client.source || "—"}</span></td>
                                    <td className="px-5 py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${client.status === "BOOKED" ? "bg-emerald-500/15 text-emerald-400" :
                                                client.status === "CONTACTED" ? "bg-purple-500/15 text-purple-400" :
                                                    client.status === "CLOSED" ? "bg-green-500/15 text-green-400" :
                                                        client.status === "LOST" ? "bg-red-500/15 text-red-400" :
                                                            "bg-cyan-500/15 text-cyan-400"
                                            }`}>{client.status}</span>
                                    </td>
                                    <td className="px-5 py-3"><ScoreBadge score={client.scoreOverride ?? client.score} /></td>
                                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
