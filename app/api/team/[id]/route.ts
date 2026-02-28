import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// PATCH — Update team member
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, email, phone, role, password } = body;

        const user = await prisma.user.findUnique({ where: { id: params.id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If changing role to ADMIN, enforce max 3
        if (role === "ADMIN" && user.role !== "ADMIN") {
            const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
            if (adminCount >= 3) {
                return NextResponse.json({
                    error: "Maximum 3 admin accounts allowed. Remove an existing admin first.",
                }, { status: 400 });
            }
        }

        // Check email uniqueness if changing
        if (email && email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            }
        }

        // Check phone uniqueness if changing
        if (phone && phone !== user.phone) {
            const existingPhone = await prisma.user.findUnique({ where: { phone } });
            if (existingPhone) {
                return NextResponse.json({ error: "Phone number already in use" }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone || null;
        if (role === "ADMIN" || role === "EMPLOYEE") updateData.role = role;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

        const updated = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
    }
}

// DELETE — Remove team member
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await prisma.user.findUnique({ where: { id: params.id } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent deleting the last admin
        if (user.role === "ADMIN") {
            const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
            if (adminCount <= 1) {
                return NextResponse.json({
                    error: "Cannot delete the last admin. At least one admin must exist.",
                }, { status: 400 });
            }
        }

        await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
    }
}
