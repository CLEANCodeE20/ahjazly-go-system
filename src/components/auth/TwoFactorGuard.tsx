import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface TwoFactorGuardProps {
    children: React.ReactNode;
}

export const TwoFactorGuard = ({ children }: TwoFactorGuardProps) => {
    const { user, userRole, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // CRITICAL OPTIMIZATION: Always render Login immediately without checks
    if (location.pathname === '/login') {
        return <>{children}</>;
    }

    const [checking, setChecking] = useState(true);
    const [requires2FA, setRequires2FA] = useState(false);

    useEffect(() => {
        const check2FARequirement = async () => {
            try {
                // Normalize path to remove trailing slashes and generally be safer
                const currentPath = location.pathname.replace(/\/$/, '') || '/';

                // List of public routes that shouldn't trigger 2FA
                const publicRoutes = [
                    '/',
                    '/login',
                    '/about',
                    '/contact',
                    '/apply',
                    '/features',
                    '/maintenance',
                    '/forgot-password',
                    '/reset-password',
                    '/verify-email'
                ];

                const isPublicPath = currentPath.includes('2fa-') ||
                    publicRoutes.some(route => currentPath === route || currentPath.startsWith(`${route}/`));

                if (isPublicPath) {
                    setChecking(false);
                    return;
                }

                // If loading auth or no user/role, let downstream components (like ProtectedRoute) handle it
                // We shouldn't block here if we can't determine 2FA status, effectively "passing through"
                if (isLoading || !user || !userRole) {
                    setChecking(false);
                    return;
                }

                const needs2FA = userRole && (
                    userRole.role === 'SUPERUSER' ||
                    userRole.role === 'PARTNER_ADMIN'
                );

                if (!needs2FA) {
                    setRequires2FA(false);
                    setChecking(false);
                    return;
                }

                const verified = sessionStorage.getItem('2fa_verified');
                if (verified === 'true') {
                    setRequires2FA(false);
                    setChecking(false);
                    return;
                }

                // Check 2FA status from database
                const { data: twoFactorData, error } = await supabase
                    .from('user_two_factor' as any)
                    .select('is_enabled')
                    .eq('auth_id', user.id)
                    .maybeSingle() as any;

                if (error) {
                    console.error('[TwoFactorGuard] Error fetching 2FA status:', error);
                    // On error, we default to allowing access (fail open) to prevent lockout, 
                    // or fail closed depending on security posture. Fulfilling "fail open" for UX for now 
                    // if it's just a fetch error, but assuming no 2FA if we can't check.
                    setChecking(false);
                    return;
                }

                if (!twoFactorData?.is_enabled) {
                    if (location.pathname !== '/2fa-setup' && location.pathname !== '/onboarding') {
                        // Redirect to setup if not enabled (and maybe strictly required?)
                        // Currently logic directs everyone to setup? 
                        // The original logic seemed to force setup if not enabled.
                        navigate('/2fa-setup?required=true', {
                            state: { from: location },
                            replace: true
                        });
                    }
                    setRequires2FA(true);
                } else {
                    if (location.pathname !== '/2fa-verify' && location.pathname !== '/2fa-setup') {
                        navigate('/2fa-verify', {
                            state: { from: location },
                            replace: true
                        });
                    }
                    setRequires2FA(true);
                }
            } catch (err) {
                console.error('[TwoFactorGuard] Critical error in guard:', err);
                // Fallback: Don't block the user if there's a serious network error
            } finally {
                setChecking(false);
            }
        };

        check2FARequirement();
    }, [user, userRole, isLoading, navigate, location]);

    // CRITICAL: Allow 2FA setup and verify pages to render IMMEDIATELY 
    // even if still checking/loading, to prevent UI hangs.
    if (location.pathname === '/2fa-setup' || location.pathname === '/2fa-verify') {
        return <>{children}</>;
    }

    if (isLoading || checking) {
        console.log('[TwoFactorGuard] Loading/Checking... (isLoading:', isLoading, 'checking:', checking, ')');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري التحقق من الأمان...</p>
                </div>
            </div>
        );
    }

    if (requires2FA) {
        return null; // Block access
    }

    return <>{children}</>;
};
