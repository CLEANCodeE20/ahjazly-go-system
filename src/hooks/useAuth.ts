import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userRole: null,
    userStatus: null,
    isLoading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

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
        .select('user_type, account_status, partner_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (userError) console.error('[Auth] users fetch error:', userError);

      // 3. Fallback logic: If user_roles is missing but users table has user_type
      let finalRole: AppRole | null = (roleData?.role as AppRole) || null;
      let finalPartnerId = roleData?.partner_id || userData?.partner_id || null;

      if (!finalRole && userData?.user_type) {
        console.warn(`[Auth] Role missing in user_roles, falling back to user_type: ${userData.user_type}`);
        // Map user_type to app_role
        if (userData.user_type === 'admin') finalRole = 'admin';
        else if (userData.user_type === 'partner') finalRole = 'partner';
        else finalRole = 'employee';
      }

      // 4. Retry logic if nothing found yet
      if (!finalRole && retries > 0) {
        console.log(`[Auth] No role found, retrying in ${delay}ms... (${retries} left)`);
        setTimeout(() => fetchUserRole(userId, retries - 1, delay * 1.5), delay);
        return;
      }

      // 5. Finalize state
      setAuthState(prev => ({
        ...prev,
        userRole: finalRole ? { role: finalRole, partner_id: finalPartnerId } : null,
        userStatus: userData?.account_status || 'active',
        isLoading: false,
      }));

      console.log('[Auth] Role resolution complete:', { role: finalRole, status: userData?.account_status });
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
    const { error } = await supabase.auth.signOut();
    return { error };
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
