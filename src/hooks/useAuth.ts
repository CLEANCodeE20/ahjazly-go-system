import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useFCM } from './useFCM';
import { ErrorLogger } from '@/utils/ErrorLogger';

export type AppRole = 'admin' | 'partner' | 'employee';

interface UserRole {
  role: AppRole;
  partner_id: number | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  userStatus: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userRole: null,
    userStatus: null,
    isLoading: true,
  });

  // FCM hook for push notifications
  const { requestPermission, saveFCMToken, isSupported } = useFCM();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (!session) {
          sessionStorage.removeItem('2fa_verified');
        }

        // Fetch user role after auth change
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            userRole: null,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string, retries = 5, delay = 200) => {
    // Optimization: Skip redundant calls if we already have the role for this user
    if (authState.userRole && authState.user?.id === userId && !authState.isLoading) {
      console.log('[Auth] Already resolved role for this user, skipping.');
      return;
    }

    try {
      console.log(`[Auth] Fetching role for ${userId}...`);

      // 1. Fetch role from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, partner_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) console.error('[Auth] user_roles fetch error:', roleError);

      // 2. Fetch profile from users (for status and fallback role)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, user_type, account_status, partner_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (userError) console.error('[Auth] users fetch error:', userError);

      // 3. Fallback logic: If user_roles is missing but users table has user_type
      let finalRole: AppRole | null = (roleData && roleData.role) ? (roleData.role as AppRole) : null;
      let finalPartnerId = roleData?.partner_id || userData?.partner_id || null;

      if (!finalRole && userData && (userData as any).user_type) {
        const userType = (userData as any).user_type;
        console.warn(`[Auth] Role missing in user_roles, falling back to user_type: ${userType}`);
        // Map user_type to app_role
        if (userType === 'admin') finalRole = 'admin';
        else if (userType === 'partner') finalRole = 'partner';
        else finalRole = 'employee';
      }

      // 4. Retry logic if nothing found yet
      // Only retry if we found a user data record but no role info could be determined
      // This prevents infinite loops if the user actually doesn't exist
      if (!finalRole && retries > 0 && userData) {
        console.log(`[Auth] Role undeterminable but user exists, retrying in ${delay}ms... (${retries} left)`);
        setTimeout(() => fetchUserRole(userId, retries - 1, delay * 1.5), delay);
        return;
      }

      setAuthState(prev => ({
        ...prev,
        userRole: finalRole ? { role: finalRole, partner_id: finalPartnerId } : null,
        userStatus: userData?.account_status || 'active',
        isLoading: false,
      }));

      // NOTE: We do NOT request permission automatically here anymore.
      // Browsers block programmatic permission requests.
      // It must be triggered by a user gesture (e.g. clicking a button).
    } catch (err) {
      console.error('[Auth] Critical error in fetchUserRole:', err);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      ErrorLogger.info('[Auth] Starting logout process...');

      // Step 1: Clear session storage
      sessionStorage.removeItem('2fa_verified');
      ErrorLogger.info('[Auth] Cleared session storage');

      // Step 2: Clear React Query cache to prevent data leaks
      queryClient.clear();
      ErrorLogger.info('[Auth] Cleared query cache');

      // Step 3: Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        ErrorLogger.log(error, '[Auth] Supabase signOut error');
        throw error;
      }

      ErrorLogger.info('[Auth] Supabase signOut successful');

      // Step 4: Reset auth state immediately
      setAuthState({
        user: null,
        session: null,
        userRole: null,
        userStatus: null,
        isLoading: false,
      });
      ErrorLogger.info('[Auth] Reset auth state');

      // Step 5: Navigate to login page (replace: true prevents back navigation)
      ErrorLogger.info('[Auth] Redirecting to login page');
      navigate('/login', { replace: true });

    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error('Unknown logout error'),
        '[Auth] Critical logout error - forcing redirect'
      );

      // Force redirect even on error to ensure user is logged out
      navigate('/login', { replace: true });
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return authState.userRole?.role === role;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isPartner = (): boolean => hasRole('partner');
  const isEmployee = (): boolean => hasRole('employee');

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    isPartner,
    isEmployee,
    refetchRole: () => authState.user && fetchUserRole(authState.user.id),
  };
};
