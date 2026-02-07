import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Users,
    Building2,
    DollarSign,
    BarChart3,
    Settings,
    LogOut,
    Palette,
    Bell,
    MapPin,
    LifeBuoy,
    HelpCircle,
    Image as ImageIcon,
    X,
    Shield,
    History,
    ScrollText,
    ClipboardList,
    ArrowRightLeft,
    Wallet
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

interface SidebarLink {
    href: string;
    label: string;
    icon: any;
    permission?: string; // Optional: if not set, everyone sees it (or maybe only admins/partners?)
    hideForRoles?: string[]; // Optional: roles that should NOT see this link
}

const adminSidebarLinks: SidebarLink[] = [
    { href: "/admin", label: "طلبات الانضمام", icon: ClipboardList, permission: "partners.manage" }, // Assuming partners.manage for requests
    { href: "/admin/partners", label: "إدارة الشركاء", icon: Building2, permission: "partners.view" },
    { href: "/admin/cities", label: "المدن والمناطق", icon: MapPin, permission: "routes.manage" }, // Cities usually with routes
    { href: "/admin/staff", label: "طاقم المنصة", icon: Shield, permission: "users.manage" },
    { href: "/admin/users", label: "دليل المستخدمين", icon: Users, permission: "users.view" },
    { href: "/dashboard/drivers", label: "إدارة السائقين", icon: Users, permission: "fleet.view", hideForRoles: ['SUPERUSER'] },
    { href: "/admin/commissions", label: "العمولات", icon: DollarSign, permission: "financial.view" },
    { href: "/admin/reports", label: "التقارير المالية", icon: BarChart3, permission: "financial.view" },
    { href: "/dashboard/partner-settlements", label: "تسويات الشركاء", icon: ArrowRightLeft, permission: "financial.view" },
    { href: "/dashboard/admin-wallets", label: "إدارة المحافظ", icon: Wallet, permission: "financial.view" },
    { href: "/admin/notifications", label: "الإشعارات العامّة", icon: Bell, permission: "settings.edit" },
    { href: "/admin/banners", label: "إدارة السلايدر", icon: ImageIcon, permission: "settings.edit" },
    { href: "/admin/faqs", label: "الأسئلة الشائعة", icon: HelpCircle, permission: "settings.edit" },
    { href: "/admin/support", label: "مركز الدعم", icon: LifeBuoy, permission: "bookings.view" }, // Support usually needs booking access
    { href: "/admin/audit-logs", label: "سجل العمليات", icon: History, permission: "settings.view" },
    { href: "/admin/policies", label: "الشروط والسياسات", icon: ScrollText, permission: "settings.edit" },
    { href: "/admin/sdui", label: "إدارة الواجهة", icon: Palette, permission: "settings.edit" },
    { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings, permission: "settings.view" }
];

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar = ({ isOpen = false, onClose }: AdminSidebarProps) => {
    const location = useLocation();
    const { signOut, userRole } = useAuth();
    const { can, loading } = usePermissions();

    // Filter links based on permissions
    const filteredLinks = adminSidebarLinks.filter(link => {
        // Check if explicitly hidden for this role
        if (userRole?.role && link.hideForRoles?.includes(userRole.role)) {
            return false;
        }

        if (!link.permission) return true; // No permission required? Show it.
        return can(link.permission);
    });

    return (
        <aside
            className={`fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 flex flex-col border-l border-sidebar-border ${isOpen ? "translate-x-0" : "translate-x-full"
                } lg:translate-x-0`}
        >
            <div className="flex items-center gap-3 p-4 border-b border-sidebar-border shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                    <img src="/photo_2026-01-09_15-11-39-removebg-preview.png" alt="احجزلي" className="w-8 h-8 object-contain" />
                </div>
                <div className="flex-1">
                    <span className="text-lg font-bold block">احجزلي</span>
                    <p className="text-xs text-sidebar-foreground/60">لوحة الإدارة</p>
                </div>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">جاري التحميل...</div>
                ) : (
                    filteredLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                    }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })
                )}
            </nav>

            <div className="p-4 shrink-0 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 group"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-5 h-5 ml-2 shrink-0 transition-transform group-hover:translate-x-1" />
                    تسجيل الخروج
                </Button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
