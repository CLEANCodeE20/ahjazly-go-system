import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, userRole, userStatus, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      // Prevent infinite redirect loops
      const lastRedirect = sessionStorage.getItem('last_redirect');
      const currentPath = window.location.pathname;

      if (!user) {
        console.log("ProtectedRoute: No user, redirecting to", redirectTo);

        // Only redirect if we haven't just redirected from this path
        if (lastRedirect !== currentPath) {
          sessionStorage.setItem('last_redirect', currentPath);
          navigate(redirectTo, { replace: true });
        }
        return;
      }

      if (userRole?.role === 'TRAVELER') {
        console.warn('[Security] TRAVELER role detected in ProtectedRoute - blocking access');
        sessionStorage.removeItem('last_redirect');

        toast({
          title: "وصول غير مصرح",
          description: "هذه المنصة غير متاحة للعملاء. يرجى استخدام التطبيق للحجز.",
          variant: "destructive"
        });

        navigate('/login', { replace: true });
        return;
      }

      // Clear redirect tracking when user is authenticated
      sessionStorage.removeItem('last_redirect');

      // Check account status
      if (userStatus && userStatus !== 'active' && userRole?.role !== 'SUPERUSER') {
        console.log("ProtectedRoute: Inactive user", userStatus);

        if (userStatus === 'pending') {
          // Redirect to status page instead of login to avoid loop
          if (window.location.pathname !== '/application-status') {
            navigate('/application-status', { replace: true });
          }
        } else {
          navigate('/login', { replace: true });
        }
        return;
      }

      // If specific roles are required, check them
      if (allowedRoles && allowedRoles.length > 0) {
        console.log("[ProtectedRoute] Checking roles:", { required: allowedRoles, current: userRole?.role, user_id: user.id });

        if (!userRole || !allowedRoles.includes(userRole.role)) {
          console.warn("[ProtectedRoute] Role mismatch or missing! Redirecting to login.", {
            userRoleFn: userRole,
            allowedRoles
          });

          // Redirect based on user's actual role
          if (userRole?.role === 'SUPERUSER') {
            navigate('/admin', { replace: true });
          } else if (userRole?.role === 'PARTNER_ADMIN' || ['manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant'].includes(userRole?.role || '')) {
            navigate('/dashboard', { replace: true });
          } else {
            console.log("[ProtectedRoute] Denying access -> /login");
            navigate('/login', { replace: true });
          }
        } else {
          console.log("[ProtectedRoute] Access Granted ✅");
        }
      }
    }
  }, [user, userRole, isLoading, navigate, allowedRoles, redirectTo, userStatus]);

  if (isLoading && !window.location.pathname.includes('2fa-')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user && !window.location.pathname.includes('2fa-')) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !window.location.pathname.includes('2fa-')) {
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      return null;
    }
  }

  if (userStatus && userStatus !== 'active' && userRole?.role !== 'SUPERUSER' && !window.location.pathname.includes('2fa-')) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
