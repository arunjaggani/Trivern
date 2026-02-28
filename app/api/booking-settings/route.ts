import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const settings = await prisma.bookingSettings.findFirst();
    return NextResponse.json(settings);
}

export async function PUT(req: Request) {
    const data = await req.json();

    // Find existing or create
    const existing = await prisma.bookingSettings.findFirst();

    if (existing) {
        const updated = await prisma.bookingSettings.update({
            where: { id: existing.id },
            data: {
                startHour: data.startHour,
                endHour: data.endHour,
                slotDuration: data.slotDuration,
                bufferMinutes: data.bufferMinutes,
                maxPerDay: data.maxPerDay,
                blockedDates: data.blockedDates,
                holidays: data.holidays,
                automationOn: data.automationOn,
            },
        });
        return NextResponse.json(updated);
    } else {
        const created = await prisma.bookingSettings.create({ data });
        return NextResponse.json(created);
    }
}
