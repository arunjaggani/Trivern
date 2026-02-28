import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

// GET — List all team members
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
            orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }
}

// POST — Create new team member (admin-only)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, phone, role } = body;

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
        }

        // Validate role
        const memberRole = role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

        // Enforce max 3 admins
        if (memberRole === "ADMIN") {
            const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
            if (adminCount >= 3) {
                return NextResponse.json({
                    error: "Maximum 3 admin accounts allowed for security reasons. Remove an existing admin first.",
                }, { status: 400 });
            }
        }

        // Check email uniqueness
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        // Check phone uniqueness if provided
        if (phone) {
            const existingPhone = await prisma.user.findUnique({ where: { phone } });
            if (existingPhone) {
                return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                phone: phone || null,
                role: memberRole,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
    }
}
