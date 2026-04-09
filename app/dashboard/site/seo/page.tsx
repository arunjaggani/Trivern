"use client";

import { useState, useEffect } from "react";
import { FileSearch, Save, Loader2, Image as ImageIcon, Search } from "lucide-react";

export default function SEOSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State matching our intended SiteConfig JSON structure
    const [seoConfig, setSeoConfig] = useState({
        global_title: "Trivern OS | Automated Growth",
        global_description: "Enterprise revenue infrastructure, automated CRM, and voice AI receptionist systems.",
        keywords: "trivern, AI automation, growth consultant, voice agent",
        og_image: "",
        twitter_handle: "@trivern",
        indexing_enabled: true,
        sitemap_enabled: true
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/site-config");
                const data = await res.json();
                
                // Find seo settings
                const seoEntry = data.find((item: any) => item.key === "seo_settings_global");
                if (seoEntry && seoEntry.value) {
                    setSeoConfig({ ...seoConfig, ...JSON.parse(seoEntry.value) });
                }
            } catch (error) {
                console.error("Failed to fetch SEO config:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/site-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([
                    { key: "seo_settings_global", value: JSON.stringify(seoConfig) }
                ]),
            });
            if (res.ok) alert("SEO Settings successfully saved!");
            else alert("Failed to save settings.");
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20 text-cyan-500"><Loader2 size={32} className="animate-spin" /></div>;
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileSearch className="text-emerald-400" /> SEO & Indexing
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Configure global meta data, open graph cards, and crawl behavior.</p>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Engine Display Card */}
                <div className="bg-white/5 border border-cyan-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Search size={16} className="text-cyan-400" /> General Meta Data
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Global Site Title</label>
                            <input 
                                type="text"
                                value={seoConfig.global_title}
                                onChange={e => setSeoConfig({...seoConfig, global_title: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Global Description (Max 160 chars)</label>
                            <textarea 
                                rows={3}
                                value={seoConfig.global_description}
                                onChange={e => setSeoConfig({...seoConfig, global_description: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">SEO Keywords (Comma separated)</label>
                            <input 
                                type="text"
                                value={seoConfig.keywords}
                                onChange={e => setSeoConfig({...seoConfig, keywords: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Graph Data Card */}
                <div className="bg-white/5 border border-purple-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <ImageIcon size={16} className="text-purple-400" /> Social Graph (OG)
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Twitter / X Handle</label>
                            <input 
                                type="text"
                                value={seoConfig.twitter_handle}
                                onChange={e => setSeoConfig({...seoConfig, twitter_handle: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Default OG Image URL (From Media Library)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={seoConfig.og_image}
                                    placeholder="/uploads/my-og.png"
                                    onChange={e => setSeoConfig({...seoConfig, og_image: e.target.value})}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-purple-500 outline-none"
                                />
                            </div>
                            {seoConfig.og_image && (
                                <div className="mt-3 relative h-32 w-full rounded-lg bg-black border border-slate-700 overflow-hidden">
                                     <img src={seoConfig.og_image} alt="OG Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Indexing Preferences */}
                <div className="md:col-span-2 bg-white/5 border border-emerald-500/20 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Search Crawl Behavior</h3>
                    <div className="flex flex-col gap-6">
                        
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h4 className="text-sm font-semibold text-white">Enable Search Engine Indexing</h4>
                                <p className="text-xs text-gray-500">Allows Google & Bing to crawl your website (robots: index, follow).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={seoConfig.indexing_enabled} onChange={e => setSeoConfig({...seoConfig, indexing_enabled: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-white">XML Sitemap Generation</h4>
                                <p className="text-xs text-gray-500">Automatically adds new blog posts and pages to /sitemap.xml</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={seoConfig.sitemap_enabled} onChange={e => setSeoConfig({...seoConfig, sitemap_enabled: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
