import { useNotifications } from "@/hooks/useNotifications";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Bell,
    CheckCircle2,
    Clock,
    ExternalLink,
    AlertCircle,
    Info,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
    const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <AlertCircle className="w-5 h-5 text-destructive" />;
            case 'medium':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'low':
                return <Info className="w-5 h-5 text-blue-500" />;
            default:
                return <Bell className="w-5 h-5 text-muted-foreground" />;
        }
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.is_read) {
            markAsRead.mutate(notification.notification_id);
        }
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    return (
        <DashboardLayout
            title="الإشعارات"
            subtitle="عرض وإدارة جميع التنبيهات الخاصة بك"
            actions={
                notifications.some(n => !n.is_read) ? (
                    <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        تحديد الكل كمقروء
                    </Button>
                ) : undefined
            }
        >
            <div className="max-w-4xl mx-auto space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">جاري تحميل الإشعارات...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-card rounded-xl border border-dashed border-border">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Bell className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">لا توجد إشعارات</h3>
                            <p className="text-muted-foreground">ستظهر الإشعارات الجديدة هنا</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`p-4 transition-colors hover:bg-muted/50 cursor-pointer flex gap-4 ${!notification.is_read ? "bg-primary/5" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getPriorityIcon(notification.priority)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className={`font-semibold text-foreground truncate ${!notification.is_read ? "font-bold" : ""
                                                }`}>
                                                {notification.title || "تنبيه جديد"}
                                            </h4>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(notification.sent_at), {
                                                    addSuffix: true,
                                                    locale: ar,
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {notification.message}
                                        </p>
                                        {notification.action_url && (
                                            <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                                <span>عرض التفاصيل</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    {!notification.is_read && (
                                        <div className="shrink-0 self-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default NotificationsPage;
