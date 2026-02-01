import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Wallet {
    wallet_id: number;
    auth_id: string; // Gold Standard: UUID
    balance: number;
    currency: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface WalletTransaction {
    transaction_id: number;
    wallet_id: number;
    type: 'deposit' | 'payment' | 'withdrawal' | 'bonus' | 'adjustment';
    amount: number;
    previous_balance: number;
    new_balance: number;
    reference_id: string;
    description: string;
    created_at: string;
}

export const useWallet = () => {
    const { user, userRole, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();

    // Fetch wallet balance and details
    const { data: wallet, isLoading: isWalletLoading } = useQuery({
        queryKey: ["wallet", user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Determine if we need partner wallet based on roles
            const isPartnerStaff = ['PARTNER_ADMIN', 'manager', 'accountant', 'support', 'supervisor'].includes(userRole?.role || '');

            let query = supabase.from("wallets").select("*");

            if (isPartnerStaff && userRole?.partner_id) {
                query = query.eq("partner_id", userRole.partner_id);
            } else {
                // Fetch using UUID (Gold Standard)
                query = query.eq("auth_id", user.id);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            return data as unknown as Wallet;
        },
        enabled: !!user && !isAuthLoading, // Wait for auth/roles to be ready
    });

    // Fetch transaction history
    const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ["wallet-transactions", wallet?.wallet_id],
        queryFn: async () => {
            if (!wallet) return [];
            const { data, error } = await supabase
                .from("wallet_transactions")
                .select("*")
                .eq("wallet_id", wallet.wallet_id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as WalletTransaction[];
        },
        enabled: !!wallet,
    });

    // Request withdrawal
    const requestWithdrawal = useMutation({
        mutationFn: async (params: { amount: number; bank_name: string; account_name: string; account_number: string }) => {
            if (!wallet) throw new Error("Wallet not found");

            const { data, error } = await supabase
                .from("wallet_withdrawal_requests")
                .insert({
                    wallet_id: wallet.wallet_id,
                    amount: params.amount,
                    bank_name: params.bank_name,
                    account_name: params.account_name,
                    account_number: params.account_number,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: "تم تقديم الطلب",
                description: "سيتم مراجعة طلب السحب من قبل الإدارة المالية.",
            });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
        },
        onError: (error: any) => {
            toast({
                title: "خطأ في تقديم الطلب",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Request Deposit (New)
    const requestDeposit = useMutation({
        mutationFn: async (params: { amount: number; payment_method: string; transaction_ref: string; proof_image_url?: string }) => {
            if (!wallet) throw new Error("Wallet not found");

            const { data, error } = await supabase
                .from("wallet_deposit_requests")
                .insert({
                    wallet_id: wallet.wallet_id,
                    amount: params.amount,
                    payment_method: params.payment_method,
                    transaction_ref: params.transaction_ref,
                    proof_image_url: params.proof_image_url,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: "تم إرسال إشعار الشحن",
                description: "سيتم مراجعة الحوالة وتأكيد الرصيد قريباً.",
            });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
        },
        onError: (error: any) => {
            toast({
                title: "خطأ في إرسال الإشعار",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        wallet,
        transactions,
        isLoading: isWalletLoading || isTransactionsLoading,
        requestWithdrawal,
        requestDeposit,
    };
};
