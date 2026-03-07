"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle, Bot, Sparkles, Calendar, CheckCircle } from "lucide-react";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface Slot {
    start: string;
    formatted: string;
}

interface LeadData {
    name: string;
    phone: string;
    company: string;
}

const GREETING = "Hey there! 👋 I'm Zara, Trivern's AI Growth Consultant.\n\nWhat brings you here today — exploring something for your business?";

// Parse [READY_TO_BOOK:name=X,phone=Y,company=Z] marker from content
function extractReadyToBook(content: string): { lead: LeadData | null; cleanContent: string } {
    const match = content.match(/\[READY_TO_BOOK:([^\]]+)\]/);
    if (!match) return { lead: null, cleanContent: content };

    const params: Record<string, string> = {};
    match[1].split(",").forEach((part) => {
        const [key, ...rest] = part.split("=");
        if (key) params[key.trim()] = rest.join("=").trim();
    });

    const lead: LeadData = {
        name: params.name || "",
        phone: params.phone || "",
        company: params.company || "",
    };

    // Remove the marker line from displayed content
    const cleanContent = content.replace(/\[READY_TO_BOOK:[^\]]+\]\n?/, "").trim();
    return { lead, cleanContent };
}

export default function ZaraChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const [greeted, setGreeted] = useState(false);
    const [enabled, setEnabled] = useState<boolean | null>(null);

    // Booking flow state
    const [slots, setSlots] = useState<Slot[]>([]);
    const [leadData, setLeadData] = useState<LeadData | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingDone, setBookingDone] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const savedRef = useRef(false);

    const saveConversation = useCallback(async (msgs: ChatMessage[]) => {
        if (savedRef.current || msgs.length < 3) return;
        savedRef.current = true;
        try {
            await fetch("/api/chat/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: msgs }),
            });
        } catch { }
    }, []);

    useEffect(() => {
        const handleUnload = () => {
            if (!savedRef.current && messages.length >= 3) {
                navigator.sendBeacon("/api/chat/save", new Blob([JSON.stringify({ messages })], { type: "application/json" }));
            }
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [messages]);

    useEffect(() => {
        fetch("/api/chatbot-settings").then(r => r.json()).then(data => setEnabled(data.enabled !== false)).catch(() => setEnabled(true));
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming, slots]);
    useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

    const handleClose = () => { setOpen(false); saveConversation(messages); };

    const handleOpen = () => {
        setOpen(true);
        if (!greeted) {
            setGreeted(true);
            setMessages([{ role: "assistant", content: GREETING }]);
        }
    };

    // Fetch slots and store lead data when READY_TO_BOOK is detected
    const triggerBookingFlow = useCallback(async (lead: LeadData) => {
        setLeadData(lead);
        try {
            const res = await fetch(`/api/chat/slots?phone=${encodeURIComponent(lead.phone)}`);
            const data = await res.json();
            if (data.slots?.length > 0) {
                setSlots(data.slots);
            } else {
                setSlots([]);
            }
        } catch {
            setSlots([]);
        }
    }, []);

    // Book a selected slot
    const handleSlotSelect = async (slot: Slot) => {
        if (!leadData || bookingLoading) return;
        setBookingLoading(true);
        setSlots([]);

        try {
            const res = await fetch("/api/chat/book-web", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: leadData.name,
                    phone: leadData.phone,
                    company: leadData.company,
                    slotStart: slot.start,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setBookingDone(true);
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: data.confirmationText,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "Something went wrong with the booking. Please try again or message us directly! 🙏",
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Couldn't complete the booking right now. Please try again in a moment! 🔄",
            }]);
        }
        setBookingLoading(false);
    };

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || streaming) return;

        const userMsg: ChatMessage = { role: "user", content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput("");
        setStreaming(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!res.ok) {
                const err = await res.json();
                setMessages([...newMessages, { role: "assistant", content: err.error || "Oops — something went wrong. Try again! 🙏" }]);
                setStreaming(false);
                return;
            }

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setMessages([...newMessages, { role: "assistant", content: "" }]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                assistantContent += decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                });
            }

            // After streaming ends — check for READY_TO_BOOK marker
            const { lead, cleanContent } = extractReadyToBook(assistantContent);
            if (lead && lead.name && lead.phone) {
                // Update last message with clean content (marker removed)
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: cleanContent };
                    return updated;
                });
                await triggerBookingFlow(lead);
            }

        } catch {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "Connection issue — please try again! 🔄" };
                return updated;
            });
        }
        setStreaming(false);
    }, [input, messages, streaming, triggerBookingFlow]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    if (enabled === null || enabled === false) return null;

    return (
        <>
            <style>{`
                .zara-fab {
                    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                    width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
                    display: grid; place-items: center;
                    background: linear-gradient(135deg, #0D9488, #0F766E);
                    color: white;
                    box-shadow: 0 4px 20px rgba(13,148,136,0.4), 0 0 0 0 rgba(13,148,136,0.3);
                    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
                    animation: zara-pulse 3s ease-in-out infinite;
                }
                .zara-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(13,148,136,0.5); }
                @keyframes zara-pulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(13,148,136,0.4), 0 0 0 0 rgba(13,148,136,0.3); }
                    50% { box-shadow: 0 4px 20px rgba(13,148,136,0.4), 0 0 0 12px rgba(13,148,136,0); }
                }
                .zara-fab-label {
                    position: absolute; right: 72px; white-space: nowrap;
                    background: #0F172A; color: white; padding: 6px 14px;
                    border-radius: 8px; font-size: 13px; font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none;
                    animation: zara-label-in 0.4s ease both; animation-delay: 2s;
                }
                .zara-fab-label::after {
                    content: ''; position: absolute; right: -5px; top: 50%;
                    transform: translateY(-50%) rotate(45deg);
                    width: 10px; height: 10px; background: #0F172A;
                }
                @keyframes zara-label-in {
                    from { opacity: 0; transform: translateX(8px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .zara-panel {
                    position: fixed; bottom: 24px; right: 24px; z-index: 10000;
                    width: 380px; max-height: 580px; border-radius: 16px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1);
                    animation: zara-slide-up 0.35s cubic-bezier(0.22,1,0.36,1) both;
                    background: #FFFFFF; border: 1px solid #E8EDF2;
                }
                @keyframes zara-slide-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (max-width: 480px) {
                    .zara-panel { inset: 0; width: 100%; max-height: 100%; border-radius: 0; }
                }
                .zara-header {
                    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
                    background: linear-gradient(135deg, #0D9488, #0F766E); color: white; flex-shrink: 0;
                }
                .zara-header-avatar {
                    width: 38px; height: 38px; border-radius: 50%;
                    background: rgba(255,255,255,0.2); display: grid; place-items: center; flex-shrink: 0;
                }
                .zara-header-info { flex: 1; }
                .zara-header-name { font-size: 14px; font-weight: 700; }
                .zara-header-status { font-size: 11px; opacity: 0.85; display: flex; align-items: center; gap: 5px; }
                .zara-online-dot { width: 6px; height: 6px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 0 2px rgba(34,197,94,0.3); }
                .zara-close {
                    width: 32px; height: 32px; border-radius: 50%; border: none;
                    background: rgba(255,255,255,0.15); color: white; cursor: pointer;
                    display: grid; place-items: center; transition: background 0.2s;
                }
                .zara-close:hover { background: rgba(255,255,255,0.25); }
                .zara-messages {
                    flex: 1; overflow-y: auto; padding: 16px;
                    display: flex; flex-direction: column; gap: 8px;
                    background: #ECE5DD;
                    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d6cc' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                    min-height: 300px;
                }
                .zara-msg { display: flex; }
                .zara-msg.user { justify-content: flex-end; }
                .zara-msg.assistant { justify-content: flex-start; }
                .zara-bubble {
                    max-width: 80%; padding: 8px 12px; border-radius: 8px;
                    font-size: 13px; line-height: 1.5;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                    white-space: pre-wrap; word-wrap: break-word;
                }
                .zara-bubble.user { background: #DCF8C6; color: #0F172A; border-top-right-radius: 0; }
                .zara-bubble.assistant { background: #FFFFFF; color: #0F172A; border-top-left-radius: 0; }
                .zara-typing { display: flex; gap: 4px; padding: 12px 16px; background: #FFFFFF; border-radius: 8px; border-top-left-radius: 0; width: fit-content; box-shadow: 0 1px 1px rgba(0,0,0,0.06); }
                .zara-typing-dot { width: 7px; height: 7px; border-radius: 50%; background: #94A3B8; animation: zara-bounce 1.4s infinite ease-in-out both; }
                .zara-typing-dot:nth-child(1) { animation-delay: 0s; }
                .zara-typing-dot:nth-child(2) { animation-delay: 0.16s; }
                .zara-typing-dot:nth-child(3) { animation-delay: 0.32s; }
                @keyframes zara-bounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1); opacity: 1; }
                }

                /* Slot picker */
                .zara-slots {
                    background: #FFFFFF; border-radius: 8px; border-top-left-radius: 0;
                    padding: 12px; box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                    display: flex; flex-direction: column; gap: 8px; max-width: 90%;
                }
                .zara-slots-title {
                    font-size: 12px; font-weight: 600; color: #64748B;
                    display: flex; align-items: center; gap: 5px; margin-bottom: 2px;
                }
                .zara-slot-btn {
                    border: 1.5px solid #0D9488; border-radius: 8px; background: white;
                    color: #0D9488; font-size: 13px; font-weight: 500; padding: 8px 12px;
                    cursor: pointer; transition: all 0.2s; text-align: left;
                    display: flex; align-items: center; gap: 8px;
                }
                .zara-slot-btn:hover { background: #0D9488; color: white; transform: translateX(2px); }
                .zara-slot-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                /* Booking loading */
                .zara-booking-loading {
                    background: #FFFFFF; border-radius: 8px; border-top-left-radius: 0;
                    padding: 12px 16px; box-shadow: 0 1px 1px rgba(0,0,0,0.06);
                    font-size: 13px; color: #0D9488; display: flex; align-items: center; gap: 8px;
                }
                .zara-spinner {
                    width: 14px; height: 14px; border: 2px solid #E2E8F0;
                    border-top-color: #0D9488; border-radius: 50%;
                    animation: zara-spin 0.7s linear infinite;
                }
                @keyframes zara-spin { to { transform: rotate(360deg); } }

                .zara-input-bar {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 12px; background: #F0F2F5;
                    border-top: 1px solid #E8EDF2; flex-shrink: 0;
                }
                .zara-input {
                    flex: 1; background: #FFFFFF !important; border: 1px solid #E8EDF2 !important;
                    border-radius: 20px !important; padding: 8px 16px !important;
                    font-size: 13px !important; color: #0F172A !important;
                    outline: none !important; box-shadow: none !important;
                }
                .zara-input::placeholder { color: #94A3B8 !important; }
                .zara-input:focus { border-color: #0D9488 !important; }
                .zara-send {
                    width: 36px; height: 36px; border-radius: 50%; border: none;
                    background: #0D9488; color: white; cursor: pointer;
                    display: grid; place-items: center; transition: all 0.2s; flex-shrink: 0;
                }
                .zara-send:hover { background: #0F766E; transform: scale(1.05); }
                .zara-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
                .zara-powered {
                    text-align: center; padding: 6px; font-size: 10px; color: #94A3B8;
                    background: #F0F2F5; display: flex; align-items: center;
                    justify-content: center; gap: 4px; flex-shrink: 0;
                }
            `}</style>

            {!open && (
                <button className="zara-fab" onClick={handleOpen} aria-label="Chat with Zara">
                    <div className="zara-fab-label">Chat with Zara ✨</div>
                    <MessageCircle size={26} />
                </button>
            )}

            {open && (
                <div className="zara-panel">
                    {/* Header */}
                    <div className="zara-header">
                        <div className="zara-header-avatar"><Bot size={20} /></div>
                        <div className="zara-header-info">
                            <div className="zara-header-name">Zara</div>
                            <div className="zara-header-status">
                                <span className="zara-online-dot" /> AI Growth Consultant
                            </div>
                        </div>
                        <button className="zara-close" onClick={handleClose}><X size={16} /></button>
                    </div>

                    {/* Messages */}
                    <div className="zara-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`zara-msg ${msg.role}`}>
                                <div className={`zara-bubble ${msg.role}`}>
                                    {msg.content || (
                                        <div className="zara-typing">
                                            <div className="zara-typing-dot" />
                                            <div className="zara-typing-dot" />
                                            <div className="zara-typing-dot" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Slot picker — shown when READY_TO_BOOK detected */}
                        {slots.length > 0 && !bookingDone && (
                            <div className="zara-msg assistant">
                                <div className="zara-slots">
                                    <div className="zara-slots-title">
                                        <Calendar size={13} /> Pick a slot
                                    </div>
                                    {slots.map((slot, i) => (
                                        <button
                                            key={i}
                                            className="zara-slot-btn"
                                            onClick={() => handleSlotSelect(slot)}
                                            disabled={bookingLoading}
                                        >
                                            <Calendar size={14} />
                                            {slot.formatted}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Booking loading state */}
                        {bookingLoading && (
                            <div className="zara-msg assistant">
                                <div className="zara-booking-loading">
                                    <div className="zara-spinner" />
                                    Booking your slot...
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="zara-input-bar">
                        <input
                            ref={inputRef}
                            className="zara-input"
                            placeholder={slots.length > 0 ? "Or type to continue chatting..." : "Type a message..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={streaming || bookingLoading}
                        />
                        <button
                            className="zara-send"
                            onClick={sendMessage}
                            disabled={!input.trim() || streaming || bookingLoading}
                            aria-label="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="zara-powered">
                        <Sparkles size={10} /> Powered by Trivern AI
                    </div>
                </div>
            )}
        </>
    );
}
