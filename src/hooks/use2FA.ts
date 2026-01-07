import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface TwoFactorStatus {
    enabled: boolean;
    method: string | null;
    enabledAt: string | null;
    lastUsedAt: string | null;
}

export interface TwoFactorSetup {
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
}

export const use2FA = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);

    // Get 2FA status
    const getStatus = async (): Promise<TwoFactorStatus | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const { data, error } = await supabase.functions.invoke('two-factor-auth', {
                body: { action: 'status' }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            const statusData: TwoFactorStatus = {
                enabled: data.enabled,
                method: data.method,
                enabledAt: data.enabledAt,
                lastUsedAt: data.lastUsedAt
            };

            setStatus(statusData);
            return statusData;
        } catch (error: any) {
            console.error('Error getting 2FA status:', error);
            return null;
        }
    };

    // Setup 2FA - Generate secret and QR code
    const setup = async (): Promise<TwoFactorSetup | null> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('two-factor-auth', {
                body: { action: 'setup' }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return {
                secret: data.secret,
                qrCodeUri: data.qrCodeUri,
                backupCodes: data.backupCodes
            };
        } catch (error: any) {
            console.error('Error setting up 2FA:', error);
            // Re-throw the error so the component can handle it and show detailed logs
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Verify code and enable 2FA
    const verifyAndEnable = async (code: string): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('two-factor-auth', {
                body: { action: 'verify-enable', code }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast({
                title: 'تم التفعيل',
                description: 'تم تفعيل المصادقة الثنائية بنجاح'
            });

            await getStatus();
            return true;
        } catch (error: any) {
            console.error('Error enabling 2FA:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'الرمز غير صحيح',
                variant: 'destructive'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Verify 2FA code during login
    const verify = async (code: string, isBackupCode: boolean = false): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('two-factor-auth', {
                body: { action: 'verify', code, isBackupCode }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data.verified;
        } catch (error: any) {
            console.error('Error verifying 2FA:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'الرمز غير صحيح',
                variant: 'destructive'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Disable 2FA
    const disable = async (code: string): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('two-factor-auth', {
                body: { action: 'disable', code }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast({
                title: 'تم التعطيل',
                description: 'تم تعطيل المصادقة الثنائية'
            });

            await getStatus();
            return true;
        } catch (error: any) {
            console.error('Error disabling 2FA:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تعطيل المصادقة الثنائية',
                variant: 'destructive'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        status,
        getStatus,
        setup,
        verifyAndEnable,
        verify,
        disable
    };
};
