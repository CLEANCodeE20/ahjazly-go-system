import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUISiteSettings } from "@/hooks/useSDUI";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { differenceInSeconds, parseISO, isValid } from 'date-fns';

interface MaintenanceGuardProps {
    children: ReactNode;
}

/**
 * MaintenanceGuard - Smart Maintenance Mode Protection
 * 
 * Features:
 * - Blocks all users except admins when maintenance mode is active
 * - Allows public pages (login, auth, 2fa) to always be accessible
 * - Automatically redirects admins away from maintenance page
 * - Syncs with database settings via React Query
 */
export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
    const { data: siteSettings = [], isLoading: loadingSettings } = useUISiteSettings();
    const { user, isAdmin, isLoading: loadingAuth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Define public pages that should always be accessible
    const publicPaths = ['/login', '/maintenance', '/auth', '/forgot-password', '/reset-password'];
    const isPublicPage = publicPaths.some(path => location.pathname.startsWith(path));

    // CRITICAL OPTIMIZATION: Always render public pages immediately
    if (isPublicPage || location.pathname.includes('2fa-')) {
        return <>{children}</>;
    }

    // Get maintenance mode status from settings
    const isMaintenanceMode = siteSettings.find(s => s.setting_key === 'maintenance_mode')?.setting_value === 'true';
    const scheduledStartStr = siteSettings.find(s => s.setting_key === 'maintenance_scheduled_start')?.setting_value;

    useEffect(() => {
        // Wait for both settings and auth to load
        if (loadingSettings || loadingAuth) return;

        const currentPath = location.pathname;
        let isMaintenanceActive = isMaintenanceMode;

        console.log('[MaintenanceGuard] Checking:', { currentPath, isMaintenanceActive, isAdmin: isAdmin(), isPublicPage });

        // Check if scheduled maintenance has started
        if (!isMaintenanceActive && scheduledStartStr) {
            const scheduledStart = parseISO(scheduledStartStr);
            if (isValid(scheduledStart)) {
                const secondsUntilStart = differenceInSeconds(scheduledStart, new Date());
                if (secondsUntilStart <= 0) {
                    isMaintenanceActive = true;
                }
            }
        }

        // Scenario 1: Maintenance is ON (Manual or Scheduled)
        if (isMaintenanceActive) {
            // Admin bypass: Admins can access everything
            if (isAdmin()) {
                // If admin is on maintenance page, redirect to admin dashboard
                if (currentPath === '/maintenance') {
                    console.log('[MaintenanceGuard] Admin on maintenance page -> Redirecting to /admin');
                    navigate('/admin', { replace: true });
                }
                // Otherwise, let them continue
                return;
            }

            // Regular users: redirect to maintenance page
            if (!isPublicPage) {
                console.log('[MaintenanceGuard] Maintenance Active -> Redirecting to /maintenance');
                navigate('/maintenance', { replace: true });
            }
        }

        // Scenario 2: Maintenance is OFF
        if (!isMaintenanceActive) {
            // If someone is on maintenance page but mode is off, redirect to home
            if (currentPath === '/maintenance') {
                console.log('[MaintenanceGuard] Maintenance Inactive -> Redirecting to /');
                navigate('/', { replace: true });
            }
        }
    }, [isMaintenanceMode, scheduledStartStr, isAdmin, isPublicPage, location.pathname, loadingSettings, loadingAuth, navigate]);

    // Show loading spinner while checking settings and auth
    if (loadingSettings || loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return <>{children}</>;
};
