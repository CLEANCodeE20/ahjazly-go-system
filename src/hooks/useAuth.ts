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

  const fetchUserRole = async (userId: string, retries = 3, delay = 1000) => {
    try {
      // 1. Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, partner_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }

      // RETRY LOGIC: If no role found and we have retries left, wait and try again
      // Using exponential backoff: 1s, 2s, 4s
      if (!roleData && retries > 0) {
        console.log(`Role not found, retrying in ${delay}ms... (${retries} attempts left)`);
        setTimeout(() => {
          fetchUserRole(userId, retries - 1, delay * 2); // Exponential backoff
        }, delay);
        return;
      }

      // 2. Fetch account status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_status')
        .eq('auth_id', userId)
        .limit(1)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user status:', userError);
      }

      setAuthState(prev => ({
        ...prev,
        userRole: roleData ? { role: roleData.role as AppRole, partner_id: roleData.partner_id } : null,
        userStatus: userData?.account_status || 'active',
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      // If error (network etc), stop loading so UI shows something
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
