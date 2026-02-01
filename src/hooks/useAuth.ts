import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useFCM } from './useFCM';
import { ErrorLogger } from '@/utils/ErrorLogger';

export type AppRole =
  | 'SUPERUSER'
  | 'PARTNER_ADMIN'
  | 'manager'
  | 'accountant'
  | 'support'
  | 'supervisor'
  | 'driver'
  | 'assistant'
  | 'TRAVELER'
  | 'DRIVER'
  | 'AGENT'
  | 'CUSTOMER_SUPPORT';

interface UserRole {
  role: AppRole;
  partner_id: number | null;
  auth_id: string | null;
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
    try {
      console.log(`[Auth] Resolving identity for ${userId}...`);

      // 1. JWT Claims Check (The Gold Standard - Instant)
      const { data: { session } } = await supabase.auth.getSession();
      const jwtRole = session?.user?.app_metadata?.role as AppRole | undefined;

      // 2. Database Fetch (Parallel fallback & Extra data)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_status, partner_id') // Removed user_id and user_type
        .eq('auth_id', userId)
        .maybeSingle();

      if (userError) console.error('[Auth] Profile fetch error:', userError);

      // 3. Fallback/Supplement from user_roles
      let finalRole: AppRole | null = jwtRole || null;
      let rolePartnerId: number | null = null;

      // Always fetch from user_roles to get partner_id even if role is in JWT
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, partner_id')
        .eq('auth_id', userId) // Changed from user_id to auth_id
        .maybeSingle();

      if (roleData) {
        if (!finalRole) finalRole = roleData.role as AppRole;
        rolePartnerId = roleData.partner_id;
      }

      // 4. Identification logic
      // Priority: users table (profile) -> user_roles table -> null
      let finalPartnerId = userData?.partner_id || rolePartnerId || null;

      // 5. Retry logic if essential data is missing (only if no role found at all)
      if (!finalRole && !userData && retries > 0) {
        console.log(`[Auth] Profile not found yet, retrying... (${retries} left)`);
        setTimeout(() => fetchUserRole(userId, retries - 1, delay * 1.5), delay);
        return;
      }

      setAuthState(prev => ({
        ...prev,
        userRole: finalRole ? {
          role: finalRole,
          partner_id: finalPartnerId,
          auth_id: userId // Renamed from user_id to auth_id
        } : null,
        userStatus: userData?.account_status || 'active',
        isLoading: false,
      }));

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

  const isAdmin = () => authState.userRole?.role === 'SUPERUSER';
  const isPartner = () => authState.userRole?.role === 'PARTNER_ADMIN';
  const isEmployee = () => ['manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant'].includes(authState.userRole?.role || '');

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
