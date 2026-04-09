"use client";

import { Activity, Webhook, Database, Share2, ServerCog, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function WorkflowCenterPage() {
    return (
        <div className="max-w-6xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Share2 className="text-cyan-400" /> Workflow Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Architecture map of n8n routing logic and webhook endpoints.</p>
                </div>
                <Link 
                    href="https://trivern.app.n8n.cloud"
                    target="_blank"
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6D5A] hover:bg-[#ff897a] text-white font-semibold rounded-lg transition-colors"
                >
                    <Webhook size={18} />
                    Open n8n Canvas
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Workflow 1: Voice Processing */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20 group">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-5 border-b border-slate-800 flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Activity className="text-cyan-400" size={18} /> LiveKit Voice Router
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Outbound & Inbound Dispatch</p>
                        </div>
                        <div className="px-2 py-1 bg-emerald-500/10 rounded text-emerald-400 text-[10px] font-bold tracking-wider">ACTIVE</div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-gray-400"><ServerCog size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-gray-300">LiveKit Cloud</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-gray-400"><Webhook size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-emerald-400 break-all">/api/voice/log</div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed border-t border-slate-800 pt-4">
                            Captures SIP signals from the voice agent script, saves recordings locally, and dumps {`{role, message}`} JSON transcripts into the VoiceCall table.
                        </p>
                    </div>
                </div>

                {/* Workflow 2: WhatsApp Conversion */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20 group">
                    <div className="bg-gradient-to-r from-emerald-500/10 to-transparent p-5 border-b border-slate-800 flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Activity className="text-emerald-400" size={18} /> WhatsApp Brain
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Meta API Follow-up Sequence</p>
                        </div>
                        <div className="px-2 py-1 bg-emerald-500/10 rounded text-emerald-400 text-[10px] font-bold tracking-wider">ACTIVE</div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-gray-400"><ServerCog size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-gray-300">WhatsApp API</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-gray-400"><Webhook size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-purple-400 break-all truncate">n8n /webhook/whatsapp</div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed border-t border-slate-800 pt-4">
                            Triggers via n8n directly. Checks the Trivern DB for existing context, generates AI reply, and pushes context back to the Conversation table.
                        </p>
                    </div>
                </div>

                {/* Workflow 3: Trivern Core Engine */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-black/20 group">
                    <div className="bg-gradient-to-r from-purple-500/10 to-transparent p-5 border-b border-slate-800 flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Database className="text-purple-400" size={18} /> Trivern Engine
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Calendar & CRM Sync</p>
                        </div>
                        <div className="px-2 py-1 bg-emerald-500/10 rounded text-emerald-400 text-[10px] font-bold tracking-wider">ACTIVE</div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-purple-400"><Database size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-gray-300">Prisma (MySQL)</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-yellow-400"><Zap size={14} /></div>
                            <ArrowRight size={14} className="text-gray-600" />
                            <div className="text-sm font-mono text-cyan-400 break-all truncate">/api/activity</div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed border-t border-slate-800 pt-4">
                            The internal Next.js API router. Triggers Lead Scoring changes, creates Timeline Events, and secures API connections.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
