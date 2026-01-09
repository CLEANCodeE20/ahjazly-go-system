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
    ClipboardList
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const adminSidebarLinks = [
    { href: "/admin", label: "طلبات الانضمام", icon: ClipboardList },
    { href: "/admin/partners", label: "إدارة الشركاء", icon: Building2 },
    { href: "/admin/cities", label: "المدن والمناطق", icon: MapPin },
    { href: "/admin/staff", label: "طاقم المنصة", icon: Shield },
    { href: "/admin/users", label: "دليل المستخدمين", icon: Users },
    { href: "/admin/commissions", label: "العمولات", icon: DollarSign },
    { href: "/admin/reports", label: "التقارير المالية", icon: BarChart3 },
    { href: "/admin/notifications", label: "الإشعارات العامّة", icon: Bell },
    { href: "/admin/banners", label: "إدارة السلايدر", icon: ImageIcon },
    { href: "/admin/faqs", label: "الأسئلة الشائعة", icon: HelpCircle },
    { href: "/admin/support", label: "مركز الدعم", icon: LifeBuoy },
    { href: "/admin/audit-logs", label: "سجل العمليات", icon: History },
    { href: "/admin/policies", label: "الشروط والسياسات", icon: ScrollText },
    { href: "/admin/sdui", label: "إدارة الواجهة", icon: Palette },
    { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings }
];

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar = ({ isOpen = false, onClose }: AdminSidebarProps) => {
    const location = useLocation();
    const { signOut } = useAuth();

    return (
        <aside
            className={`fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 flex flex-col border-l border-sidebar-border ${isOpen ? "translate-x-0" : "translate-x-full"
                } lg:translate-x-0`}
        >
            <div className="flex items-center gap-3 p-4 border-b border-sidebar-border shrink-0">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden">
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
                {adminSidebarLinks.map((link) => {
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
                })}
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
