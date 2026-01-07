import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export const useVerification = () => {
    const [loading, setLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    // Send verification code
    const sendCode = async (type: 'email' | 'phone', contact: string): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('send-verification', {
                body: { type, contact }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setCodeSent(true);
            setExpiresAt(data.expiresAt);

            toast({
                title: 'تم الإرسال',
                description: `تم إرسال رمز التحقق إلى ${type === 'email' ? 'بريدك الإلكتروني' : 'هاتفك'}`
            });

            return true;
        } catch (error: any) {
            console.error('Error sending verification code:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إرسال رمز التحقق',
                variant: 'destructive'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Verify code
    const verifyCode = async (type: 'email' | 'phone', code: string): Promise<boolean> => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const { data, error } = await supabase.functions.invoke('verify-code', {
                body: { type, code }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast({
                title: 'تم التحقق',
                description: `تم التحقق من ${type === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'} بنجاح`
            });

            setCodeSent(false);
            return true;
        } catch (error: any) {
            console.error('Error verifying code:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'الرمز غير صحيح أو منتهي الصلاحية',
                variant: 'destructive'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Reset state
    const reset = () => {
        setCodeSent(false);
        setExpiresAt(null);
    };

    return {
        loading,
        codeSent,
        expiresAt,
        sendCode,
        verifyCode,
        reset
    };
};
