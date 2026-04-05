import prisma from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────
export type ActivityType =
    | "STATUS_CHANGE"
    | "CALL_STARTED"
    | "CALL_ENDED"
    | "MEETING_BOOKED"
    | "MEETING_COMPLETED"
    | "LEAD_SCORED"
    | "ESCALATED"
    | "NOTE_ADDED"
    | "LEAD_CAPTURED";

export type ActivityChannel = "VOICE" | "CHAT" | "MANUAL" | "SYSTEM";

export interface LogActivityInput {
    clientId: string;
    type: ActivityType;
    channel: ActivityChannel;
    title: string;
    detail?: string;
    meetingId?: string;
    voiceCallId?: string;
    conversationId?: string;
    fromStatus?: string;
    toStatus?: string;
    scoreAtEvent?: number;
    triggeredBy?: string;
}

// ── Core logger ───────────────────────────────────────────────────────────────
// Fire-and-forget safe — errors are swallowed so they never break the main flow
export async function logActivity(input: LogActivityInput): Promise<void> {
    try {
        await prisma.leadActivity.create({
            data: {
                clientId: input.clientId,
                type: input.type,
                channel: input.channel,
                title: input.title,
                detail: input.detail ?? null,
                meetingId: input.meetingId ?? null,
                voiceCallId: input.voiceCallId ?? null,
                conversationId: input.conversationId ?? null,
                fromStatus: input.fromStatus ?? null,
                toStatus: input.toStatus ?? null,
                scoreAtEvent: input.scoreAtEvent ?? null,
                triggeredBy: input.triggeredBy ?? "SYSTEM",
            },
        });
    } catch (err) {
        // Non-fatal — log to console but never crash the parent request
        console.warn("[LeadActivity] Failed to write activity:", err);
    }
}

// ── Channel config for UI rendering ─────────────────────────────────────────
export const CHANNEL_CONFIG: Record<ActivityChannel, { label: string; emoji: string; color: string }> = {
    VOICE:  { label: "Voice",  emoji: "🎙️", color: "text-cyan-400"   },
    CHAT:   { label: "Chat",   emoji: "💬", color: "text-blue-400"   },
    MANUAL: { label: "Manual", emoji: "✏️", color: "text-yellow-400" },
    SYSTEM: { label: "System", emoji: "⚙️", color: "text-gray-400"   },
};

export const TYPE_CONFIG: Record<ActivityType, { label: string; icon: string }> = {
    STATUS_CHANGE:       { label: "Status changed",    icon: "🔄" },
    CALL_STARTED:        { label: "Call started",      icon: "📞" },
    CALL_ENDED:          { label: "Call completed",    icon: "📵" },
    MEETING_BOOKED:      { label: "Meeting booked",    icon: "📅" },
    MEETING_COMPLETED:   { label: "Meeting completed", icon: "✅" },
    LEAD_SCORED:         { label: "Lead scored",       icon: "📊" },
    ESCALATED:           { label: "Escalated",         icon: "🚨" },
    NOTE_ADDED:          { label: "Note added",        icon: "📝" },
    LEAD_CAPTURED:       { label: "Lead captured",     icon: "🎯" },
};
