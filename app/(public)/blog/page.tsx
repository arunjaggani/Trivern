import prisma from "@/lib/prisma";
import Link from "next/link";
import { Calendar, ArrowRight, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
    const posts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        select: {
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            author: true,
            tags: true,
        },
    });

    return (
        <main className="min-h-screen py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Blog</h1>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto">Insights on AI, growth infrastructure, and building systems that scale.</p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500">No posts published yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => {
                            const tags = JSON.parse(post.tags || "[]");
                            return (
                                <Link
                                    key={post.slug}
                                    href={`/blog/${post.slug}`}
                                    className="block bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all group"
                                >
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                        <span className="flex items-center gap-1"><Calendar size={12} />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
                                        <span>·</span>
                                        <span>{post.author}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">{post.title}</h2>
                                    {post.excerpt && <p className="text-gray-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2 flex-wrap">
                                            {tags.map((tag: string) => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/10">{tag}</span>
                                            ))}
                                        </div>
                                        <span className="text-xs text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Read <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
