"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import {
    LayoutDashboard,
    Globe,
    MessageSquare,
    Users,
    Calendar,
    Mail,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Newspaper,
    UserCog,
    Bot,
    Image,
    FileSearch,
    Zap,
    Workflow,
    CalendarCheck,
    ScrollText,
    ShieldAlert,
    Brain,
    GitBranch,
    Building2,
    Bell,
    Plug,
    Lock,
    Shield,
    Phone,
} from "lucide-react";

// ─── Role Definitions ───────────────────────────────
// ADMIN    → Full access to everything
// MANAGER  → Overview + CRM (locked sections shown with lock icon)
// STAFF    → CRM only (conversations, leads, bookings)

type NavItem = { href: string; label: string; icon: any };

type NavSection = {
    title: string;
    items: NavItem[];
    roles: string[];        // which roles can ACCESS this section
    showLockedTo?: string[]; // which roles see this section as locked
};

const navSections: NavSection[] = [
    {
        title: "Site CMS",
        roles: ["ADMIN"],
        showLockedTo: ["MANAGER", "STAFF"],
        items: [
            { href: "/dashboard/site", label: "Site Overview", icon: Globe },
            { href: "/dashboard/site/content", label: "Content Manager", icon: FileText },
            { href: "/dashboard/site/blog", label: "Blog Manager", icon: Newspaper },
            { href: "/dashboard/site/media", label: "Media Library", icon: Image },
            { href: "/dashboard/site/seo", label: "SEO Settings", icon: FileSearch },
            { href: "/dashboard/site/booking-settings", label: "Booking Page", icon: Calendar },
        ],
    },
    {
        title: "Automation & Workflows",
        roles: ["ADMIN"],
        showLockedTo: ["MANAGER", "STAFF"],
        items: [
            { href: "/dashboard/automation/agents", label: "AI Agents", icon: Bot },
            { href: "/dashboard/automation/workflows", label: "Workflow Center", icon: Workflow },
            { href: "/dashboard/automation/booking-engine", label: "Booking Engine", icon: Zap },
            { href: "/dashboard/automation/calendar", label: "Calendar Sync", icon: CalendarCheck },
            { href: "/dashboard/automation/logs", label: "Automation Logs", icon: ScrollText },
            { href: "/dashboard/automation/emergency", label: "Emergency Controls", icon: ShieldAlert },
            { href: "/dashboard/automation/voice", label: "Voice Agent", icon: Phone },
        ],
    },
    {
        title: "CRM",
        roles: ["ADMIN", "MANAGER", "STAFF"],
        items: [
            { href: "/dashboard/crm/conversations", label: "Conversations", icon: MessageSquare },
            { href: "/dashboard/crm/leads", label: "Leads", icon: Users },
            { href: "/dashboard/crm/intelligence", label: "Lead Intelligence", icon: Brain },
            { href: "/dashboard/crm/bookings", label: "Bookings", icon: Calendar },
            { href: "/dashboard/crm/contacts", label: "Contacts", icon: Mail },
            { href: "/dashboard/crm/pipeline", label: "Lead Pipeline", icon: GitBranch },
        ],
    },
    {
        title: "Settings",
        roles: ["ADMIN"],
        showLockedTo: ["MANAGER", "STAFF"],
        items: [
            { href: "/dashboard/settings/profile", label: "Business Profile", icon: Building2 },
            { href: "/dashboard/settings/team", label: "Team", icon: UserCog },
            { href: "/dashboard/settings/zara", label: "Zara AI Settings", icon: Bot },
            { href: "/dashboard/settings/notifications", label: "Notifications", icon: Bell },
            { href: "/dashboard/settings/integrations", label: "Integrations", icon: Plug },
            { href: "/dashboard/settings/security", label: "Security", icon: Shield },
        ],
    },
];

// Staff only sees a subset of CRM
const staffCrmItems = ["Conversations", "Leads", "Bookings"];

function DashboardSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const rawRole = (session?.user as any)?.role || "STAFF";
    const userRole = rawRole === "EMPLOYEE" ? "STAFF" : rawRole; // backward compat
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const ActiveNavItem = ({ href, label, icon: Icon }: NavItem) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                className={`dash-nav-item flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-all duration-200
            ${active
                        ? "dash-nav-active font-medium"
                        : "text-[hsl(var(--dash-text-muted))] hover:text-[hsl(var(--dash-text))]"
                    }
            ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? label : undefined}
            >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
            </Link>
        );
    };

    const LockedSection = ({ title }: { title: string }) => (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm opacity-40 cursor-not-allowed select-none ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? `🔒 ${title} (Admin Only)` : undefined}
        >
            <Lock size={14} className="shrink-0" />
            {!collapsed && <span>{title} <span className="text-[10px]">(Admin Only)</span></span>}
        </div>
    );

    return (
        <aside
            className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r transition-all duration-300 bg-[var(--dash-sidebar)] shadow-[var(--shadow-sm)]
        ${collapsed ? "w-16" : "w-60"}`}
            style={{ borderColor: "var(--dash-border)" }}
        >
            <div
                className={`flex items-center h-16 px-4 ${collapsed ? "justify-center" : "justify-between"}`}
                style={{ borderBottom: "1px solid var(--dash-border)" }}
            >
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", boxShadow: "0 4px 12px rgba(13,148,136,0.35)" }}>T</div>
                        <span className="font-bold text-[hsl(var(--dash-text))] text-sm">Trivern OS</span>
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className="text-[hsl(var(--dash-text-muted))] hover:text-[hsl(var(--dash-text))] transition p-1">
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
                {/* Overview — visible to Admin & Manager */}
                {(userRole === "ADMIN" || userRole === "MANAGER") && (
                    <div><ActiveNavItem href="/dashboard" label="Overview" icon={LayoutDashboard} /></div>
                )}

                {/* Render sections based on role */}
                {navSections.map((section) => {
                    const hasAccess = section.roles.includes(userRole);
                    const showLocked = section.showLockedTo?.includes(userRole);

                    // Filter staff to only see subset of CRM
                    let items = section.items;
                    if (section.title === "CRM" && userRole === "STAFF") {
                        items = items.filter(i => staffCrmItems.includes(i.label));
                    }

                    if (hasAccess) {
                        return (
                            <div key={section.title}>
                                {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--dash-text-muted))]">{section.title}</p>}
                                <div className="space-y-0.5">{items.map((item) => <ActiveNavItem key={item.href} {...item} />)}</div>
                            </div>
                        );
                    }

                    if (showLocked && !collapsed) {
                        return (
                            <div key={section.title}>
                                <LockedSection title={section.title} />
                            </div>
                        );
                    }

                    return null;
                })}
            </div>

            <div className="p-3" style={{ borderTop: "1px solid var(--dash-border)" }}>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[hsl(var(--dash-text-muted))] hover:text-red-500 hover:bg-red-500/10 transition-all ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? "Sign out" : undefined}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Sign out</span>}
                </button>
            </div>
        </aside>
    );
}

function DashboardTopbar({ collapsed, setMobileOpen }: { collapsed: boolean; setMobileOpen: (v: boolean) => void }) {
    const { data: session } = useSession();

    return (
        <header
            className={`fixed top-0 right-0 z-30 h-16 bg-[var(--dash-topbar-bg)] backdrop-blur-md flex items-center justify-between px-6 transition-all duration-300 ${collapsed ? "left-16" : "left-60"}`}
            style={{ borderBottom: "1px solid var(--dash-border)" }}
        >
            <div className="flex items-center gap-4">
                <button onClick={() => setMobileOpen(true)} className="lg:hidden text-[hsl(var(--dash-text-muted))] hover:text-[hsl(var(--dash-text))]"><Menu size={20} /></button>
                <h1 className="text-sm font-medium text-[hsl(var(--dash-text-muted))]">Welcome back</h1>
            </div>
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="text-right">
                    <p className="text-sm font-semibold text-[hsl(var(--dash-text))]">{session?.user?.name || "User"}</p>
                    <p className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "#0D9488" }}>{(session?.user as any)?.role || "ADMIN"}</p>
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", boxShadow: "0 0 0 3px #CCFBF1" }}>
                    {(session?.user?.name || "U")[0]}
                </div>
            </div>
        </header>
    );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--dash-bg)]">
            <div className="hidden lg:block"><DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} /></div>
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                    <div className="relative w-60">
                        <DashboardSidebar collapsed={false} setCollapsed={() => { }} />
                        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-[hsl(var(--dash-text-muted))] hover:text-[hsl(var(--dash-text))]"><X size={20} /></button>
                    </div>
                </div>
            )}
            <DashboardTopbar collapsed={collapsed} setMobileOpen={setMobileOpen} />
            <main className={`pt-16 min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider defaultTheme="light" storageKey="trivern-dash-theme">
                <DashboardShell>{children}</DashboardShell>
            </ThemeProvider>
        </SessionProvider>
    );
}
