import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, UserCircle, Clock, Phone, Building2, CheckCheck } from "lucide-react";

export default async function ConversationDetailPage({ params }: { params: { id: string } }) {
    const conversation = await prisma.conversation.findUnique({
        where: { id: params.id },
        include: { client: true },
    });

    if (!conversation) return notFound();

    const messages = JSON.parse(conversation.messages as string);

    const formatTime = (ts: string) => {
        try {
            return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        } catch { return ""; }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <style>{`
                .wa-detail { font-family: inherit; }
                .wa-detail-chat {
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--dash-border, #E8EDF2);
                    box-shadow: 0 1px 4px rgba(15,23,42,0.06), 0 2px 12px rgba(15,23,42,0.04);
                }
                .wa-detail-header {
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 16px;
                    background: var(--wa-d-header, #F0F2F5);
                    border-bottom: 1px solid var(--dash-border, #E8EDF2);
                }
                [data-theme="dark"] .wa-detail-header { --wa-d-header: #202C33; }
                .wa-detail-messages {
                    padding: 16px 48px;
                    min-height: 400px;
                    max-height: calc(100vh - 16rem);
                    overflow-y: auto;
                    display: flex; flex-direction: column; gap: 3px;
                    background-color: #ECE5DD;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d6cc' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                [data-theme="dark"] .wa-detail-messages {
                    background-color: #0B141A;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222D34' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                }
                .wa-d-row { display: flex; }
                .wa-d-row.sent { justify-content: flex-end; }
                .wa-d-row.recv { justify-content: flex-start; }
                .wa-d-bubble {
                    max-width: 65%; padding: 6px 8px 4px;
                    border-radius: 8px; font-size: 13px; line-height: 1.4;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                }
                .wa-d-bubble.sent {
                    background: #DCF8C6; color: #0F172A;
                    border-top-right-radius: 0;
                }
                [data-theme="dark"] .wa-d-bubble.sent { background: #005C4B; color: #E9EDEF; }
                .wa-d-bubble.recv {
                    background: #FFFFFF; color: #0F172A;
                    border-top-left-radius: 0;
                }
                [data-theme="dark"] .wa-d-bubble.recv { background: #202C33; color: #E9EDEF; }
                .wa-d-bubble p { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
                .wa-d-footer { display: flex; align-items: center; justify-content: flex-end; gap: 3px; margin-top: 2px; }
                .wa-d-time { font-size: 10px; color: #64748B; }
                [data-theme="dark"] .wa-d-time { color: #8696A0; }
                .wa-d-tick { color: #53BDEB; }
                .wa-d-bot { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: #0D9488; font-weight: 600; margin-bottom: 2px; }
                [data-theme="dark"] .wa-d-bot { color: #5EEAD4; }
                .wa-d-summary {
                    padding: 8px 16px;
                    background: #F0FDF4; border-top: 1px solid #BBF7D0;
                    font-size: 12px; color: #166534;
                }
                [data-theme="dark"] .wa-d-summary {
                    background: rgba(13,148,136,0.1); border-color: rgba(13,148,136,0.2); color: #5EEAD4;
                }
                .wa-d-summary-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; opacity: 0.7; }
            `}</style>

            <div className="wa-detail space-y-4">
                {/* Back + header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/crm/conversations" className="p-2 rounded-lg transition" style={{ color: "var(--wa-contact-msg, #64748B)" }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-3 flex-1">
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #0D9488, #0F766E)", display: "grid", placeItems: "center", color: "white", fontWeight: 700 }}>
                            {conversation.client.name[0]}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: "var(--wa-contact-name, #0F172A)" }}>{conversation.client.name}</h1>
                            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--wa-contact-msg, #64748B)" }}>
                                {conversation.client.company && <span className="flex items-center gap-1"><Building2 size={10} /> {conversation.client.company}</span>}
                                <span className="flex items-center gap-1"><Phone size={10} /> {conversation.client.phone}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{
                                    background: conversation.status === "active" ? "#DCFCE7" : "#F1F5F9",
                                    color: conversation.status === "active" ? "#16A34A" : "#64748B"
                                }}>{conversation.status}</span>
                            </div>
                        </div>
                    </div>
                    <Link href={`/dashboard/crm/leads/${conversation.clientId}`} className="text-xs font-medium" style={{ color: "#0D9488" }}>View Lead →</Link>
                </div>

                {/* Chat */}
                <div className="wa-detail-chat">
                    <div className="wa-detail-messages">
                        {messages.map((msg: any, i: number) => {
                            const isAgent = msg.role === "agent";
                            return (
                                <div key={i} className={`wa-d-row ${isAgent ? "recv" : "sent"}`}>
                                    <div className={`wa-d-bubble ${isAgent ? "recv" : "sent"}`}>
                                        {isAgent && (
                                            <div className="wa-d-bot">
                                                <Bot size={10} /> Zara (AI)
                                            </div>
                                        )}
                                        <p>{msg.content}</p>
                                        <div className="wa-d-footer">
                                            <span className="wa-d-time">
                                                {msg.timestamp ? formatTime(msg.timestamp) : ""}
                                            </span>
                                            {!isAgent && <CheckCheck size={14} className="wa-d-tick" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {conversation.summary && (
                        <div className="wa-d-summary">
                            <div className="wa-d-summary-label">AI Summary</div>
                            <div>{conversation.summary}</div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs px-2" style={{ color: "var(--wa-contact-msg, #64748B)" }}>
                    <span>{messages.length} messages</span>
                    <span>Last: {new Date(conversation.lastMessageAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
            </div>
        </div>
    );
}
