"use client";
import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

interface ContentSection {
    key: string;
    label: string;
    type: "text" | "textarea" | "list";
    value: string;
}

const defaultSections: ContentSection[] = [
    { key: "hero_title", label: "Hero Title", type: "text", value: "" },
    { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea", value: "" },
    { key: "hero_cta", label: "Hero CTA Text", type: "text", value: "" },
    { key: "services_title", label: "Services Section Title", type: "text", value: "" },
    { key: "services_subtitle", label: "Services Subtitle", type: "textarea", value: "" },
    { key: "about_title", label: "About Title", type: "text", value: "" },
    { key: "about_description", label: "About Description", type: "textarea", value: "" },
    { key: "contact_title", label: "Contact Page Title", type: "text", value: "" },
    { key: "contact_subtitle", label: "Contact Subtitle", type: "textarea", value: "" },
    { key: "footer_tagline", label: "Footer Tagline", type: "text", value: "" },
];

const inputClass = "w-full px-3 py-2.5 rounded-lg bg-[var(--dash-bg)] border text-[hsl(var(--dash-text))] text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/25 focus:border-accent placeholder:text-[hsl(var(--dash-text-muted))]";
const labelClass = "block text-xs font-medium text-[hsl(var(--dash-text-muted))] mb-1.5 uppercase tracking-wide";
const cardClass = "bg-[hsl(var(--card))] border rounded-xl p-5 space-y-4 shadow-[var(--shadow-xs)]";
const cardTitleClass = "text-sm font-semibold text-[hsl(var(--dash-text))]";

export default function SiteContentPage() {
    const [sections, setSections] = useState<ContentSection[]>(defaultSections);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/site-config")
            .then((r) => r.json())
            .then((data: any[]) => {
                if (data && data.length > 0) {
                    setSections((prev) =>
                        prev.map((s) => {
                            const found = data.find((d: any) => d.key === s.key);
                            return found ? { ...s, value: found.value } : s;
                        })
                    );
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await fetch("/api/site-config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sections.map((s) => ({ key: s.key, value: s.value }))),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const updateValue = (key: string, value: string) => {
        setSections((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
    };

    const renderField = (s: ContentSection) => (
        <div key={s.key}>
            <label className={labelClass}>{s.label}</label>
            {s.type === "textarea" ? (
                <textarea
                    value={s.value}
                    onChange={(e) => updateValue(s.key, e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder={`Enter ${s.label.toLowerCase()}...`}
                    style={{ borderColor: "var(--dash-border)" }}
                />
            ) : (
                <input
                    type="text"
                    value={s.value}
                    onChange={(e) => updateValue(s.key, e.target.value)}
                    className={inputClass}
                    placeholder={`Enter ${s.label.toLowerCase()}...`}
                    style={{ borderColor: "var(--dash-border)" }}
                />
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[hsl(var(--dash-text))]">Site Content</h1>
                    <p className="text-[hsl(var(--dash-text-muted))] text-sm mt-1">Edit your website copy and content</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-accent text-primary-foreground font-semibold hover:brightness-110 transition-all disabled:opacity-50 shadow-[var(--shadow-xs)]"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saved ? "Saved ✓" : "Save Changes"}
                </button>
            </div>

            {/* Hero Section */}
            <div className={cardClass} style={{ borderColor: "var(--dash-border)" }}>
                <h2 className={cardTitleClass}>Hero Section</h2>
                {sections.filter((s) => s.key.startsWith("hero_")).map(renderField)}
            </div>

            {/* Services Section */}
            <div className={cardClass} style={{ borderColor: "var(--dash-border)" }}>
                <h2 className={cardTitleClass}>Services Section</h2>
                {sections.filter((s) => s.key.startsWith("services_")).map(renderField)}
            </div>

            {/* About Section */}
            <div className={cardClass} style={{ borderColor: "var(--dash-border)" }}>
                <h2 className={cardTitleClass}>About Section</h2>
                {sections.filter((s) => s.key.startsWith("about_")).map(renderField)}
            </div>

            {/* Contact Page */}
            <div className={cardClass} style={{ borderColor: "var(--dash-border)" }}>
                <h2 className={cardTitleClass}>Contact Page</h2>
                {sections.filter((s) => s.key.startsWith("contact_")).map(renderField)}
            </div>

            {/* Footer */}
            <div className={cardClass} style={{ borderColor: "var(--dash-border)" }}>
                <h2 className={cardTitleClass}>Footer</h2>
                {sections.filter((s) => s.key.startsWith("footer_")).map(renderField)}
            </div>
        </div>
    );
}
