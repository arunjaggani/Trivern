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
    BarChart3,
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
} from "lucide-react";

const siteItems = [
    { href: "/dashboard/site", label: "Site Overview", icon: Globe },
    { href: "/dashboard/site/content", label: "Content", icon: FileText },
    { href: "/dashboard/site/blog", label: "Blog", icon: Newspaper },
    { href: "/dashboard/site/booking-settings", label: "Booking Settings", icon: Settings },
];

const crmItems = [
    { href: "/dashboard/crm/conversations", label: "Conversations", icon: MessageSquare },
    { href: "/dashboard/crm/leads", label: "Lead Intelligence", icon: Users },
    { href: "/dashboard/crm/bookings", label: "Bookings", icon: Calendar },
    { href: "/dashboard/crm/contacts", label: "Contacts & Email", icon: Mail },
    { href: "/dashboard/crm/analytics", label: "Analytics", icon: BarChart3 },
];

function DashboardSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || "EMPLOYEE";
    const isAdmin = userRole === "ADMIN";
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

    const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
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
                        <span className="font-bold text-[hsl(var(--dash-text))] text-sm">Dashboard</span>
                    </div>
                )}
                <button onClick={() => setCollapsed(!collapsed)} className="text-[hsl(var(--dash-text-muted))] hover:text-[hsl(var(--dash-text))] transition p-1">
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                <div><NavItem href="/dashboard" label="Overview" icon={LayoutDashboard} /></div>

                {isAdmin && (
                    <div>
                        {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--dash-text-muted))]">Site Management</p>}
                        <div className="space-y-1">{siteItems.map((item) => <NavItem key={item.href} {...item} />)}</div>
                    </div>
                )}

                <div>
                    {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--dash-text-muted))]">CRM & Automation</p>}
                    <div className="space-y-1">{crmItems.map((item) => <NavItem key={item.href} {...item} />)}</div>
                </div>

                {isAdmin && (
                    <div>
                        {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--dash-text-muted))]">Settings</p>}
                        <div className="space-y-1">
                            <NavItem href="/dashboard/team" label="Team" icon={UserCog} />
                            <NavItem href="/dashboard/zara" label="Zara Chatbot" icon={Bot} />
                        </div>
                    </div>
                )}
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
