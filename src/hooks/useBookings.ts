import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Booking {
    booking_id: number;
    booking_date: string;
    booking_status: string;
    payment_status: string;
    total_price: number;
    user_id: number;
    trip_id: number;
    payment_method?: string;
    cancel_policy_id?: number | null;
    refund_amount?: number;
    platform_commission?: number;
    partner_revenue?: number;
    gateway_transaction_id?: string;
    payment_timestamp?: string;
    user: {
        full_name: string;
        phone_number: string | null;
    } | null;
    trip: {
        trip_id: number;
        departure_time: string;
        bus?: {
            license_plate: string;
            model: string;
        } | null;
        driver?: {
            full_name: string;
        } | null;
        route: {
            origin_city: string;
            destination_city: string;
        } | null;
    } | null;
    passengers?: Array<{
        full_name: string;
        seat_id: number;
        seat_number?: string;
        id_number?: string;
        id_image?: string;
        birth_date?: string;
        gender?: string;
    }>;
    ledger?: Array<{
        ledger_id: number;
        entry_type: string;
        amount: number;
        note: string;
        created_at: string;
    }>;
}

interface UseBookingsOptions {
    page: number;
    pageSize: number;
    searchQuery?: string;
    statusFilter?: string;
}

export const useBookings = ({ page, pageSize, searchQuery, statusFilter }: UseBookingsOptions) => {
    return useQuery({
        queryKey: ["bookings", page, pageSize, searchQuery, statusFilter],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.rpc('search_bookings' as any, {
                    p_search_query: searchQuery || null,
                    p_status_filter: statusFilter && statusFilter !== 'all' ? statusFilter : null,
                    p_page: page,
                    p_page_size: pageSize
                }) as { data: any[] | null, error: any };

                if (error) throw error;

                if (!data) return { bookings: [], totalCount: 0 };

                // Get extra details for these bookings if needed (like passengers/seats)
                // In a real optimized system, the RPC would return everything
                const bookingIds = data.map(b => b.booking_id);

                const { data: passengers } = await supabase
                    .from('passengers')
                    .select('booking_id, full_name, seat_id, id_number, id_image, birth_date, gender')
                    .in('booking_id', bookingIds);

                const { data: ledger } = await supabase
                    .from('booking_ledger')
                    .select('*')
                    .in('booking_id', bookingIds)
                    .order('created_at', { ascending: false });

                const bookings: Booking[] = data.map((row: any) => ({
                    booking_id: row.booking_id,
                    booking_date: row.booking_date,
                    booking_status: row.booking_status,
                    payment_status: row.payment_status,
                    total_price: row.total_price,
                    payment_method: row.payment_method,
                    platform_commission: row.platform_commission,
                    partner_revenue: row.partner_revenue,
                    gateway_transaction_id: row.gateway_transaction_id,
                    payment_timestamp: row.payment_timestamp,
                    user_id: row.user_id,
                    trip_id: row.trip_id,
                    user: row.user_full_name ? {
                        full_name: row.user_full_name,
                        phone_number: row.user_phone_number
                    } : null,
                    trip: row.trip_departure_time ? {
                        trip_id: row.trip_id,
                        departure_time: row.trip_departure_time,
                        route: row.origin_city ? {
                            origin_city: row.origin_city,
                            destination_city: row.destination_city
                        } : null
                    } : null,
                    passengers: passengers?.filter(p => p.booking_id === row.booking_id),
                    ledger: ledger?.filter(l => l.booking_id === row.booking_id)
                }));

                const totalCount = data.length > 0 ? Number(data[0].total_count) : 0;

                return { bookings, totalCount };
            } catch (rpcError) {
                console.warn('Using fallback query method due to:', rpcError);
                let query = supabase
                    .from("bookings")
                    .select(`
                      *,
                      user:users(full_name, phone_number),
                      trip:trips(
                        *,
                        route:routes(origin_city, destination_city),
                        bus:buses(license_plate, model),
                        driver:drivers(full_name)
                      ),
                      passengers(full_name, seat_id, id_number, id_image, birth_date, gender),
                      ledger:booking_ledger(*)
                    `, { count: 'exact' });

                if (statusFilter && statusFilter !== "all") {
                    query = query.eq("booking_status", statusFilter as any);
                }

                if (searchQuery && !isNaN(Number(searchQuery))) {
                    query = query.eq("booking_id", Number(searchQuery));
                } else if (searchQuery) {
                    query = query.or(`cancel_reason.ilike.%${searchQuery}%,gateway_transaction_id.ilike.%${searchQuery}%`);
                }

                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                query = query.range(from, to).order("booking_id", { ascending: false });

                const { data, error, count } = await query;
                if (error) throw error;

                return {
                    bookings: data as unknown as Booking[],
                    totalCount: count || 0,
                };
            }
        },
    });
};

export const useUpdateBookingStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
            const { data, error } = await supabase.rpc('update_booking_status_v3' as any, {
                p_booking_id: id,
                p_new_status: status,
                p_notes: notes || null
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            toast({ title: "تم التحديث", description: "تم تحديث حالة الحجز بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        },
    });
};

export const useCancelBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, reason, confirm = false }: { id: number; reason: string; confirm?: boolean }) => {
            const { data, error } = await supabase.rpc('cancel_booking_rpc' as any, {
                p_booking_id: id,
                p_reason: reason,
                p_confirm: confirm
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any, variables) => {
            if (variables.confirm) {
                queryClient.invalidateQueries({ queryKey: ["bookings"] });
                toast({ title: "تم الإلغاء", description: "تم إلغاء الحجز بنجاح" });
            }
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        },
    });
};

export const useConfirmPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, method, status, txId }: { id: number; method: string; status: string; txId?: string }) => {
            const { data, error } = await supabase.rpc('update_payment_v2' as any, {
                p_booking_id: id,
                p_payment_status: status,
                p_payment_method: method,
                p_transaction_id: txId || null
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            toast({ title: "تم تأكيد الدفع", description: "تم تحديث حالة الدفع والحجز بنجاح" });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        },
    });
};
