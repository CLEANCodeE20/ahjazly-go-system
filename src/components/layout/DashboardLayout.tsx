import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Bus,
    Home,
    Route,
    Users,
    Building2,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    MapPin,
    Ticket,
    Shield,
    Menu,
    X
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "../notifications/NotificationBell";

const sidebarLinks = [
    { href: "/dashboard", label: "الرئيسية", icon: Home },
    { href: "/dashboard/fleet", label: "إدارة الأسطول", icon: Bus },
    { href: "/dashboard/routes", label: "المسارات", icon: MapPin },
    { href: "/dashboard/trips", label: "الرحلات", icon: Route },
    { href: "/dashboard/employees", label: "الموظفين", icon: Users },
    { href: "/dashboard/branches", label: "الفروع", icon: Building2 },
    { href: "/dashboard/bookings", label: "الحجوزات", icon: Ticket },
    { href: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
    { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
    { href: "/dashboard/permissions", label: "الصلاحيات", icon: Shield },
    { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const DashboardLayout = ({ children, title, subtitle, actions }: DashboardLayoutProps) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { partner, isLoading: partnerLoading } = usePartner();
    const { can, loading: permissionsLoading } = usePermissions();
    const { userRole, isLoading: authLoading } = useAuth();

    const isLoading = authLoading || partnerLoading || permissionsLoading;

    return (
        <div className="min-h-screen bg-muted/30" dir="rtl">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 flex flex-col ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0 border-l border-sidebar-border`}>
                <div className="flex items-center gap-3 p-4 border-b border-sidebar-border shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
                        {partner?.logo_url ? (
                            <img src={partner.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-lg font-bold block">احجزلي</span>
                        <p className="text-xs text-sidebar-foreground/60 truncate">{partner?.company_name || "لوحة التحكم"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    {sidebarLinks.map((link) => {
                        // While loading, we don't apply filters to avoid flickering or missing links
                        if (isLoading) {
                            return (
                                <div key={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 animate-pulse">
                                    <link.icon className="w-5 h-5 shrink-0" />
                                    <div className="h-4 bg-sidebar-foreground/20 rounded w-24"></div>
                                </div>
                            );
                        }

                        const isPartner = userRole?.role === 'partner';
                        const isAdmin = userRole?.role === 'admin';
                        const isOwner = isPartner || isAdmin;

                        if (link.href === "/dashboard/permissions" && !isOwner && !can('employees.manage')) return null;
                        if (link.href === "/dashboard/fleet" && !isOwner && !can('fleet.view')) return null;
                        if (link.href === "/dashboard/routes" && !isOwner && !can('routes.view')) return null;
                        if (link.href === "/dashboard/trips" && !isOwner && !can('trips.view')) return null;
                        if (link.href === "/dashboard/employees" && !isOwner && !can('employees.view')) return null;
                        if (link.href === "/dashboard/bookings" && !isOwner && !can('bookings.view')) return null;
                        if (link.href === "/dashboard/reports" && !isOwner && !can('reports.view')) return null;
                        if (link.href === "/dashboard/settings" && !isOwner && !can('settings.manage')) return null;
                        if (link.href === "/dashboard/branches" && !isOwner && !can('fleet.view')) return null;
                        if (link.href === "/dashboard/payments" && !isOwner && !can('finance.view')) return null;

                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === link.href
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                    }`}
                            >
                                <link.icon className="w-5 h-5 shrink-0" />
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-sidebar-border shrink-0">
                    <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
                        <Link to="/">
                            <LogOut className="w-5 h-5 ml-2 shrink-0" />
                            تسجيل الخروج
                        </Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:mr-64 min-h-screen flex flex-col">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                                <Menu className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{title || `مرحباً، ${partner?.company_name || 'الشريك'} 👋`}</h1>
                                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {actions}
                            <NotificationBell />
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium overflow-hidden">
                                {partner?.logo_url ? (
                                    <img src={partner.logo_url} alt="Partner Logo" className="w-full h-full object-cover" />
                                ) : (
                                    partner?.company_name?.[0] || 'س'
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
};
