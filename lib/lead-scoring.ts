// Lead Scoring Engine — 5-Pillar 100-Point System
// Trivern Global Lead Scoring Model

export interface ScoreInput {
    // Pillar 1: Fit Score (max 20)
    isServiceBusiness: boolean;
    isTargetIndustry: boolean; // coach, clinic, consultant, real estate
    isEstablished: boolean; // not idea stage

    // Pillar 2: Pain Intensity (max 25)
    mentionsSpecificProblem: boolean;
    impactsRevenue: boolean;
    impactsOperations: boolean;
    expressesFrustration: boolean;
    mentionsFinancialLoss: boolean;

    // Pillar 3: Intent Strength (max 20)
    asksAboutProcess: boolean;
    asksAboutTimeline: boolean;
    asksAboutPricing: boolean;
    usesHighIntentLanguage: boolean;

    // Pillar 4: Authority & Readiness (max 20)
    isFounderOrOwner: boolean;
    confirmsDecisionAuthority: boolean;
    hasTeamOrRevenue: boolean;

    // Pillar 5: Engagement Behavior (max 15)
    respondsQuickly: boolean;
    providesDetailedAnswers: boolean;
    completesBookingQuickly: boolean;
}

export interface ScoreResult {
    total: number;
    fitScore: number;
    painScore: number;
    intentScore: number;
    authorityScore: number;
    engagementScore: number;
    category: "HOT" | "WARM" | "LUKEWARM" | "COLD" | "DISQUALIFIED";
    label: string;
    bonusApplied: boolean;
}

// Escalation trigger keywords
export const ESCALATION_SIGNALS = [
    "large budget",
    "high budget",
    "big investment",
    "scaling",
    "expanding",
    "multiple locations",
    "multi-location",
    "branches",
    "franchise",
    "partnership",
    "white label",
    "white-label",
    "enterprise",
    "corporate",
];

export function calculateLeadScore(input: ScoreInput): ScoreResult {
    // Pillar 1: Fit Score (max 20)
    let fitScore = 0;
    if (input.isServiceBusiness) fitScore += 10;
    if (input.isTargetIndustry) fitScore += 5;
    if (input.isEstablished) fitScore += 5;

    // Pillar 2: Pain Intensity (max 25)
    let painScore = 0;
    if (input.mentionsSpecificProblem) painScore += 5;
    if (input.impactsRevenue) painScore += 5;
    if (input.impactsOperations) painScore += 5;
    if (input.expressesFrustration) painScore += 5;
    if (input.mentionsFinancialLoss) painScore += 5;

    // Pillar 3: Intent Strength (max 20)
    let intentScore = 0;
    if (input.asksAboutProcess) intentScore += 5;
    if (input.asksAboutTimeline) intentScore += 5;
    if (input.asksAboutPricing) intentScore += 5;
    if (input.usesHighIntentLanguage) intentScore += 5;

    // Pillar 4: Authority & Readiness (max 20)
    let authorityScore = 0;
    if (input.isFounderOrOwner) authorityScore += 10;
    if (input.confirmsDecisionAuthority) authorityScore += 5;
    if (input.hasTeamOrRevenue) authorityScore += 5;

    // Pillar 5: Engagement Behavior (max 15)
    let engagementScore = 0;
    if (input.respondsQuickly) engagementScore += 5;
    if (input.providesDetailedAnswers) engagementScore += 5;
    if (input.completesBookingQuickly) engagementScore += 5;

    // Multiplier Bonus: Pain >= 20 AND Intent >= 15 → +5
    let bonusApplied = false;
    let bonus = 0;
    if (painScore >= 20 && intentScore >= 15) {
        bonus = 5;
        bonusApplied = true;
    }

    const total = fitScore + painScore + intentScore + authorityScore + engagementScore + bonus;

    // Category
    let category: ScoreResult["category"];
    let label: string;
    if (total >= 80) {
        category = "HOT";
        label = "🔥 HOT";
    } else if (total >= 60) {
        category = "WARM";
        label = "🟡 WARM";
    } else if (total >= 40) {
        category = "LUKEWARM";
        label = "🔵 LUKEWARM";
    } else if (total >= 20) {
        category = "COLD";
        label = "⚪ COLD";
    } else {
        category = "DISQUALIFIED";
        label = "❌ DISQUALIFIED";
    }

    return {
        total: Math.min(total, 100),
        fitScore,
        painScore,
        intentScore,
        authorityScore,
        engagementScore,
        category,
        label,
        bonusApplied,
    };
}

export function shouldEscalate(conversationText: string): {
    escalate: boolean;
    reasons: string[];
} {
    const lower = conversationText.toLowerCase();
    const reasons: string[] = [];

    if (lower.includes("large budget") || lower.includes("high budget") || lower.includes("big investment")) {
        reasons.push("💰 Large budget / high-ticket investment");
    }
    if (lower.includes("scaling") || lower.includes("expanding") || lower.includes("growing fast")) {
        reasons.push("📈 Aggressively scaling operations");
    }
    if (lower.includes("multiple location") || lower.includes("multi-location") || lower.includes("branches") || lower.includes("franchise")) {
        reasons.push("🏢 Multi-location / multi-branch business");
    }
    if (lower.includes("partnership") || lower.includes("white label") || lower.includes("white-label")) {
        reasons.push("🤝 Strategic partnership / white-label interest");
    }
    if (lower.includes("enterprise") || lower.includes("corporate")) {
        reasons.push("🌍 Enterprise-level requirements");
    }

    return { escalate: reasons.length > 0, reasons };
}

// ─── Convenience wrapper for n8n API ─────────────────
// Takes simple string data from Zara and converts to boolean ScoreInput
interface LeadData {
    service?: string;
    context?: string;
    budgetHint?: string;
    urgency?: string;
    businessType?: string;
    decisionRole?: string;
    industry?: string;
}

const TARGET_INDUSTRIES = ["coach", "consult", "clinic", "real estate", "salon", "gym", "yoga", "dental", "legal", "wellness"];

export function scoreLead(data: LeadData): {
    score: number;
    fitScore: number;
    painScore: number;
    intentScore: number;
    authorityScore: number;
    engagementScore: number;
} {
    const ctx = (data.context || "").toLowerCase();
    const svc = (data.service || "").toLowerCase();
    const ind = (data.industry || "").toLowerCase();
    const role = (data.decisionRole || "").toLowerCase();
    const biz = (data.businessType || "").toLowerCase();

    const input: ScoreInput = {
        // Pillar 1: Fit
        isServiceBusiness: biz.includes("service") || !biz.includes("product"),
        isTargetIndustry: TARGET_INDUSTRIES.some((t) => ind.includes(t) || biz.includes(t)),
        isEstablished: !ctx.includes("idea stage") && !ctx.includes("just starting"),

        // Pillar 2: Pain
        mentionsSpecificProblem: ctx.length > 20,
        impactsRevenue: /revenue|sales|leads|clients|customers|money|income/i.test(ctx),
        impactsOperations: /manual|slow|inefficient|chaos|messy|overwhelm/i.test(ctx),
        expressesFrustration: /frustrat|tired|sick of|fed up|struggling|pain/i.test(ctx),
        mentionsFinancialLoss: /losing|wasting|cost|expensive|bleeding/i.test(ctx),

        // Pillar 3: Intent
        asksAboutProcess: /how|process|steps|what happens/i.test(ctx + svc),
        asksAboutTimeline: /when|timeline|how long|deadline|urgent/i.test(ctx + svc),
        asksAboutPricing: /price|cost|budget|invest|afford/i.test(ctx + svc + (data.budgetHint || "")),
        usesHighIntentLanguage: /need|want|looking for|ready|asap|now/i.test(ctx + svc),

        // Pillar 4: Authority
        isFounderOrOwner: /founder|owner|ceo|director|managing/i.test(role),
        confirmsDecisionAuthority: /decision|authority|I decide|my call/i.test(role + ctx),
        hasTeamOrRevenue: /team|employees|staff|revenue|turnover/i.test(ctx),

        // Pillar 5: Engagement
        respondsQuickly: data.urgency === "HIGH" || data.urgency === "CRITICAL",
        providesDetailedAnswers: ctx.length > 50,
        completesBookingQuickly: false, // Not known at capture time
    };

    const result = calculateLeadScore(input);

    return {
        score: result.total,
        fitScore: result.fitScore,
        painScore: result.painScore,
        intentScore: result.intentScore,
        authorityScore: result.authorityScore,
        engagementScore: result.engagementScore,
    };
}
