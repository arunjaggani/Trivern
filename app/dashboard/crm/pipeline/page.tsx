"use client";

import { useState, useEffect } from "react";
import { Loader2, KanbanSquare, Phone, Mail, Building2, ChevronRight } from "lucide-react";

type Client = {
    id: string;
    name: string;
    company: string | null;
    status: string;
    score: number;
    phone: string;
};

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "BOOKED", "COMPLETED", "LOST"];

export default function CRMPipelinePage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItem, setDraggedItem] = useState<string | null>(null);

    const fetchPipeline = async () => {
        try {
            const res = await fetch("/api/crm");
            if (res.ok) setClients(await res.json());
        } catch (error) {
            console.error("Failed to load pipeline:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPipeline();
    }, []);

    const handleDragStart = (id: string) => {
        setDraggedItem(id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedItem) return;

        // UI Optimistic update
        setClients(prev => prev.map(c => c.id === draggedItem ? { ...c, status: newStatus } : c));
        setDraggedItem(null);

        // API Push
        try {
            await fetch("/api/crm", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: draggedItem, status: newStatus })
            });
        } catch (error) {
            console.error("Failed to sync pipeline state.");
            fetchPipeline(); // Revert on fail
        }
    };

    if (loading) return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
        if (score >= 50) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
        return "text-gray-400 bg-gray-500/10 border-gray-500/30";
    };

    return (
        <div className="space-y-8 flex flex-col h-[calc(100vh-100px)]">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <KanbanSquare className="text-pink-500" /> Sales Pipeline
                </h1>
                <p className="text-gray-400 text-sm mt-1">Drag and drop leads across conversation and qualification stages.</p>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {STAGES.map((stage) => {
                    const stageClients = clients.filter((c) => c.status === stage);
                    
                    return (
                        <div 
                            key={stage}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl min-w-[320px] flex flex-col hide-scrollbar"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                            <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center sticky top-0 rounded-t-xl z-10">
                                <h3 className="font-bold text-white text-sm">{stage}</h3>
                                <span className="bg-slate-800 text-gray-300 text-xs py-0.5 px-2 rounded-full font-mono">{stageClients.length}</span>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[200px]">
                                {stageClients.map((client) => (
                                    <div
                                        key={client.id}
                                        draggable
                                        onDragStart={() => handleDragStart(client.id)}
                                        className={`bg-slate-950 border border-slate-800 p-4 rounded-lg cursor-grab active:cursor-grabbing hover:border-cyan-500/50 transition-colors ${draggedItem === client.id ? 'opacity-50 border-dashed' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-white truncate max-w-[200px]">{client.name || 'Anonymous User'}</h4>
                                            <div className={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${getScoreColor(client.score)}`}>
                                                {client.score} PTS
                                            </div>
                                        </div>
                                        
                                        {client.company && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1.5 line-clamp-1">
                                                <Building2 size={12} /> {client.company}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
                                            <Phone size={12} /> {client.phone}
                                        </p>
                                    </div>
                                ))}
                                
                                {stageClients.length === 0 && (
                                    <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-lg opacity-50">
                                        <p className="text-xs text-slate-500 font-medium">Drop leads here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
