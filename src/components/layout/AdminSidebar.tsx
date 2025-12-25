import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Bus,
    LayoutDashboard,
    Users,
    Building2,
    DollarSign,
    BarChart3,
    Settings,
    LogOut,
    FileText,
    Palette,
    Bell
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "../notifications/NotificationBell";

const adminSidebarLinks = [
    { href: "/admin", label: "طلبات الانضمام", icon: FileText },
    { href: "/admin/partners", label: "الشركاء", icon: Building2 },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/commissions", label: "العمولات", icon: DollarSign },
    { href: "/admin/reports", label: "التقارير المالية", icon: BarChart3 },
    { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
    { href: "/admin/sdui", label: "إدارة الواجهة", icon: Palette },
    { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings }
];

const AdminSidebar = () => {
    const location = useLocation();
    const { signOut } = useAuth();

    return (
        <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground hidden lg:flex lg:flex-col border-l border-sidebar-border">
            <div className="flex items-center gap-3 p-4 mb-4 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                    <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                    <span className="text-lg font-bold">احجزلي</span>
                    <p className="text-xs text-sidebar-foreground/60">لوحة الإدارة</p>
                </div>
                <div className="mr-auto">
                    <NotificationBell />
                </div>
            </div>

            <nav className="space-y-1 px-2 flex-1 overflow-y-auto custom-scrollbar">
                {adminSidebarLinks.map((link) => (
                    <Link
                        key={link.href}
                        to={link.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === link.href
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                    >
                        <link.icon className="w-5 h-5 shrink-0" />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 shrink-0 mt-auto border-t border-sidebar-border/50">
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
    );
};

export default AdminSidebar;
