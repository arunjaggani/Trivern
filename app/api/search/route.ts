import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/search?q=query
// Role-gated parallel search across all Trivern data entities
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawRole = (session.user as any).role || "STAFF";
    const role = rawRole === "EMPLOYEE" ? "STAFF" : rawRole;

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const searches: Promise<any[]>[] = [];
    const labels: string[] = [];

    // ── LEADS ───────────────────────────────────────────────────────────────
    // ADMIN: all fields | MANAGER: name, company, status | STAFF: name only
    const leadSearch = prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: q } },
                ...(role !== "STAFF" ? [
                    { company: { contains: q } },
                    { phone: { contains: q } },
                    { service: { contains: q } },
                    { industry: { contains: q } },
                ] : []),
                ...(role === "ADMIN" ? [
                    { email: { contains: q } },
                    { context: { contains: q } },
                ] : []),
            ],
        },
        select: {
            id: true,
            name: true,
            company: true,
            phone: true,
            status: true,
            score: true,
            scoreOverride: true,
            source: true,
            createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: "desc" },
    });
    searches.push(leadSearch);
    labels.push("leads");

    // ── MEETINGS ─────────────────────────────────────────────────────────────
    // All roles can see meetings via CRM access
    const meetingSearch = prisma.meeting.findMany({
        where: {
            client: {
                name: { contains: q },
            },
        },
        select: {
            id: true,
            date: true,
            status: true,
            meetLink: true,
            duration: true,
            client: {
                select: { name: true, company: true },
            },
        },
        take: 4,
        orderBy: { date: "desc" },
    });
    searches.push(meetingSearch);
    labels.push("meetings");

    // ── CONVERSATIONS ─────────────────────────────────────────────────────────
    // All CRM roles can see conversations
    const convSearch = prisma.conversation.findMany({
        where: {
            OR: [
                { client: { name: { contains: q } } },
                { summary: { contains: q } },
            ],
        },
        select: {
            id: true,
            status: true,
            lastMessageAt: true,
            summary: true,
            client: {
                select: { name: true, phone: true },
            },
        },
        take: 4,
        orderBy: { lastMessageAt: "desc" },
    });
    searches.push(convSearch);
    labels.push("conversations");

    // ── BLOG POSTS ── ADMIN only ─────────────────────────────────────────────
    if (role === "ADMIN") {
        const blogSearch = prisma.blogPost.findMany({
            where: {
                OR: [
                    { title: { contains: q } },
                    { excerpt: { contains: q } },
                    { tags: { contains: q } },
                ],
            },
            select: {
                id: true,
                title: true,
                slug: true,
                published: true,
                publishedAt: true,
                excerpt: true,
            },
            take: 3,
            orderBy: { createdAt: "desc" },
        });
        searches.push(blogSearch);
        labels.push("blog");
    }

    // ── TEAM/USERS ── ADMIN only ─────────────────────────────────────────────
    if (role === "ADMIN") {
        const userSearch = prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q } },
                    { email: { contains: q } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            take: 3,
        });
        searches.push(userSearch);
        labels.push("team");
    }

    // Run all searches in parallel
    const rawResults = await Promise.all(searches);

    // Map into grouped result format
    const results: Record<string, any[]> = {};
    labels.forEach((label, i) => {
        results[label] = rawResults[i] || [];
    });

    // Navigation URLs per entity
    const formatted = {
        leads: results.leads?.map(l => ({
            id: l.id,
            type: "lead",
            title: l.name,
            subtitle: [l.company, l.status].filter(Boolean).join(" · "),
            badge: l.status,
            score: l.scoreOverride ?? l.score,
            href: `/dashboard/crm/leads/${l.id}`,
        })) ?? [],
        meetings: results.meetings?.map(m => ({
            id: m.id,
            type: "meeting",
            title: m.client?.name || "Unknown",
            subtitle: new Date(m.date).toLocaleString("en-IN", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                timeZone: "Asia/Kolkata",
            }),
            badge: m.status,
            href: `/dashboard/crm/bookings`,
        })) ?? [],
        conversations: results.conversations?.map(c => ({
            id: c.id,
            type: "conversation",
            title: c.client?.name || "Unknown",
            subtitle: c.summary
                ? c.summary.slice(0, 60) + (c.summary.length > 60 ? "…" : "")
                : "No summary",
            badge: c.status,
            href: `/dashboard/crm/conversations`,
        })) ?? [],
        blog: results.blog?.map(b => ({
            id: b.id,
            type: "blog",
            title: b.title,
            subtitle: b.excerpt ? b.excerpt.slice(0, 60) + "…" : "",
            badge: b.published ? "Published" : "Draft",
            href: `/dashboard/site/blog`,
        })) ?? [],
        team: results.team?.map(u => ({
            id: u.id,
            type: "team",
            title: u.name,
            subtitle: u.email,
            badge: u.role,
            href: `/dashboard/settings/team`,
        })) ?? [],
    };

    const total = Object.values(formatted).reduce((sum, arr) => sum + arr.length, 0);

    return NextResponse.json({ results: formatted, total, role });
}
