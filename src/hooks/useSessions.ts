import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSession {
    session_id: string;
    device_name: string | null;
    device_type: string | null;
    browser: string | null;
    os: string | null;
    ip_address: string | null;
    location: {
        country?: string;
        city?: string;
    } | null;
    is_active: boolean;
    last_activity_at: string;
    created_at: string;
}

export interface LoginHistoryEntry {
    login_id: number;
    login_method: string;
    device_info: any;
    ip_address: string | null;
    location: any;
    success: boolean;
    failure_reason: string | null;
    created_at: string;
}

export interface ActivityLogEntry {
    activity_id: number;
    activity_type: string;
    activity_category: string | null;
    description: string | null;
    metadata: any;
    ip_address: string | null;
    status: string;
    created_at: string;
}

export const useSessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch active sessions
    const fetchSessions = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('auth_id', user.id)
                .eq('is_active', true)
                .order('last_activity_at', { ascending: false });

            if (error) throw error;
            setSessions(data as UserSession[]);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
    };

    // Fetch login history
    const fetchLoginHistory = async (limit: number = 20) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_login_history')
                .select('*')
                .eq('auth_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            setLoginHistory(data as LoginHistoryEntry[]);
        } catch (error) {
            console.error('Error fetching login history:', error);
        }
    };

    // Fetch activity log
    const fetchActivityLog = async (limit: number = 50) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_activity_log')
                .select('*')
                .eq('auth_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            setActivityLog(data as ActivityLogEntry[]);
        } catch (error) {
            console.error('Error fetching activity log:', error);
        }
    };

    // Revoke a session
    const revokeSession = async (sessionId: string): Promise<boolean> => {
        if (!user) return false;

        try {
            const { error } = await supabase
                .from('user_sessions')
                .update({
                    is_active: false,
                    revoked_at: new Date().toISOString()
                })
                .eq('session_id', sessionId)
                .eq('auth_id', user.id);

            if (error) throw error;

            await fetchSessions();
            return true;
        } catch (error) {
            console.error('Error revoking session:', error);
            return false;
        }
    };

    // Revoke all other sessions
    const revokeAllOtherSessions = async (currentSessionId?: string): Promise<boolean> => {
        if (!user) return false;

        try {
            let query = supabase
                .from('user_sessions')
                .update({
                    is_active: false,
                    revoked_at: new Date().toISOString()
                })
                .eq('auth_id', user.id)
                .eq('is_active', true);

            if (currentSessionId) {
                query = query.neq('session_id', currentSessionId);
            }

            const { error } = await query;
            if (error) throw error;

            await fetchSessions();
            return true;
        } catch (error) {
            console.error('Error revoking sessions:', error);
            return false;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchSessions(),
                fetchLoginHistory(),
                fetchActivityLog()
            ]);
            setLoading(false);
        };

        if (user) {
            loadData();
        }
    }, [user]);

    return {
        sessions,
        loginHistory,
        activityLog,
        loading,
        revokeSession,
        revokeAllOtherSessions,
        refetch: async () => {
            await Promise.all([
                fetchSessions(),
                fetchLoginHistory(),
                fetchActivityLog()
            ]);
        }
    };
};
