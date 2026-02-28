"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Eye, EyeOff, Trash2, Loader2, Tag, Calendar } from "lucide-react";

export default function BlogManagerPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/blog");
            setPosts(await res.json());
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchPosts(); }, []);

    const togglePublish = async (slug: string, published: boolean) => {
        await fetch(`/api/blog/${slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published: !published }),
        });
        fetchPosts();
    };

    const deletePost = async (slug: string) => {
        if (!confirm("Delete this post permanently?")) return;
        await fetch(`/api/blog/${slug}`, { method: "DELETE" });
        fetchPosts();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Blog Manager</h1>
                    <p className="text-gray-400 text-sm mt-1">Create and manage blog posts</p>
                </div>
                <Link
                    href="/dashboard/site/blog/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-slate-900 text-sm font-semibold hover:bg-cyan-400 transition-all"
                >
                    <Plus size={16} />New Post
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-cyan-500" size={24} /></div>
            ) : posts.length === 0 ? (
                <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-12 text-center">
                    <FileText className="mx-auto text-gray-600 mb-3" size={40} />
                    <p className="text-gray-400 text-sm mb-4">No blog posts yet</p>
                    <Link href="/dashboard/site/blog/new" className="text-sm text-cyan-400 hover:text-cyan-300 transition">Create your first post →</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 hover:border-cyan-500/20 transition-all flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Link href={`/dashboard/site/blog/${post.slug}`} className="text-sm font-semibold text-white hover:text-cyan-400 transition truncate">
                                        {post.title}
                                    </Link>
                                    {post.published ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-medium">Published</span>
                                    ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20 font-medium">Draft</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">{post.excerpt || "No excerpt"}</p>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    {JSON.parse(post.tags || "[]").length > 0 && (
                                        <span className="flex items-center gap-1"><Tag size={10} />{JSON.parse(post.tags).join(", ")}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => togglePublish(post.slug, post.published)} className={`p-2 rounded-lg border transition-all ${post.published ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" : "border-white/10 text-gray-400 hover:bg-white/5"}`} title={post.published ? "Unpublish" : "Publish"}>
                                    {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <Link href={`/dashboard/site/blog/${post.slug}`} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition-all" title="Edit">
                                    <FileText size={14} />
                                </Link>
                                <button onClick={() => deletePost(post.slug)} className="p-2 rounded-lg border border-red-500/10 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
