import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = ["Name", "Company", "Email", "Phone", "Source", "Status", "Score", "Industry", "Urgency", "Date"];
    const rows = clients.map((c) => [
        c.name,
        c.company || "",
        c.email || "",
        c.phone,
        c.source || "",
        c.status,
        (c.scoreOverride ?? c.score).toString(),
        c.industry || "",
        c.urgency || "",
        new Date(c.createdAt).toISOString().split("T")[0],
    ]);

    const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="trivern-contacts-${new Date().toISOString().split("T")[0]}.csv"`,
        },
    });
}
