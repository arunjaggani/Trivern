"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import Link from "next/link";

export default function BlogEditorPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string | undefined;
    const isNew = slug === "new";

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [tags, setTags] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDesc, setMetaDesc] = useState("");
    const [published, setPublished] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!isNew);

    // Load existing post
    useEffect(() => {
        if (!isNew && slug) {
            fetch(`/api/blog/${slug}`)
                .then((r) => r.json())
                .then((post) => {
                    setTitle(post.title || "");
                    setContent(post.content || "");
                    setExcerpt(post.excerpt || "");
                    setTags(JSON.parse(post.tags || "[]").join(", "));
                    setCoverImage(post.coverImage || "");
                    setMetaTitle(post.metaTitle || "");
                    setMetaDesc(post.metaDesc || "");
                    setPublished(post.published || false);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isNew, slug]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);

        const payload = {
            title,
            content,
            excerpt: excerpt || null,
            coverImage: coverImage || null,
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            metaTitle: metaTitle || null,
            metaDesc: metaDesc || null,
            published,
        };

        try {
            if (isNew) {
                const res = await fetch("/api/blog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.post?.slug) {
                    router.push(`/dashboard/site/blog/${data.post.slug}`);
                }
            } else {
                await fetch(`/api/blog/${slug}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-cyan-500" size={24} /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/site/blog" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-xl font-bold text-white">{isNew ? "New Blog Post" : "Edit Post"}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-white/5 accent-cyan-500" />
                        Published
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim()}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 text-slate-900 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 transition-all"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isNew ? "Create" : "Save"}
                    </button>
                </div>
            </div>

            {/* Main Form */}
            <div className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Post title..."
                        className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-gray-600 focus:outline-none border-b border-white/10 pb-3"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Excerpt / Summary</label>
                    <textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        rows={2}
                        placeholder="Brief description for blog list and SEO..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Content (Markdown)</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={20}
                        placeholder="Write your post content in Markdown..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40 font-mono leading-relaxed"
                    />
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
                        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, growth, automation" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Cover Image URL</label>
                        <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">SEO Title</label>
                        <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Custom title for search engines" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">SEO Description</label>
                        <input type="text" value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Custom description for search engines" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/40" />
                    </div>
                </div>
            </div>
        </div>
    );
}
