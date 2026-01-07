import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    requestNotificationPermission,
    setupForegroundMessageListener,
    areNotificationsSupported,
    getNotificationPermission
} from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface UseFCMReturn {
    token: string | null;
    isSupported: boolean;
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    saveFCMToken: (userId: number) => Promise<boolean>;
    isLoading: boolean;
}

/**
 * Hook for managing Firebase Cloud Messaging tokens
 */
export const useFCM = (): UseFCMReturn => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported] = useState(areNotificationsSupported());
    const [permission, setPermission] = useState<NotificationPermission>(
        getNotificationPermission()
    );

    // Setup foreground message listener
    useEffect(() => {
        if (!isSupported) return;

        const unsubscribe = setupForegroundMessageListener((payload) => {
            console.log('📬 Received foreground notification:', payload);

            // Show toast notification
            toast({
                title: payload.notification?.title || 'إشعار جديد',
                description: payload.notification?.body || '',
                duration: 5000,
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isSupported]);

    /**
     * Request notification permission and get FCM token
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.warn('Notifications not supported in this browser');
            return false;
        }

        setIsLoading(true);
        try {
            const fcmToken = await requestNotificationPermission();

            if (fcmToken) {
                setToken(fcmToken);
                setPermission('granted');
                return true;
            } else {
                setPermission('denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported]);

    /**
     * Save FCM token to database (user_device_tokens table)
     */
    const saveFCMToken = useCallback(async (userId: number): Promise<boolean> => {
        if (!token) {
            console.warn('No FCM token to save');
            return false;
        }

        try {
            console.log(`💾 Saving FCM token for user ${userId}...`);

            const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent)
                ? 'mobile'
                : 'web';

            const { error: deviceError } = await supabase
                .from('user_device_tokens')
                .upsert({
                    user_id: userId,
                    device_type: deviceType,
                    fcm_token: token,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,fcm_token'
                });

            if (deviceError) {
                console.error('Error saving to user_device_tokens:', deviceError);
                return false;
            }

            console.log('✅ FCM token saved successfully to user_device_tokens');
            return true;
        } catch (error) {
            console.error('Error saving FCM token:', error);
            return false;
        }
    }, [token]);

    return {
        token,
        isSupported,
        permission,
        requestPermission,
        saveFCMToken,
        isLoading,
    };
};
