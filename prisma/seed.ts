import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
        where: { email: "admin@trivern.com" },
        update: {},
        create: {
            email: "admin@trivern.com",
            passwordHash: adminPassword,
            name: "Arun",
            role: "ADMIN",
        },
    });

    // Create employee user
    const empPassword = await bcrypt.hash("employee123", 12);
    await prisma.user.upsert({
        where: { email: "employee@trivern.com" },
        update: {},
        create: {
            email: "employee@trivern.com",
            passwordHash: empPassword,
            name: "Team Member",
            role: "EMPLOYEE",
        },
    });

    // Create default booking settings
    const existing = await prisma.bookingSettings.findFirst();
    if (!existing) {
        await prisma.bookingSettings.create({
            data: {
                startHour: 9,
                endHour: 21,
                slotDuration: 30,
                bufferMinutes: 30,
                maxPerDay: 6,
                blockedDates: "[]",
                holidays: "[]",
                automationOn: true,
            },
        });
    }

    // Seed some sample clients for dashboard demo
    const sampleClients = [
        {
            name: "Adi Narayana",
            company: "Shivam Construction",
            phone: "+919554321098",
            email: "adi@shivam.com",
            service: "Build a professional website",
            context: "Construction company looking for a portfolio-led site to showcase projects",
            source: "WhatsApp",
            status: "BOOKED",
            score: 78,
            fitScore: 15,
            painScore: 20,
            intentScore: 15,
            authorityScore: 18,
            engagementScore: 10,
            industry: "Construction",
            businessType: "Service Business",
            decisionRole: "Owner",
            urgency: "HIGH",
        },
        {
            name: "Priya Sharma",
            company: "Harmony Yoga Studio",
            phone: "+919876543210",
            email: "priya@harmonyyoga.com",
            service: "Website + Booking System",
            context: "Yoga studio owner looking for class booking and lead capture",
            source: "WhatsApp",
            status: "CONTACTED",
            score: 62,
            fitScore: 20,
            painScore: 15,
            intentScore: 12,
            authorityScore: 10,
            engagementScore: 5,
            industry: "Health & Wellness",
            businessType: "Service Business",
            decisionRole: "Founder",
            urgency: "MEDIUM",
        },
        {
            name: "Rajesh Gupta",
            company: "Gupta Legal Associates",
            phone: "+919123456789",
            service: "SEO + Lead Generation",
            context: "Law firm wanting more online leads",
            source: "Website",
            status: "NEW",
            score: 35,
            fitScore: 10,
            painScore: 10,
            intentScore: 5,
            authorityScore: 5,
            engagementScore: 5,
            industry: "Legal",
            businessType: "Service Business",
            decisionRole: "Partner",
            urgency: "LOW",
        },
    ];

    for (const client of sampleClients) {
        await prisma.client.create({ data: client });
    }

    // Seed a sample conversation
    const adiClient = await prisma.client.findFirst({
        where: { name: "Adi Narayana" },
    });

    if (adiClient) {
        await prisma.conversation.create({
            data: {
                clientId: adiClient.id,
                messages: JSON.stringify([
                    { role: "client", content: "Hi, this is Adi from Shivam. I'm interested in Build a professional website. Phone: +91955XXXXXXXX. Looking forward to discussing further.", timestamp: "2026-02-23T09:18:00Z" },
                    { role: "agent", content: "Hi Adi 👋 Thanks for reaching out — I'm Zara, your Growth Consultant at Trivern. Quick question to guide you properly — what's the main goal or challenge you want this website to solve?", timestamp: "2026-02-23T09:19:00Z" },
                    { role: "client", content: "I want a website", timestamp: "2026-02-23T09:19:30Z" },
                    { role: "agent", content: "Nice, Adi 👋 — happy to help. Quick question — what does your business do, and who do you serve?", timestamp: "2026-02-23T09:19:45Z" },
                    { role: "client", content: "Shivam construction", timestamp: "2026-02-23T09:20:00Z" },
                    { role: "agent", content: "Great — thanks, Adi. Quick question — what's the main goal for the new website?\nA) Get more leads/enquiries\nB) Showcase past projects/portfolio\nC) Let clients request quotes/book site visits\nD) Other", timestamp: "2026-02-23T09:20:15Z" },
                    { role: "client", content: "B", timestamp: "2026-02-23T09:21:00Z" },
                    { role: "agent", content: "Perfect — showcasing past projects is the right move for a construction business. Quick question — do you already have a website, or is this a brand-new site?", timestamp: "2026-02-23T09:21:15Z" },
                    { role: "client", content: "New one", timestamp: "2026-02-23T09:21:30Z" },
                    { role: "agent", content: "Perfect, Adi — thanks for that.\n\nA 20-minute clarity call will help us map a portfolio-led site that highlights your projects and wins clients.\nFree, no commitment.\n\nHere are two slots:\n📅 Wed, 25 Feb at 11:00 AM IST\n📅 Thu, 26 Feb at 4:00 PM IST\n\nWhich works better for you?", timestamp: "2026-02-23T09:21:45Z" },
                    { role: "client", content: "25 feb", timestamp: "2026-02-23T09:22:00Z" },
                    { role: "agent", content: "Perfect, Adi 🎯\n\nYou're confirmed for:\n📅 Wednesday, 25 Feb\n⏰ 11:00 AM IST\n\nYou'll receive a calendar invite with the meeting link shortly.\nIs there one project or photo gallery you'd like us to review before the call?", timestamp: "2026-02-23T09:23:00Z" },
                ]),
                summary: "Construction company owner looking for portfolio website. Booked discovery call for 25 Feb 11 AM IST.",
                status: "completed",
            },
        });

        // Seed a sample meeting
        await prisma.meeting.create({
            data: {
                clientId: adiClient.id,
                date: new Date("2026-02-25T05:30:00Z"), // 11:00 AM IST
                duration: 20,
                meetLink: "https://meet.google.com/abc-defg-hij",
                status: "SCHEDULED",
            },
        });
    }

    console.log("✅ Database seeded successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
