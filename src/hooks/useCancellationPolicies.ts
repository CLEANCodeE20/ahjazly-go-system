import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CancelPolicy {
    cancel_policy_id: number;
    partner_id: number;
    policy_name: string;
    description: string | null;
    refund_percentage: number;
    days_before_trip: number;
    priority: number;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CancelPolicyRule {
    rule_id: number;
    cancel_policy_id: number;
    min_hours_before_departure: number | null;
    max_hours_before_departure: number | null;
    refund_percentage: number;
    cancellation_fee: number;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

export const useCancellationPolicies = (partnerId?: number) => {
    return useQuery({
        queryKey: ["cancellation-policies", partnerId],
        queryFn: async () => {
            if (!partnerId) return [];
            const { data, error } = await supabase
                .from("cancel_policies")
                .select("*")
                .eq("partner_id", partnerId)
                .order("priority", { ascending: false });

            if (error) throw error;
            return data as CancelPolicy[];
        },
        enabled: !!partnerId,
    });
};

export const useCancellationPolicyRules = (policyId?: number) => {
    return useQuery({
        queryKey: ["cancellation-policy-rules", policyId],
        queryFn: async () => {
            if (!policyId) return [];
            const { data, error } = await supabase
                .from("cancel_policy_rules")
                .select("*")
                .eq("cancel_policy_id", policyId)
                .order("display_order", { ascending: true });

            if (error) throw error;
            return data as CancelPolicyRule[];
        },
        enabled: !!policyId,
    });
};

export const useCreateCancellationPolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (policy: Partial<CancelPolicy>) => {
            const { data, error } = await supabase
                .from("cancel_policies")
                .insert(policy)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-policies", variables.partner_id] });
            toast({ title: "تم النجاح", description: "تم إنشاء السياسة بنجاح" });
        },
    });
};

export const useUpdateCancellationPolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CancelPolicy> & { id: number }) => {
            const { data, error } = await supabase
                .from("cancel_policies")
                .update(updates)
                .eq("cancel_policy_id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-policies", data.partner_id] });
            toast({ title: "تم التحديث", description: "تم تحديث السياسة بنجاح" });
        },
    });
};

export const useDeleteCancellationPolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, partnerId }: { id: number; partnerId: number }) => {
            const { error } = await supabase
                .from("cancel_policies")
                .delete()
                .eq("cancel_policy_id", id);

            if (error) throw error;
            return { id, partnerId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-policies", data.partnerId] });
            toast({ title: "تم الحذف", description: "تم حذف السياسة بنجاح" });
        },
    });
};

export const useUpsertCancellationRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (rule: Partial<CancelPolicyRule>) => {
            if (rule.rule_id) {
                const { data, error } = await supabase
                    .from("cancel_policy_rules")
                    .update(rule)
                    .eq("rule_id", rule.rule_id)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabase
                    .from("cancel_policy_rules")
                    .insert(rule)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-policy-rules", data.cancel_policy_id] });
        },
    });
};

export const useDeleteCancellationRule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, policyId }: { id: number; policyId: number }) => {
            const { error } = await supabase
                .from("cancel_policy_rules")
                .delete()
                .eq("rule_id", id);

            if (error) throw error;
            return { id, policyId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cancellation-policy-rules", data.policyId] });
        },
    });
};
