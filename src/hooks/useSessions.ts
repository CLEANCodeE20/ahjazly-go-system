import { useState, useEffect } from 'react';
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

/**
 * Session management hook - placeholder implementation
 * Note: user_sessions, user_login_history, user_activity_log tables don't exist yet.
 * This hook provides stub methods that return empty data until those tables are created.
 */
export const useSessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Stub: Fetch active sessions - tables don't exist yet
    const fetchSessions = async () => {
        setSessions([]);
    };

    // Stub: Fetch login history
    const fetchLoginHistory = async (_limit: number = 20) => {
        setLoginHistory([]);
    };

    // Stub: Fetch activity log
    const fetchActivityLog = async (_limit: number = 50) => {
        setActivityLog([]);
    };

    // Stub: Revoke a session
    const revokeSession = async (_sessionId: string): Promise<boolean> => {
        console.warn('Session management tables not implemented yet');
        return false;
    };

    // Stub: Revoke all other sessions
    const revokeAllOtherSessions = async (_currentSessionId?: string): Promise<boolean> => {
        console.warn('Session management tables not implemented yet');
        return false;
    };

    useEffect(() => {
        if (user) {
            setLoading(true);
            setTimeout(() => setLoading(false), 100);
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
