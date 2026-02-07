import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DisruptionAction = 'cancel' | 'delay' | 'divert' | 'emergency' | 'transfer';

export const useDisruption = () => {
    const [loading, setLoading] = useState(false);

    const handleDisruption = async (params: {
        tripId: number;
        actionType: DisruptionAction;
        reason?: string;
        delayMinutes?: number;
        transferTripId?: number;
    }) => {
        setLoading(true);
        try {
            const { data, error } = await (supabase.rpc as any)('handle_trip_disruption', {
                p_trip_id: params.tripId,
                p_action_type: params.actionType,
                p_reason: params.reason || null,
                p_delay_minutes: params.delayMinutes || null,
                p_transfer_trip_id: params.transferTripId || null,
            });

            if (error) throw error;

            const result = data as any;
            if (result?.success) {
                toast({
                    title: "تمت العملية بنجاح",
                    description: result.message || "تمت معالجة اضطراب الرحلة بنجاح.",
                });
                return result;
            } else {
                throw new Error(result?.message || "فشلت العملية");
            }
        } catch (error: any) {
            console.error("Disruption Error:", error);
            toast({
                title: "خطأ في العملية",
                description: error.message || "حدث خطأ أثناء معالجة الاضطراب.",
                variant: "destructive",
            });
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const findAlternatives = async (tripId: number) => {
        try {
            const { data, error } = await (supabase.rpc as any)('find_alternative_trips', {
                p_original_trip_id: tripId,
            });

            if (error) throw error;
            return (data as any[]) || [];
        } catch (error: any) {
            console.error("Find Alternatives Error:", error);
            return [];
        }
    };

    return {
        handleDisruption,
        findAlternatives,
        loading
    };
};
