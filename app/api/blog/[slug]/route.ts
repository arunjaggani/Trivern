import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/types";

// GET /api/blog/[slug] — Get single blog post by slug
export async function GET(req: Request, { params }: { params: { slug: string } }) {
    try {
        const post = await prisma.blogPost.findUnique({
            where: { slug: params.slug },
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }
}

// PUT /api/blog/[slug] — Update blog post
export async function PUT(req: Request, { params }: { params: { slug: string } }) {
    try {
        const body = await req.json();
        const { title, content, excerpt, coverImage, tags, published, author, metaTitle, metaDesc } = body;

        const existing = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
        if (!existing) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Regenerate slug if title changed
        let newSlug = existing.slug;
        if (title && title !== existing.title) {
            newSlug = slugify(title);
            const conflict = await prisma.blogPost.findFirst({
                where: { slug: newSlug, id: { not: existing.id } },
            });
            if (conflict) newSlug = `${newSlug}-${Date.now().toString(36)}`;
        }

        const post = await prisma.blogPost.update({
            where: { slug: params.slug },
            data: {
                ...(title && { title }),
                slug: newSlug,
                ...(content !== undefined && { content }),
                ...(excerpt !== undefined && { excerpt }),
                ...(coverImage !== undefined && { coverImage }),
                ...(tags && { tags: JSON.stringify(tags) }),
                ...(published !== undefined && { published }),
                ...(published && !existing.published && { publishedAt: new Date() }),
                ...(author && { author }),
                ...(metaTitle !== undefined && { metaTitle }),
                ...(metaDesc !== undefined && { metaDesc }),
            },
        });

        return NextResponse.json({ success: true, post });
    } catch (error: any) {
        console.error("[blog/PUT] Error:", error);
        return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }
}

// DELETE /api/blog/[slug] — Delete blog post
export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
    try {
        await prisma.blogPost.delete({ where: { slug: params.slug } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
    }
}
