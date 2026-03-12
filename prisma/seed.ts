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

    // Create manager user
    const empPassword = await bcrypt.hash("employee123", 12);
    await prisma.user.upsert({
        where: { email: "employee@trivern.com" },
        update: {},
        create: {
            email: "employee@trivern.com",
            passwordHash: empPassword,
            name: "Team Member",
            role: "MANAGER",
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

    console.log("✅ Database seeded successfully! Users and booking settings created.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
