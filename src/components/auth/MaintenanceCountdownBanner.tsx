import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useUISiteSettings } from '@/hooks/useSDUI';
import { differenceInMinutes, differenceInSeconds, parseISO, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

export const MaintenanceCountdownBanner = () => {
    const { data: siteSettings = [] } = useUISiteSettings();
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');

    useEffect(() => {
        const checkSchedule = () => {
            const scheduledStartStr = siteSettings.find(s => s.setting_key === 'maintenance_scheduled_start')?.setting_value;
            const thresholdStr = siteSettings.find(s => s.setting_key === 'maintenance_warning_threshold')?.setting_value || '30';

            if (!scheduledStartStr) {
                setIsVisible(false);
                return;
            }

            const scheduledStart = parseISO(scheduledStartStr);
            if (!isValid(scheduledStart)) {
                setIsVisible(false);
                return;
            }

            const now = new Date();
            const minutesUntilStart = differenceInMinutes(scheduledStart, now);
            const secondsUntilStart = differenceInSeconds(scheduledStart, now);
            const threshold = parseInt(thresholdStr, 10);

            // Hide if maintenance has already started (Guard will handle redirect) or if it's too far in future
            if (secondsUntilStart <= 0 || minutesUntilStart > threshold) {
                setIsVisible(false);
                return;
            }

            // Determine urgency
            if (minutesUntilStart < 5) setUrgency('high');
            else if (minutesUntilStart < 15) setUrgency('medium');
            else setUrgency('low');

            // Format time left
            const minutes = Math.floor(secondsUntilStart / 60);
            const seconds = secondsUntilStart % 60;
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            setIsVisible(true);
        };

        // Check immediately
        checkSchedule();

        // Update every second
        const interval = setInterval(checkSchedule, 1000);

        return () => clearInterval(interval);
    }, [siteSettings]);

    if (!isVisible) return null;

    const getColors = () => {
        switch (urgency) {
            case 'high': return 'bg-destructive text-destructive-foreground animate-pulse';
            case 'medium': return 'bg-orange-500 text-white';
            case 'low': return 'bg-yellow-500 text-white';
        }
    };

    return (
        <div className={`${getColors()} w-full px-4 py-3 shadow-md fixed top-0 left-0 z-[100] transition-colors duration-500`}>
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-sm md:text-base">
                        تنبيه: سيبدأ النظام في إجراء أعمال صيانة مجدولة قريباً. يرجى حفظ جميع أعمالك.
                    </span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold dir-ltr">
                        {timeLeft}
                    </span>
                </div>
            </div>
        </div>
    );
};
