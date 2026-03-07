import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// POST /api/auth/change-password
// Body: { currentPassword, newPassword }
export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Both fields required" }, { status: 400 });
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { email: session.user.email },
            data: { passwordHash: newHash },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[change-password]", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
