import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PrefetchLink } from "@/components/ui/PrefetchLink";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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
    X,
    ArrowLeftRight,
    Star,
    LayoutDashboard,
    ClipboardList,
    Wallet,
    BarChart,
    UserCog,
    Banknote,
    TrendingUp,
    ArrowRightLeft,
    Plus,
    DollarSign,
    XCircle
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { NotificationBell } from "../notifications/NotificationBell";

const sidebarSections = [
    {
        title: "الرئيسية",
        links: [
            { href: "/dashboard", label: "الرئيسية", icon: Home },
        ]
    },
    {
        title: "العمليات",
        links: [
            { href: "/dashboard/fleet", label: "إدارة الأسطول", icon: Bus },
            { href: "/dashboard/routes", label: "المسارات", icon: MapPin },
            { href: "/dashboard/trips", label: "الرحلات", icon: Route },
            { href: "/dashboard/drivers", label: "إدارة السائقين", icon: Users },
            { href: "/dashboard/branches", label: "الفروع", icon: Building2 },
        ]
    },
    {
        title: "المبيعات والمالية",
        links: [
            { href: "/dashboard/bookings", label: "الحجوزات", icon: Ticket },
            { href: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
            { href: "/dashboard/wallet", label: "المحفظة", icon: Wallet },
            { href: "/dashboard/withdrawals", label: "طلبات السحب", icon: Banknote },
            { href: "/dashboard/deposits", label: "إدارة الشحن", icon: Plus },
            { href: "/dashboard/admin-wallets", label: "إدارة المحافظ", icon: Wallet },
            { href: "/dashboard/financial-analytics", label: "التحليلات المالية", icon: TrendingUp },
            { href: "/dashboard/partner-settlements", label: "تسويات الشركاء", icon: ArrowRightLeft },
            { href: "/dashboard/refunds", label: "إدارة المستردات", icon: ArrowLeftRight },
        ]
    },
    {
        title: "التحليلات",
        links: [
            { href: "/dashboard/reports", label: "لوحة التقارير", icon: BarChart3 },
            { href: "/dashboard/advanced-reports", label: "التقارير التفصيلية", icon: ClipboardList },
            { href: "/dashboard/ratings", label: "التقييمات", icon: Star, badgeKey: 'ratings' },
        ]
    },
    {
        title: "الإدارة",
        links: [
            { href: "/dashboard/employees", label: "الموظفين", icon: Users },
            { href: "/dashboard/permissions", label: "الصلاحيات", icon: Shield },
            { href: "/dashboard/cancellation-policies", label: "سياسات الإلغاء", icon: Shield },
            { href: "/dashboard/cancellation-approvals", label: "طلبات الإلغاء", icon: XCircle },
            { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
        ]
    }
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
    const { userRole, signOut, isLoading: authLoading } = useAuth();
    const { wallet } = useWallet();
    const [badges, setBadges] = useState<{ [key: string]: number }>({});
    const isLoading = authLoading || partnerLoading || permissionsLoading;

    useEffect(() => {
        const fetchBadges = async () => {
            if (!partner?.partner_id) return;

            try {
                const { count, error } = await supabase
                    .from('v_ratings_requiring_attention' as any)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    setBadges(prev => ({ ...prev, ratings: count || 0 }));
                }
            } catch (err) {
                console.error('Error fetching sidebar badges:', err);
            }
        };

        if (!isLoading) {
            fetchBadges();
        }
    }, [partner?.partner_id, isLoading]);

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
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        <img src="/photo_2026-01-09_15-11-39-removebg-preview.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-lg font-bold block">احجزلي</span>
                        <p className="text-xs text-sidebar-foreground/60 truncate">{partner?.company_name || "لوحة التحكم"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="p-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {sidebarSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            <h3 className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.links.map((link) => {
                                    if (isLoading) {
                                        return (
                                            <div key={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-40 animate-pulse">
                                                <link.icon className="w-5 h-5 shrink-0" />
                                                <div className="h-4 bg-sidebar-foreground/20 rounded w-24"></div>
                                            </div>
                                        );
                                    }

                                    const isPartner = userRole?.role === 'PARTNER_ADMIN';
                                    const isAdmin = userRole?.role === 'SUPERUSER';
                                    const isOwner = isPartner || isAdmin;

                                    if (link.href === "/dashboard/permissions" && !isOwner && !can('employees.manage')) return null;
                                    if (link.href === "/dashboard/fleet" && !isOwner && !can('fleet.view')) return null;
                                    if (link.href === "/dashboard/routes" && !isOwner && !can('routes.view')) return null;
                                    if (link.href === "/dashboard/trips" && !isOwner && !can('trips.view')) return null;
                                    if (link.href === "/dashboard/drivers" && !isOwner && !can('employees.view')) return null;
                                    if (link.href === "/dashboard/employees" && !isOwner && !can('employees.view')) return null;
                                    if (link.href === "/dashboard/bookings" && !isOwner && !can('bookings.view')) return null;
                                    if (link.href === "/dashboard/ratings" && !isOwner && !can('trips.view')) return null;
                                    if (link.href === "/dashboard/reports" && !isOwner && !can('reports.view')) return null;
                                    if (link.href === "/dashboard/settings" && !isOwner && !can('settings.manage')) return null;
                                    if (link.href === "/dashboard/cancellation-policies" && !isOwner && !can('settings.manage')) return null;
                                    if (link.href === "/dashboard/cancellation-approvals" && !isOwner) return null;
                                    if (link.href === "/dashboard/branches" && !isOwner && !can('fleet.view')) return null;
                                    if (link.href === "/dashboard/payments" && !isOwner && !can('finance.view')) return null;
                                    if (link.href === "/dashboard/withdrawals" && !isAdmin) return null;
                                    if (link.href === "/dashboard/deposits" && !isAdmin) return null;
                                    if (link.href === "/dashboard/admin-wallets" && !isAdmin) return null;
                                    if (link.href === "/dashboard/financial-analytics" && !isAdmin && !isPartner) return null;
                                    if (link.href === "/dashboard/partner-settlements" && !isAdmin) return null;

                                    const badgeCount = link.badgeKey ? badges[link.badgeKey] : 0;

                                    return (
                                        <PrefetchLink
                                            key={link.href}
                                            to={link.href}
                                            onClick={() => setIsSidebarOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group ${location.pathname === link.href
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <link.icon className="w-5 h-5 shrink-0" />
                                                <span>{link.label}</span>
                                            </div>
                                            {badgeCount > 0 && (
                                                <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px]">
                                                    {badgeCount}
                                                </Badge>
                                            )}
                                        </PrefetchLink>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-sidebar-border shrink-0">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-5 h-5 ml-2 shrink-0" />
                        تسجيل الخروج
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
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full border border-secondary/20">
                                <Wallet className="w-4 h-4 text-secondary" />
                                <span className="text-sm font-black text-secondary">
                                    {wallet?.balance?.toLocaleString() || '0'} {wallet?.currency || 'ر.س'}
                                </span>
                            </div>
                            <NotificationBell />
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium overflow-hidden">
                                {partner?.company_name?.[0] || 'س'}
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
