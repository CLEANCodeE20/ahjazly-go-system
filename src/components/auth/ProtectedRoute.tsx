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
        navigate(redirectTo);
        return;
      }

      // Check account status
      if (userStatus && userStatus !== 'active' && userRole?.role !== 'admin') {
        navigate('/login');
        return;
      }

      // If specific roles are required, check them
      if (allowedRoles && allowedRoles.length > 0) {
        if (!userRole || !allowedRoles.includes(userRole.role)) {
          // Redirect based on user's actual role
          if (userRole?.role === 'admin') {
            navigate('/admin');
          } else if (userRole?.role === 'partner' || userRole?.role === 'employee') {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        }
      }
    }
  }, [user, userRole, isLoading, navigate, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole.role)) {
      return null;
    }
  }

  if (userStatus && userStatus !== 'active' && userRole?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
