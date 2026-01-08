import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ErrorLogger } from '@/utils/ErrorLogger';

/**
 * NetworkMonitor
 * Monitors internet connectivity and notifies users of changes
 */
export const NetworkMonitor = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            ErrorLogger.info('Network connection restored');

            toast({
                title: 'تم استعادة الاتصال',
                description: 'تم الاتصال بالإنترنت بنجاح',
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
            ErrorLogger.warn('Network connection lost');

            toast({
                title: 'انقطع الاتصال',
                description: 'يرجى التحقق من اتصالك بالإنترنت',
                variant: 'destructive',
            });
        };

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Log initial state
        ErrorLogger.info(`Network status: ${isOnline ? 'Online' : 'Offline'}`);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return null;
};
