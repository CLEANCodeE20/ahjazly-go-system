import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
    Rating,
    CreateRatingInput,
    UpdateRatingInput,
    CreateRatingResponseInput,
    MarkRatingHelpfulInput,
    ReportRatingInput,
    TripRating,
    PartnerRatingStats,
} from '@/types/rating';

export const useRatings = (tripId?: number) => {
    const [ratings, setRatings] = useState<TripRating[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<PartnerRatingStats | null>(null);
    const { toast } = useToast();

    // Fetch ratings for a trip
    const fetchTripRatings = useCallback(async (id: number, limit = 10, offset = 0) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_trip_ratings', {
                p_trip_id: id,
                p_limit: limit,
                p_offset: offset,
            });

            if (error) throw error;
            setRatings(data || []);
            return data;
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تحميل التقييمات',
                variant: 'destructive',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Fetch partner rating stats
    const fetchPartnerStats = useCallback(async (partnerId: number) => {
        try {
            const { data, error } = await supabase.rpc('get_partner_rating_stats', {
                p_partner_id: partnerId,
            });

            if (error) throw error;
            if (data && data.length > 0) {
                setStats(data[0]);
                return data[0];
            }
            return null;
        } catch (error: any) {
            console.error('Error fetching partner stats:', error);
            return null;
        }
    }, []);

    // Check if user can rate a trip
    const canUserRate = useCallback(async (
        userId: number,
        tripId: number,
        bookingId: number
    ): Promise<boolean> => {
        try {
            const { data, error } = await supabase.rpc('can_user_rate_trip', {
                p_user_id: userId,
                p_trip_id: tripId,
                p_booking_id: bookingId,
            });

            if (error) throw error;
            return data || false;
        } catch (error: any) {
            console.error('Error checking rating eligibility:', error);
            return false;
        }
    }, []);

    // Create a new rating
    const createRating = useCallback(async (input: CreateRatingInput) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-rating', {
                body: input,
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: 'نجح',
                    description: 'تم إضافة التقييم بنجاح',
                });

                // Refresh ratings if we're viewing this trip
                if (tripId === input.trip_id) {
                    await fetchTripRatings(input.trip_id);
                }

                return data.data;
            } else {
                throw new Error(data?.error || 'فشل في إنشاء التقييم');
            }
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إضافة التقييم',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [toast, tripId, fetchTripRatings]);

    // Update an existing rating
    const updateRating = useCallback(async (input: UpdateRatingInput) => {
        setLoading(true);
        try {
            const { rating_id, ...updates } = input;

            const { data, error } = await supabase
                .from('ratings')
                .update(updates)
                .eq('rating_id', rating_id)
                .select()
                .single();

            if (error) throw error;

            toast({
                title: 'نجح',
                description: 'تم تحديث التقييم بنجاح',
            });

            // Refresh ratings
            if (tripId) {
                await fetchTripRatings(tripId);
            }

            return data;
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تحديث التقييم',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [toast, tripId, fetchTripRatings]);

    // Add a partner response to a rating
    const addResponse = useCallback(async (input: CreateRatingResponseInput) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('add-rating-response', {
                body: input,
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: 'نجح',
                    description: 'تم إضافة الرد بنجاح',
                });

                // Refresh ratings
                if (tripId) {
                    await fetchTripRatings(tripId);
                }

                return data.data;
            } else {
                throw new Error(data?.error || 'فشل في إضافة الرد');
            }
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إضافة الرد',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [toast, tripId, fetchTripRatings]);

    // Mark rating as helpful/not helpful
    const markHelpful = useCallback(async (input: MarkRatingHelpfulInput) => {
        try {
            const { data, error } = await supabase.functions.invoke('mark-rating-helpful', {
                body: input,
            });

            if (error) throw error;

            if (data?.success) {
                // Update local state
                setRatings(prev => prev.map(r =>
                    r.rating_id === input.rating_id
                        ? {
                            ...r,
                            helpful_count: data.data.helpful_count,
                            not_helpful_count: data.data.not_helpful_count,
                        }
                        : r
                ));

                return data.data;
            } else {
                throw new Error(data?.error || 'فشل في تسجيل التقييم');
            }
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في تسجيل التقييم',
                variant: 'destructive',
            });
            throw error;
        }
    }, [toast]);

    // Report a rating
    const reportRating = useCallback(async (input: ReportRatingInput) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('report-rating', {
                body: input,
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: 'نجح',
                    description: data.message || 'تم إرسال البلاغ بنجاح',
                });
                return data.data;
            } else {
                throw new Error(data?.error || 'فشل في إرسال البلاغ');
            }
        } catch (error: any) {
            toast({
                title: 'خطأ',
                description: error.message || 'فشل في إرسال البلاغ',
                variant: 'destructive',
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Load ratings on mount if tripId is provided
    useEffect(() => {
        if (tripId) {
            fetchTripRatings(tripId);
        }
    }, [tripId, fetchTripRatings]);

    return {
        ratings,
        stats,
        loading,
        fetchTripRatings,
        fetchPartnerStats,
        canUserRate,
        createRating,
        updateRating,
        addResponse,
        markHelpful,
        reportRating,
    };
};
