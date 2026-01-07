import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface UserProfile {
    user_id: number;
    auth_id: string;
    full_name: string | null;
    email: string | null;
    phone_number: string | null;
    avatar_url: string | null;
    bio: string | null;
    date_of_birth: string | null;
    nationality: string | null;
    id_number: string | null;
    gender: 'male' | 'female' | null;
    email_verified: boolean;
    phone_verified: boolean;
    preferences: Record<string, any>;
    user_type: string;
    account_status: string;
    profile_completion_percentage: number;
    onboarding_completed: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProfileUpdateData {
    full_name?: string;
    phone_number?: string;
    bio?: string;
    date_of_birth?: string;
    nationality?: string;
    id_number?: string;
    gender?: 'male' | 'female';
    preferences?: Record<string, any>;
}

export const useUserProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Fetch user profile
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
                .select('*')
                .eq('auth_id', user.id)
                .single();

            if (error) throw error;
            setProfile(data as UserProfile);
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

    // Update profile
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

            // Log activity
            await supabase.rpc('log_user_activity', {
                p_user_id: profile.user_id,
                p_auth_id: user.id,
                p_activity_type: 'profile_update',
                p_activity_category: 'profile',
                p_description: 'تحديث بيانات الملف الشخصي',
                p_metadata: { updated_fields: Object.keys(updates) }
            });

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

    // Upload avatar
    const uploadAvatar = async (file: File): Promise<boolean> => {
        if (!user || !profile) return false;

        setUpdating(true);
        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('يجب أن يكون الملف صورة');
            }

            if (file.size > 2 * 1024 * 1024) {
                throw new Error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('user-avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);

            // Update profile
            const { error: updateError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('auth_id', user.id);

            if (updateError) throw updateError;

            // Log activity
            await supabase.rpc('log_user_activity', {
                p_user_id: profile.user_id,
                p_auth_id: user.id,
                p_activity_type: 'avatar_upload',
                p_activity_category: 'profile',
                p_description: 'تحديث الصورة الشخصية'
            });

            await fetchProfile();

            toast({
                title: 'تم الرفع',
                description: 'تم تحديث الصورة الشخصية بنجاح'
            });

            return true;
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast({
                title: 'خطأ في الرفع',
                description: error.message || 'فشل في رفع الصورة',
                variant: 'destructive'
            });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // Delete avatar
    const deleteAvatar = async (): Promise<boolean> => {
        if (!user || !profile) return false;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ avatar_url: null })
                .eq('auth_id', user.id);

            if (error) throw error;

            await fetchProfile();

            toast({
                title: 'تم الحذف',
                description: 'تم حذف الصورة الشخصية'
            });

            return true;
        } catch (error: any) {
            console.error('Error deleting avatar:', error);
            toast({
                title: 'خطأ',
                description: 'فشل في حذف الصورة',
                variant: 'destructive'
            });
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // Update preferences
    const updatePreferences = async (preferences: Record<string, any>): Promise<boolean> => {
        if (!user || !profile) return false;

        return updateProfile({ preferences });
    };

    // Mark onboarding as completed
    const completeOnboarding = async (): Promise<boolean> => {
        if (!user || !profile) return false;

        setUpdating(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ onboarding_completed: true })
                .eq('auth_id', user.id);

            if (error) throw error;

            await fetchProfile();
            return true;
        } catch (error: any) {
            console.error('Error completing onboarding:', error);
            return false;
        } finally {
            setUpdating(false);
        }
    };

    // Get avatar initials
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
