import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface UserProfile {
    user_id: number;
    auth_id: string | null;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    gender: 'male' | 'female' | null;
    user_type: string | null;
    account_status: string | null;
    partner_id: number | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface ProfileUpdateData {
    full_name?: string;
    phone_number?: string;
    gender?: 'male' | 'female';
}

export const useUserProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchProfile = async () => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select(`
                    user_id, 
                    auth_id, 
                    full_name, 
                    email, 
                    phone_number, 
                    gender, 
                    account_status, 
                    partner_id, 
                    created_at, 
                    updated_at,
                    user_roles (role)
                `)
                .eq('auth_id', user.id)
                .single();

            if (error) throw error;

            // Map user_roles to user_type for backward compatibility in the UI
            // Cast data to any to handle the joined user_roles property
            const rawData = data as any;
            const profileData = {
                ...rawData,
                user_type: rawData.user_roles?.[0]?.role || 'customer'
            };

            setProfile(profileData as any);
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            toast({
                title: 'خطأ',
                description: 'فشل في تحميل بيانات الملف الشخصي',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const updateProfile = async (updates: ProfileUpdateData): Promise<boolean> => {
        if (!user || !profile) return false;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('auth_id', user.id);

            if (error) throw error;

            await fetchProfile();

            toast({
                title: 'تم التحديث',
                description: 'تم تحديث بيانات الملف الشخصي بنجاح'
            });

            return true;
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تحديث البيانات',
                variant: 'destructive'
            });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const uploadAvatar = async (_file: File): Promise<boolean> => {
        toast({
            title: 'غير متاح',
            description: 'رفع الصور غير متاح حالياً',
            variant: 'destructive'
        });
        return false;
    };

    const deleteAvatar = async (): Promise<boolean> => {
        toast({
            title: 'غير متاح',
            description: 'حذف الصور غير متاح حالياً',
            variant: 'destructive'
        });
        return false;
    };

    const updatePreferences = async (_preferences: Record<string, any>): Promise<boolean> => {
        console.warn('Preferences column not available in users table');
        return false;
    };

    const completeOnboarding = async (): Promise<boolean> => {
        console.warn('Onboarding column not available in users table');
        return true;
    };

    const getAvatarInitials = (): string => {
        if (!profile?.full_name) return '؟';

        const names = profile.full_name.trim().split(' ');
        if (names.length === 1) {
            return names[0].charAt(0).toUpperCase();
        }
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    return {
        profile,
        loading,
        updating,
        updateProfile,
        uploadAvatar,
        deleteAvatar,
        updatePreferences,
        completeOnboarding,
        getAvatarInitials,
        refetch: fetchProfile
    };
};
