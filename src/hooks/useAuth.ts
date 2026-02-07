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

  const fetchUserRole = async (userId: string, retries = 3, delay = 200) => {
    try {
      // 1. JWT Claims Check (The Gold Standard - Instant)
      const { data: { session } } = await supabase.auth.getSession();
      const jwtRole = session?.user?.app_metadata?.role as AppRole | undefined;
      const jwtPartnerId = session?.user?.app_metadata?.partner_id as number | undefined;

      // OPTIMIZATION: If we have the role in JWT, trust it and skip DB calls!
      // EXCEPTION: If role is 'TRAVELER' or 'user', we must verify against DB because they might have been upgraded
      // to PARTNER_ADMIN or other roles without the JWT updating yet.
      // EXCEPTION 2: If role is a Partner role (Admin or Employee) but we don't have the partner_id, we MUST fetch from DB
      const partnerRoles = ['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor', 'driver', 'assistant'];
      const isPartnerWithoutId = partnerRoles.includes(jwtRole as string) && !jwtPartnerId;

      const isDefaultRole = jwtRole === 'TRAVELER' || (jwtRole as string) === 'user' || isPartnerWithoutId;

      if (jwtRole && !isDefaultRole) {
        console.log(`[Auth] ⚡ Fast Login: Using JWT Metadata (Role: ${jwtRole})`);

        setAuthState(prev => ({
          ...prev,
          userRole: {
            role: jwtRole,
            partner_id: jwtPartnerId || null,
            auth_id: userId
          },
          userStatus: 'active', // Assume active if they could sign in (Auth guards suspended users)
          isLoading: false,
        }));
        return;
      }

      console.log(`[Auth] Metadata missing, falling back to DB... (retries: ${retries})`);

      // 2. Database Fetch (Parallel fallback & Extra data)
      // Only run this if JWT is missing data (e.g. legacy users)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_status, partner_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (userError) console.error('[Auth] Profile fetch error:', userError);

      // 3. Fallback/Supplement from user_roles
      let finalRole: AppRole | null = null;
      let rolePartnerId: number | null = null;

      // @ts-ignore - Supabase type depth issue
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, partner_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (roleData) {
        finalRole = roleData.role as AppRole;
        rolePartnerId = roleData.partner_id;
      }

      // NORMALIZE LEGACY ROLES
      if ((finalRole as string) === 'user' || (finalRole as string) === 'customer') {
        finalRole = 'TRAVELER';
      }
      if ((finalRole as string) === 'partner') {
        finalRole = 'PARTNER_ADMIN';
      }

      // 4. Identification logic
      let finalPartnerId = jwtPartnerId || userData?.partner_id || rolePartnerId || null;
      let finalStatus = userData?.account_status || null;
      let effectiveStatus = finalStatus || 'active';

      // 5. Retry Logic
      const hasNoData = !finalRole && !userData && !roleData;

      if (hasNoData && retries > 0) {
        setTimeout(() => fetchUserRole(userId, retries - 1, delay * 1.5), delay);
        return;
      }

      // 6. Set State
      const resolvedRole = finalRole || 'TRAVELER'; // Fallback to TRAVELER to prevent login hang

      if (!finalRole) {
        console.warn(`[Auth] No role found for user ${userId} - Defaulting to TRAVELER to allow UI processing`);
      }

      setAuthState(prev => ({
        ...prev,
        userRole: {
          role: resolvedRole,
          partner_id: finalPartnerId,
          auth_id: userId
        },
        userStatus: effectiveStatus,
        isLoading: false,
      }));

    } catch (err) {
      console.error('[Auth] Critical error:', err);
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
