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
    FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const adminSidebarLinks = [
    { href: "/admin", label: "طلبات الانضمام", icon: FileText },
    { href: "/admin/partners", label: "الشركاء", icon: Building2 },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/commissions", label: "العمولات", icon: DollarSign },
    { href: "/admin/reports", label: "التقارير المالية", icon: BarChart3 },
    { href: "/admin/settings", label: "إعدادات المنصة", icon: Settings }
];

const AdminSidebar = () => {
    const location = useLocation();
    const { signOut } = useAuth();

    return (
        <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground p-4 hidden lg:block border-l border-sidebar-border">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                    <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                    <span className="text-lg font-bold">احجزلي</span>
                    <p className="text-xs text-sidebar-foreground/60">لوحة الإدارة</p>
                </div>
            </div>

            <nav className="space-y-1">
                {adminSidebarLinks.map((link) => (
                    <Link
                        key={link.href}
                        to={link.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === link.href
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            }`}
                    >
                        <link.icon className="w-5 h-5" />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-5 h-5 ml-2" />
                    تسجيل الخروج
                </Button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
