import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
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

    // Fetch ratings for a trip using direct query instead of RPC
    const fetchTripRatings = useCallback(async (id: number, limit = 10, offset = 0) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select(`
                    rating_id,
                    stars,
                    comment,
                    rating_date,
                    user_id,
                    trip_id,
                    partner_id,
                    driver_id,
                    users:user_id(full_name)
                `)
                .eq('trip_id', id)
                .order('rating_date', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            
            const formattedRatings: TripRating[] = (data || []).map((r: any) => ({
                rating_id: r.rating_id,
                stars: r.stars,
                comment: r.comment,
                rating_date: r.rating_date,
                user_name: r.users?.full_name || 'مستخدم',
                helpful_count: 0,
                not_helpful_count: 0,
                has_response: false,
            }));
            
            setRatings(formattedRatings);
            return formattedRatings;
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

    // Fetch partner rating stats using direct query
    const fetchPartnerStats = useCallback(async (partnerId: number) => {
        try {
            const { data, error } = await supabase
                .from('ratings')
                .select('stars')
                .eq('partner_id', partnerId);

            if (error) throw error;
            
            if (data && data.length > 0) {
                const totalRatings = data.length;
                const avgRating = data.reduce((sum, r) => sum + (r.stars || 0), 0) / totalRatings;
                
                const statsData: PartnerRatingStats = {
                    partner_id: partnerId,
                    company_name: '',
                    partner_status: 'active',
                    total_ratings: totalRatings,
                    avg_overall_rating: Math.round(avgRating * 10) / 10,
                    avg_service_rating: 0,
                    avg_cleanliness_rating: 0,
                    avg_punctuality_rating: 0,
                    avg_comfort_rating: 0,
                    avg_value_rating: 0,
                    five_star_count: data.filter(r => r.stars === 5).length,
                    four_star_count: data.filter(r => r.stars === 4).length,
                    three_star_count: data.filter(r => r.stars === 3).length,
                    two_star_count: data.filter(r => r.stars === 2).length,
                    one_star_count: data.filter(r => r.stars === 1).length,
                    positive_ratings: data.filter(r => (r.stars || 0) >= 4).length,
                    negative_ratings: data.filter(r => (r.stars || 0) <= 2).length,
                    positive_percentage: (data.filter(r => (r.stars || 0) >= 4).length / totalRatings) * 100,
                    negative_percentage: (data.filter(r => (r.stars || 0) <= 2).length / totalRatings) * 100,
                    ratings_with_comments: 0,
                    total_helpful_votes: 0,
                    ratings_with_responses: 0,
                };
                setStats(statsData);
                return statsData;
            }
            return null;
        } catch (error: any) {
            console.error('Error fetching partner stats:', error);
            return null;
        }
    }, []);

    // Check if user can rate a trip - simplified check
    const canUserRate = useCallback(async (
        userId: number,
        tripId: number,
        bookingId: number
    ): Promise<boolean> => {
        try {
            // Check if user has already rated this trip
            const { data, error } = await supabase
                .from('ratings')
                .select('rating_id')
                .eq('user_id', userId)
                .eq('trip_id', tripId)
                .maybeSingle();

            if (error) throw error;
            // User can rate if no existing rating found
            return data === null;
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
