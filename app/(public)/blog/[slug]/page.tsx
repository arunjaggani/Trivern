import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
    const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
    if (!post || !post.published) return { title: "Post Not Found" };
    return {
        title: post.metaTitle || post.title,
        description: post.metaDesc || post.excerpt || "",
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });

    if (!post || !post.published) {
        notFound();
    }

    const tags = JSON.parse(post.tags || "[]");

    // Very basic markdown-to-HTML (headings, bold, italic, links, code, lists)
    // For production, consider a library like marked or remark
    const renderContent = (md: string) => {
        let html = md
            .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-8 mb-3">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-10 mb-4">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-12 mb-4">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-cyan-400 text-sm">$1</code>')
            .replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc text-gray-400">$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-400">$1</li>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n\n/g, '</p><p class="text-gray-400 leading-relaxed mb-4">')
            .replace(/\n/g, '<br/>');

        return `<p class="text-gray-400 leading-relaxed mb-4">${html}</p>`;
    };

    return (
        <main className="min-h-screen py-20 px-6">
            <article className="max-w-3xl mx-auto">
                {/* Back link */}
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition mb-8">
                    <ArrowLeft size={16} />Back to Blog
                </Link>

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><Calendar size={12} />{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}</span>
                        <span>·</span>
                        <span>{post.author}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight mb-4">{post.title}</h1>
                    {post.excerpt && <p className="text-gray-400 text-lg leading-relaxed">{post.excerpt}</p>}
                    {tags.length > 0 && (
                        <div className="flex gap-2 mt-4">
                            {tags.map((tag: string) => (
                                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400/70 border border-cyan-500/10">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cover Image */}
                {post.coverImage && (
                    <div className="mb-10 rounded-2xl overflow-hidden border border-white/10">
                        <img src={post.coverImage} alt={post.title} className="w-full h-auto" />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderContent(post.content) }} />

                {/* Footer */}
                <div className="border-t border-white/10 mt-16 pt-8 text-center">
                    <p className="text-gray-500 text-sm mb-3">Want to learn how Trivern can help your business?</p>
                    <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm hover:bg-cyan-400 transition-all">
                        Get in Touch
                    </Link>
                </div>
            </article>
        </main>
    );
}
