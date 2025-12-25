import { Bell, Check, Info, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const priorityIcons = {
    low: <Info className="w-4 h-4 text-blue-500" />,
    medium: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    high: <AlertCircle className="w-4 h-4 text-red-500" />,
};

export const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead.mutate(notification.notification_id);
        }
        if (notification.action_url) {
            navigate(notification.action_url);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "+9" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">الإشعارات</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            <Check className="w-3 h-3 ml-1" />
                            تحديد الكل كمقروء
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">لا توجد إشعارات حالياً</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.notification_id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 text-right hover:bg-muted/50 transition-colors border-b last:border-0",
                                        !notification.is_read && "bg-primary/5"
                                    )}
                                >
                                    <div className="mt-1">
                                        {priorityIcons[notification.priority]}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-sm font-medium",
                                                !notification.is_read && "text-primary"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.sent_at), {
                                                    addSuffix: true,
                                                    locale: ar,
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        {notification.action_url && (
                                            <div className="flex items-center gap-1 text-[10px] text-primary mt-1">
                                                <ExternalLink className="w-3 h-3" />
                                                <span>عرض التفاصيل</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/notifications")}>
                        عرض كل الإشعارات
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
