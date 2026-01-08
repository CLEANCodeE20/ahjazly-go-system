import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { NotificationBell } from "../notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

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
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="lg:mr-64 min-h-screen flex flex-col transition-all duration-300">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {actions}
                            <NotificationBell />
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium overflow-hidden">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-6 flex-1 overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
};
