import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
      if (!user) {
        console.log("ProtectedRoute: No user, redirecting to", redirectTo);
        navigate(redirectTo);
        return;
      }

      // Check account status
      if (userStatus && userStatus !== 'active' && userRole?.role !== 'SUPERUSER') {
        console.log("ProtectedRoute: Inactive user", userStatus);
        navigate('/login');
        return;
      }

      // If specific roles are required, check them
      if (allowedRoles && allowedRoles.length > 0) {
        console.log("ProtectedRoute: Checking roles", { required: allowedRoles, current: userRole?.role });

        if (!userRole || !allowedRoles.includes(userRole.role)) {
          console.log("ProtectedRoute: Role mismatch or missing");
          // Redirect based on user's actual role
          if (userRole?.role === 'SUPERUSER') {
            navigate('/admin');
          } else if (userRole?.role === 'PARTNER_ADMIN' || ['manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant'].includes(userRole?.role || '')) {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
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
