import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/types";

// GET /api/blog — List blog posts (supports ?published=true for public)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get("published") === "true";

    try {
        const posts = await prisma.blogPost.findMany({
            where: publishedOnly ? { published: true } : undefined,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                coverImage: true,
                published: true,
                publishedAt: true,
                author: true,
                tags: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(posts);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

// POST /api/blog — Create a new blog post
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, content, excerpt, coverImage, tags, published, author, metaTitle, metaDesc } = body;

        if (!title) {
            return NextResponse.json({ error: "title required" }, { status: 400 });
        }

        // Generate unique slug
        let slug = slugify(title);
        const existing = await prisma.blogPost.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        const post = await prisma.blogPost.create({
            data: {
                title,
                slug,
                content: content || "",
                excerpt: excerpt || null,
                coverImage: coverImage || null,
                tags: JSON.stringify(tags || []),
                published: published || false,
                publishedAt: published ? new Date() : null,
                author: author || "Trivern",
                metaTitle: metaTitle || null,
                metaDesc: metaDesc || null,
            },
        });

        return NextResponse.json({ success: true, post });
    } catch (error: any) {
        console.error("[blog/POST] Error:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
