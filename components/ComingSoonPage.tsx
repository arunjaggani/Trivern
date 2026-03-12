
import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComingSoonPageProps {
    title: string;
    description: string;
    icon?: any;
}

export default function ComingSoonPage({ title, description, icon: Icon = Construction }: ComingSoonPageProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "32px" }}>
            <div style={{
                width: "80px", height: "80px", borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(13,148,136,0.15), rgba(15,118,110,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "24px", border: "1px solid rgba(13,148,136,0.2)"
            }}>
                <Icon size={36} style={{ color: "#0D9488" }} />
            </div>

            <h1 style={{
                fontSize: "24px", fontWeight: 700, marginBottom: "8px",
                color: "hsl(var(--dash-text))"
            }}>
                {title}
            </h1>

            <p style={{
                fontSize: "15px", color: "hsl(var(--dash-text-muted))",
                maxWidth: "400px", lineHeight: 1.6, marginBottom: "24px"
            }}>
                {description}
            </p>

            <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", borderRadius: "10px",
                background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)",
                color: "#0D9488", fontSize: "13px", fontWeight: 500
            }}>
                <Construction size={14} />
                Coming Soon
            </div>

            <Link href="/dashboard" style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginTop: "20px", fontSize: "13px",
                color: "hsl(var(--dash-text-muted))", textDecoration: "none"
            }}>
                <ArrowLeft size={14} />
                Back to Overview
            </Link>
        </div>
    );
}
