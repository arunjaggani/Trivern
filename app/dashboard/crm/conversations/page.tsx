"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Search, Bot, Clock, CheckCheck } from "lucide-react";

interface Message {
    role: string;
    content: string;
    timestamp?: string;
}

interface Conversation {
    id: string;
    messages: string;
    summary: string | null;
    status: string;
    lastMessageAt: string;
    client: {
        id: string;
        name: string;
        phone: string;
        company: string | null;
    };
}

export default function ConversationsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/conversations")
            .then(r => r.json())
            .then(data => {
                setConversations(data);
                if (data.length > 0) setSelectedId(data[0].id);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const selected = conversations.find(c => c.id === selectedId);
    const messages: Message[] = selected ? JSON.parse(selected.messages as string) : [];

    const filtered = conversations.filter(c =>
        c.client.name.toLowerCase().includes(search.toLowerCase()) ||
        c.client.phone.includes(search)
    );

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedId]);

    const formatTime = (ts: string) => {
        try {
            return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        } catch { return ""; }
    };

    const formatDate = (ts: string) => {
        try {
            const d = new Date(ts);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) return "Today";
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
            return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        } catch { return ""; }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="wa-container">
            <style>{`
                .wa-container {
                    display: flex;
                    height: calc(100vh - 6rem);
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--dash-border, #E8EDF2);
                    box-shadow: 0 1px 4px rgba(15,23,42,0.06), 0 2px 12px rgba(15,23,42,0.04);
                    background: var(--wa-sidebar-bg);
                }

                /* Light mode (default for dashboard) */
                .wa-container {
                    --wa-sidebar-bg: #FFFFFF;
                    --wa-sidebar-border: #E8EDF2;
                    --wa-search-bg: #F0F2F5;
                    --wa-search-text: #0F172A;
                    --wa-search-placeholder: #94A3B8;
                    --wa-contact-hover: #F0F2F5;
                    --wa-contact-active: #F0F9F4;
                    --wa-contact-name: #0F172A;
                    --wa-contact-msg: #64748B;
                    --wa-contact-time: #94A3B8;
                    --wa-contact-border: #F1F5F9;
                    --wa-header-bg: #F0F2F5;
                    --wa-header-text: #0F172A;
                    --wa-header-sub: #64748B;
                    --wa-chat-bg: #ECE5DD;
                    --wa-chat-pattern: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d6cc' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    --wa-bubble-sent: #DCF8C6;
                    --wa-bubble-sent-text: #0F172A;
                    --wa-bubble-recv: #FFFFFF;
                    --wa-bubble-recv-text: #0F172A;
                    --wa-bubble-time: #64748B;
                    --wa-bubble-tick: #53BDEB;
                    --wa-date-badge-bg: #E2F0EB;
                    --wa-date-badge-text: #0F172A;
                    --wa-input-bg: #F0F2F5;
                    --wa-input-border: #E8EDF2;
                    --wa-empty-text: #64748B;
                    --wa-summary-bg: #F0FDF4;
                    --wa-summary-border: #BBF7D0;
                    --wa-summary-text: #166534;
                    --wa-bot-badge: #0D9488;
                    --wa-status-dot: #22C55E;
                }

                /* Dark mode overrides */
                [data-theme="dark"] .wa-container {
                    --wa-sidebar-bg: #111B21;
                    --wa-sidebar-border: #222D34;
                    --wa-search-bg: #202C33;
                    --wa-search-text: #E9EDEF;
                    --wa-search-placeholder: #8696A0;
                    --wa-contact-hover: #202C33;
                    --wa-contact-active: #2A3942;
                    --wa-contact-name: #E9EDEF;
                    --wa-contact-msg: #8696A0;
                    --wa-contact-time: #8696A0;
                    --wa-contact-border: #222D34;
                    --wa-header-bg: #202C33;
                    --wa-header-text: #E9EDEF;
                    --wa-header-sub: #8696A0;
                    --wa-chat-bg: #0B141A;
                    --wa-chat-pattern: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222D34' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    --wa-bubble-sent: #005C4B;
                    --wa-bubble-sent-text: #E9EDEF;
                    --wa-bubble-recv: #202C33;
                    --wa-bubble-recv-text: #E9EDEF;
                    --wa-bubble-time: #8696A0;
                    --wa-bubble-tick: #53BDEB;
                    --wa-date-badge-bg: #182229;
                    --wa-date-badge-text: #8696A0;
                    --wa-input-bg: #202C33;
                    --wa-input-border: #2A3942;
                    --wa-empty-text: #8696A0;
                    --wa-summary-bg: rgba(13,148,136,0.1);
                    --wa-summary-border: rgba(13,148,136,0.2);
                    --wa-summary-text: #5EEAD4;
                    --wa-bot-badge: #5EEAD4;
                    --wa-status-dot: #22C55E;
                }

                /* Sidebar */
                .wa-sidebar {
                    width: 340px;
                    min-width: 340px;
                    border-right: 1px solid var(--wa-sidebar-border);
                    display: flex;
                    flex-direction: column;
                    background: var(--wa-sidebar-bg);
                }

                .wa-sidebar-header {
                    padding: 12px 16px;
                    background: var(--wa-header-bg);
                    border-bottom: 1px solid var(--wa-sidebar-border);
                }

                .wa-sidebar-header h2 {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--wa-header-text);
                    margin-bottom: 10px;
                }

                .wa-search {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: var(--wa-search-bg);
                    border-radius: 8px;
                    padding: 0 12px;
                }

                .wa-search input {
                    flex: 1;
                    background: transparent !important;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    font-size: 13px;
                    padding: 8px 0;
                    color: var(--wa-search-text) !important;
                }

                .wa-search input::placeholder { color: var(--wa-search-placeholder) !important; }
                .wa-search svg { color: var(--wa-search-placeholder); flex-shrink: 0; }

                .wa-contact-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .wa-contact {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.15s;
                    border-bottom: 1px solid var(--wa-contact-border);
                    text-decoration: none;
                }

                .wa-contact:hover { background: var(--wa-contact-hover); }
                .wa-contact.active { background: var(--wa-contact-active); }

                .wa-avatar {
                    width: 42px; height: 42px;
                    border-radius: 50%;
                    display: grid; place-items: center;
                    font-weight: 700; font-size: 15px;
                    flex-shrink: 0;
                    color: white;
                    background: linear-gradient(135deg, #0D9488, #0F766E);
                }

                .wa-contact-info { flex: 1; min-width: 0; }
                .wa-contact-name {
                    font-size: 14px; font-weight: 500;
                    color: var(--wa-contact-name);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .wa-contact-preview {
                    font-size: 12px;
                    color: var(--wa-contact-msg);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    margin-top: 2px;
                }
                .wa-contact-meta {
                    text-align: right; flex-shrink: 0;
                }
                .wa-contact-time {
                    font-size: 11px;
                    color: var(--wa-contact-time);
                }
                .wa-contact-status {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: var(--wa-status-dot);
                    margin-left: auto; margin-top: 4px;
                }

                /* Chat panel */
                .wa-chat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--wa-chat-bg);
                    background-image: var(--wa-chat-pattern);
                }

                .wa-chat-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    background: var(--wa-header-bg);
                    border-bottom: 1px solid var(--wa-sidebar-border);
                }

                .wa-chat-header-name { font-size: 14px; font-weight: 600; color: var(--wa-header-text); }
                .wa-chat-header-sub { font-size: 11px; color: var(--wa-header-sub); }

                .wa-messages {
                    flex: 1; overflow-y: auto;
                    padding: 12px 48px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .wa-date-divider {
                    text-align: center;
                    margin: 8px 0;
                }

                .wa-date-badge {
                    display: inline-block;
                    background: var(--wa-date-badge-bg);
                    color: var(--wa-date-badge-text);
                    font-size: 11px;
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-weight: 500;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
                }

                .wa-msg-row {
                    display: flex;
                }
                .wa-msg-row.sent { justify-content: flex-end; }
                .wa-msg-row.recv { justify-content: flex-start; }

                .wa-bubble {
                    max-width: 65%;
                    padding: 6px 8px 4px;
                    border-radius: 8px;
                    font-size: 13px;
                    line-height: 1.4;
                    position: relative;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                }

                .wa-bubble.sent {
                    background: var(--wa-bubble-sent);
                    color: var(--wa-bubble-sent-text);
                    border-top-right-radius: 0;
                }

                .wa-bubble.recv {
                    background: var(--wa-bubble-recv);
                    color: var(--wa-bubble-recv-text);
                    border-top-left-radius: 0;
                }

                .wa-bubble p { margin: 0; white-space: pre-wrap; word-wrap: break-word; }

                .wa-bubble-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 3px;
                    margin-top: 2px;
                }

                .wa-bubble-time {
                    font-size: 10px;
                    color: var(--wa-bubble-time);
                }

                .wa-tick { color: var(--wa-bubble-tick); }

                .wa-bot-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 10px;
                    color: var(--wa-bot-badge);
                    font-weight: 600;
                    margin-bottom: 2px;
                }

                /* Summary bar */
                .wa-summary {
                    padding: 8px 16px;
                    background: var(--wa-summary-bg);
                    border-top: 1px solid var(--wa-summary-border);
                    font-size: 12px;
                    color: var(--wa-summary-text);
                }
                .wa-summary-label {
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 2px;
                    opacity: 0.7;
                }

                /* Input bar (future manual messaging) */
                .wa-input-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: var(--wa-header-bg);
                    border-top: 1px solid var(--wa-sidebar-border);
                }

                .wa-input-bar input {
                    flex: 1;
                    background: var(--wa-input-bg) !important;
                    border: 1px solid var(--wa-input-border) !important;
                    border-radius: 8px;
                    padding: 8px 14px;
                    font-size: 13px;
                    color: var(--wa-search-text) !important;
                    outline: none !important;
                    box-shadow: none !important;
                }
                .wa-input-bar input::placeholder { color: var(--wa-search-placeholder) !important; }

                .wa-send-btn {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: #0D9488;
                    border: none;
                    display: grid; place-items: center;
                    cursor: not-allowed;
                    opacity: 0.5;
                    color: white;
                }

                .wa-empty {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 12px;
                    color: var(--wa-empty-text);
                    background: var(--wa-header-bg);
                }

                .wa-empty svg { opacity: 0.3; }
            `}</style>

            {/* Left: Contact list */}
            <div className="wa-sidebar">
                <div className="wa-sidebar-header">
                    <h2>Conversations</h2>
                    <div className="wa-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Search or start a new chat"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="wa-contact-list">
                    {filtered.map(conv => {
                        const msgs: Message[] = JSON.parse(conv.messages);
                        const lastMsg = msgs[msgs.length - 1];
                        return (
                            <div
                                key={conv.id}
                                className={`wa-contact ${conv.id === selectedId ? "active" : ""}`}
                                onClick={() => setSelectedId(conv.id)}
                            >
                                <div className="wa-avatar">{conv.client.name[0]}</div>
                                <div className="wa-contact-info">
                                    <div className="wa-contact-name">{conv.client.name}</div>
                                    <div className="wa-contact-preview">
                                        {lastMsg?.role === "agent" ? "🤖 " : ""}
                                        {lastMsg?.content?.substring(0, 55) || "No messages"}
                                    </div>
                                </div>
                                <div className="wa-contact-meta">
                                    <div className="wa-contact-time">{formatTime(conv.lastMessageAt)}</div>
                                    {conv.status === "active" && <div className="wa-contact-status" />}
                                </div>
                            </div>
                        );
                    })}
                    {filtered.length === 0 && (
                        <div style={{ padding: 32, textAlign: "center", color: "var(--wa-empty-text)", fontSize: 13 }}>
                            No conversations found
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Chat panel */}
            {selected ? (
                <div className="wa-chat">
                    {/* Chat header */}
                    <div className="wa-chat-header">
                        <div className="wa-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{selected.client.name[0]}</div>
                        <div>
                            <div className="wa-chat-header-name">{selected.client.name}</div>
                            <div className="wa-chat-header-sub">{selected.client.phone}</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="wa-messages">
                        {messages.map((msg, i) => {
                            const isAgent = msg.role === "agent";
                            // Show date divider
                            let showDate = false;
                            if (msg.timestamp) {
                                if (i === 0) showDate = true;
                                else if (messages[i - 1]?.timestamp) {
                                    const prev = new Date(messages[i - 1].timestamp!).toDateString();
                                    const curr = new Date(msg.timestamp).toDateString();
                                    if (prev !== curr) showDate = true;
                                }
                            }

                            return (
                                <div key={i}>
                                    {showDate && msg.timestamp && (
                                        <div className="wa-date-divider">
                                            <span className="wa-date-badge">{formatDate(msg.timestamp)}</span>
                                        </div>
                                    )}
                                    <div className={`wa-msg-row ${isAgent ? "recv" : "sent"}`}>
                                        <div className={`wa-bubble ${isAgent ? "recv" : "sent"}`}>
                                            {isAgent && (
                                                <div className="wa-bot-tag">
                                                    <Bot size={10} /> Zara (AI)
                                                </div>
                                            )}
                                            <p>{msg.content}</p>
                                            <div className="wa-bubble-footer">
                                                <span className="wa-bubble-time">
                                                    {msg.timestamp ? formatTime(msg.timestamp) : ""}
                                                </span>
                                                {!isAgent && <CheckCheck size={14} className="wa-tick" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* AI Summary */}
                    {selected.summary && (
                        <div className="wa-summary">
                            <div className="wa-summary-label">AI Summary</div>
                            <div>{selected.summary}</div>
                        </div>
                    )}

                    {/* Input bar — disabled for now, ready for future manual messaging */}
                    <div className="wa-input-bar">
                        <input type="text" placeholder="Type a message (coming soon)" disabled />
                        <button className="wa-send-btn" disabled title="Manual messaging coming soon">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="wa-empty">
                    <MessageSquare size={64} />
                    <div style={{ fontSize: 18, fontWeight: 600 }}>WhatsApp Simulator</div>
                    <div style={{ fontSize: 13 }}>Select a conversation to view messages</div>
                </div>
            )}
        </div>
    );
}
