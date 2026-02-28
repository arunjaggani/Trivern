import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const CONFIG_KEY = "chatbot_settings";
const DEFAULTS = { enabled: true, maxWords: 80 };

// GET — Fetch chatbot settings
export async function GET() {
    try {
        const config = await prisma.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
        if (!config) return NextResponse.json(DEFAULTS);
        return NextResponse.json({ ...DEFAULTS, ...JSON.parse(config.value) });
    } catch {
        return NextResponse.json(DEFAULTS);
    }
}

// PATCH — Update chatbot settings (admin-only)
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const settings: any = {};

        if (typeof body.enabled === "boolean") settings.enabled = body.enabled;
        if (typeof body.maxWords === "number" && body.maxWords >= 20 && body.maxWords <= 500) {
            settings.maxWords = body.maxWords;
        }

        await prisma.siteConfig.upsert({
            where: { key: CONFIG_KEY },
            update: { value: JSON.stringify(settings) },
            create: { key: CONFIG_KEY, value: JSON.stringify(settings) },
        });

        return NextResponse.json({ ...DEFAULTS, ...settings });
    } catch {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
