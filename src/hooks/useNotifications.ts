import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Notification {
    notification_id: number;
    user_id: number | null;
    partner_id: number | null;
    type: 'booking' | 'payment' | 'trip' | 'system' | 'promotion';
    title: string | null;
    message: string;
    action_url: string | null;
    is_read: boolean;
    priority: 'low' | 'medium' | 'high';
    sent_at: string;
    metadata: Record<string, any>;
}

export const useNotifications = () => {
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("sent_at", { ascending: false });

            if (error) throw error;
            return data as any as Notification[];
        },
    });

    // Calculate unread count
    useEffect(() => {
        const count = notifications.filter(n => !n.is_read).length;
        setUnreadCount(count);
    }, [notifications]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel("notifications-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    queryClient.setQueryData(["notifications"], (old: Notification[] = []) => [
                        newNotification,
                        ...old,
                    ]);

                    toast(newNotification.title || "إشعار جديد", {
                        description: newNotification.message,
                        action: newNotification.action_url ? {
                            label: "عرض",
                            onClick: () => window.location.href = newNotification.action_url!
                        } : undefined,
                    });

                    // Play sound
                    new Audio("/notification.mp3").play().catch(() => { });
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "notifications" },
                (payload) => {
                    const updatedNotification = payload.new as Notification;
                    queryClient.setQueryData(["notifications"], (old: Notification[] = []) =>
                        old.map((n) =>
                            n.notification_id === updatedNotification.notification_id
                                ? updatedNotification
                                : n
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const markAsRead = useMutation({
        mutationFn: async (id: number) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("notification_id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("is_read", false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
    };
};
