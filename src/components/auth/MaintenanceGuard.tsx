import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUISiteSettings } from "@/hooks/useSDUI";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MaintenanceGuardProps {
    children: ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
    const { data: siteSettings = [], isLoading: loadingSettings } = useUISiteSettings();
    const { user, isAdmin, isLoading: loadingAuth } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const isMaintenanceMode = siteSettings.find(s => s.setting_key === 'maintenance_mode')?.setting_value === 'true';
    const isPublicPage = ['/login', '/maintenance', '/auth'].some(path => location.pathname.startsWith(path));

    useEffect(() => {
        if (!loadingSettings && !loadingAuth) {
            if (isMaintenanceMode && !isAdmin() && !isPublicPage) {
                navigate('/maintenance', { replace: true });
            } else if (!isMaintenanceMode && location.pathname === '/maintenance') {
                navigate('/', { replace: true });
            }
        }
    }, [isMaintenanceMode, isAdmin, isPublicPage, location.pathname, loadingSettings, loadingAuth, navigate]);

    // CRITICAL: Allow 2FA pages to render immediately to prevent loading hangs
    if (location.pathname.includes('2fa-')) {
        return <>{children}</>;
    }

    if (loadingSettings || loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return <>{children}</>;
};
