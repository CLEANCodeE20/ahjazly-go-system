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
    const [checking, setChecking] = useState(true);
    const [requires2FA, setRequires2FA] = useState(false);

    useEffect(() => {
        const check2FARequirement = async () => {
            try {
                if (location.pathname.includes('2fa-')) {
                    setChecking(false);
                    return;
                }

                if (isLoading || !user || !userRole) {
                    return;
                }

                const requiresAuth = userRole.role === 'admin' || userRole.role === 'partner';

                if (!requiresAuth) {
                    setRequires2FA(false);
                    return;
                }

                const verified = sessionStorage.getItem('2fa_verified');
                if (verified === 'true') {
                    setRequires2FA(false);
                    return;
                }

                const { data: twoFactorData } = await supabase
                    .from('user_two_factor' as any)
                    .select('is_enabled')
                    .eq('auth_id', user.id)
                    .maybeSingle() as any;

                if (!twoFactorData?.is_enabled) {
                    if (location.pathname !== '/2fa-setup' && location.pathname !== '/onboarding') {
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
                console.error('[2FA_GUARD] Critical error in guard:', err);
                // Fallback: Don't block the user if there's a serious network error during checks
                // but keep the requirement state as is.
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
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري التحقق من الأمان...</p>
                </div>
            </div>
        );
    }

    // Block access if 2FA is required but not verified
    if (requires2FA) {
        return null;
    }

    return <>{children}</>;
};
