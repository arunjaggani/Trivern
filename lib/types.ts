// ─── Trivern Shared Types & Constants ───────────────
// Central definitions for use across API routes, n8n, and dashboard

// ─── Lead / Client ──────────────────────────────────

export const LEAD_TIERS = {
    HOT: { min: 80, label: "Hot", slotHours: 24 },
    WARM: { min: 50, label: "Warm", slotHours: 72 },
    LUKEWARM: { min: 20, label: "Lukewarm", slotHours: 120 },
    COLD: { min: 0, label: "Cold", slotHours: 168 },
} as const;

export type LeadTier = keyof typeof LEAD_TIERS;

export function getLeadTier(score: number): LeadTier {
    if (score >= 80) return "HOT";
    if (score >= 50) return "WARM";
    if (score >= 20) return "LUKEWARM";
    return "COLD";
}

export const CLIENT_STATUSES = [
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "BOOKED",
    "COMPLETED",
    "CLOSED",
    "LOST",
] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const URGENCY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const SOURCES = ["WhatsApp", "Website", "Referral", "Instagram", "Manual"] as const;
export type LeadSource = (typeof SOURCES)[number];

// ─── Meeting ────────────────────────────────────────

export const MEETING_STATUSES = [
    "SCHEDULED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "RESCHEDULED",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_ACTIONS = [
    "complete",
    "no_show",
    "cancel",
    "reschedule",
] as const;

export type MeetingAction = (typeof MEETING_ACTIONS)[number];

// ─── Notification ───────────────────────────────────

export const NOTIFICATION_TYPES = [
    "new_lead",
    "escalation",
    "booking_confirmed",
    "meeting_reminder",
    "meeting_cancelled",
    "meeting_no_show",
    "meeting_rescheduled",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ─── n8n Webhook Events ─────────────────────────────

export const N8N_EVENTS = {
    SEND_RESCHEDULE: "send_reschedule_message",
    SEND_CANCELLATION: "send_cancellation_message",
    SEND_CONFIRMATION: "send_confirmation_message",
    SEND_REMINDER: "send_reminder_message",
} as const;

// ─── Helpers ────────────────────────────────────────

export function formatSlotForWhatsApp(date: Date, timezone = "Asia/Kolkata"): string {
    return date.toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
    });
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 80);
}
