import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET — return all site config entries
export async function GET() {
    const configs = await prisma.siteConfig.findMany();
    return NextResponse.json(configs);
}

// PUT — upsert multiple config entries
export async function PUT(req: Request) {
    const entries: { key: string; value: string }[] = await req.json();

    const results = await Promise.all(
        entries.map((entry) =>
            prisma.siteConfig.upsert({
                where: { key: entry.key },
                update: { value: entry.value },
                create: { key: entry.key, value: entry.value },
            })
        )
    );

    return NextResponse.json(results);
}
