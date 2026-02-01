import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================
// Types
// =============================================

export interface Driver {
    driver_id: number;
    auth_id: string | null;
    partner_id: number;
    full_name: string;
    phone_number: string | null;
    license_number: string | null;
    license_expiry: string | null;
    status: string;
    employment_type: string | null;
    hire_date: string | null;
    termination_date: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    blood_type: string | null;
    notes: string | null;
    created_at: string;
}

export interface DriverSettings {
    setting_id: number;
    driver_id: number;
    notify_new_trip: boolean;
    notify_trip_change: boolean;
    notify_passenger_message: boolean;
    notify_before_trip_minutes: number;
    max_trips_per_day: number;
    preferred_routes: any;
    language: string;
    theme: string;
    created_at: string;
    updated_at: string;
}

export interface DriverPerformance {
    performance_id: number;
    driver_id: number;
    period_start: string;
    period_end: string;
    total_trips: number;
    completed_trips: number;
    cancelled_trips: number;
    average_rating: number | null;
    on_time_percentage: number | null;
    total_earnings: number | null;
    calculated_at: string;
}

export interface DriverDocument {
    document_id: number;
    driver_id: number;
    document_type: string;
    document_name: string | null;
    document_url: string;
    document_number: string | null; // Added document_number
    issue_date: string | null;
    expiry_date: string | null;
    verification_status: string;
    rejection_reason: string | null;
    uploaded_at: string;
    verified_at: string | null;
}

// =============================================
// Hooks
// =============================================

/**
 * Hook للحصول على جميع السائقين
 */
export const useDrivers = () => {
    return useQuery({
        queryKey: ["drivers"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("drivers")
                .select(`
          *,
          user:users(full_name, email, phone_number, account_status, auth_id),
          partner:partners(company_name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Driver[];
        },
    });
};

/**
 * Hook للحصول على سائق واحد
 */
export const useDriver = (driverId: number | null) => {
    return useQuery({
        queryKey: ["driver", driverId],
        queryFn: async () => {
            if (!driverId) return null;

            const { data, error } = await supabase
                .from("drivers")
                .select(`
          *,
          user:users(*),
          partner:partners(*),
          settings:driver_settings(*)
        `)
                .eq("driver_id", driverId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!driverId,
    });
};

/**
 * Hook للحصول على أداء السائق
 */
export const useDriverPerformance = (driverId: number | null) => {
    return useQuery({
        queryKey: ["driver-performance", driverId],
        queryFn: async () => {
            if (!driverId) return [];

            const { data, error } = await supabase
                .from("driver_performance")
                .select("*")
                .eq("driver_id", driverId)
                .order("period_start", { ascending: false })
                .limit(12); // آخر 12 شهر

            if (error) throw error;
            return data as DriverPerformance[];
        },
        enabled: !!driverId,
    });
};

/**
 * Hook للحصول على مستندات السائق
 */
export const useDriverDocuments = (driverId: number | null) => {
    return useQuery({
        queryKey: ["driver-documents", driverId],
        queryFn: async () => {
            if (!driverId) return [];

            const { data, error } = await supabase
                .from("driver_documents")
                .select("*")
                .eq("driver_id", driverId)
                .order("uploaded_at", { ascending: false });

            if (error) throw error;
            return data as DriverDocument[];
        },
        enabled: !!driverId,
    });
};

/**
 * Hook لإنشاء سائق جديد مع حساب
 */
export const useCreateDriver = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (driverData: {
            full_name: string;
            email: string;
            phone_number: string;
            partner_id: number;
            license_number: string;
            license_expiry: string;
            hire_date?: string;
            employment_type?: string;
            emergency_contact_name?: string;
            emergency_contact_phone?: string;
            blood_type?: string;
            notes?: string;
            password?: string; // Added password
            licenseFile?: File; // Added licenseFile for initial upload
        }) => {
            // 1. Create Auth User via Edge Function
            const session = await supabase.auth.getSession();
            console.log("Current Session Token:", session.data.session?.access_token ? "Present" : "Missing");

            const { data: authData, error: authError } = await supabase.functions.invoke('create-user', {
                body: {
                    email: driverData.email,
                    password: driverData.password,
                    full_name: driverData.full_name
                }
            });

            if (authError) {
                console.error("Edge Function Error:", authError);
                // Try to parse the response body if available
                if (authError instanceof Error && 'context' in authError) {
                    // @ts-ignore
                    const body = await authError.context.json().catch(() => null);
                    console.error("Edge Function Error Body:", body);
                    if (body && body.error) throw new Error(body.error);
                }
                throw authError;
            }

            if (authData?.error) {
                console.error("Edge Function Returned Error:", authData.error);
                throw new Error(authData.error);
            }

            const authId = authData.user_id;

            // 2. Create Driver Record via RPC
            const { data, error } = await supabase.rpc("create_driver_with_account", {
                p_full_name: driverData.full_name,
                p_email: driverData.email,
                p_phone_number: driverData.phone_number,
                p_partner_id: driverData.partner_id,
                p_license_number: driverData.license_number,
                p_license_expiry: driverData.license_expiry,
                p_hire_date: driverData.hire_date || new Date().toISOString().split('T')[0],
                p_auth_id: authId // Pass the Auth ID
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || "Failed to create driver");
            }

            // 3. Update additional fields
            if (driverData.employment_type || driverData.emergency_contact_name) {
                const { error: updateError } = await supabase
                    .from("drivers")
                    .update({
                        employment_type: driverData.employment_type,
                        emergency_contact_name: driverData.emergency_contact_name,
                        emergency_contact_phone: driverData.emergency_contact_phone,
                        blood_type: driverData.blood_type,
                        notes: driverData.notes,
                    })
                    .eq("driver_id", data.driver_id);

                if (updateError) throw updateError;
            }

            // 4. Initial Document Upload (if provided)
            if (driverData.licenseFile) {
                const file = driverData.licenseFile;
                const fileExt = file.name.split(".").pop();
                const fileName = `${data.driver_id}/license_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("driver-documents")
                    .upload(fileName, file);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from("driver-documents")
                        .getPublicUrl(fileName);

                    await supabase.from("driver_documents").insert({
                        driver_id: data.driver_id,
                        auth_id: authId,
                        document_type: 'license',
                        document_name: file.name,
                        document_url: urlData.publicUrl,
                        document_number: driverData.license_number,
                        expiry_date: driverData.license_expiry,
                        verification_status: 'approved'
                    });
                }
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("تم إضافة السائق وإنشاء الحساب بنجاح");
        },
        onError: (error: Error) => {
            toast.error(`خطأ في إضافة السائق: ${error.message}`);
        },
    });
};

/**
 * Hook لتحديث بيانات السائق
 */
export const useUpdateDriver = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            driverId,
            updates,
        }: {
            driverId: number;
            updates: Partial<Driver>;
        }) => {
            const { data, error } = await supabase
                .from("drivers")
                .update(updates)
                .eq("driver_id", driverId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            queryClient.invalidateQueries({ queryKey: ["driver", variables.driverId] });
            toast.success("تم تحديث بيانات السائق");
        },
        onError: (error: Error) => {
            toast.error(`خطأ في التحديث: ${error.message}`);
        },
    });
};

/**
 * Hook لحذف سائق
 */
export const useDeleteDriver = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (driverId: number) => {
            const { error } = await supabase
                .from("drivers")
                .delete()
                .eq("driver_id", driverId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["drivers"] });
            toast.success("تم حذف السائق");
        },
        onError: (error: Error) => {
            toast.error(`خطأ في الحذف: ${error.message}`);
        },
    });
};

/**
 * Hook لرفع مستند
 */
export const useUploadDriverDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            driverId,
            file,
            documentType,
            expiryDate,
        }: {
            driverId: number;
            file: File;
            documentType: string;
            documentNumber?: string;
            expiryDate?: string;
        }) => {
            // رفع الملف إلى Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${driverId}/${documentType}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("driver-documents")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // الحصول على URL العام
            const { data: urlData } = supabase.storage
                .from("driver-documents")
                .getPublicUrl(fileName);

            // حفظ السجل في قاعدة البيانات
            const { data, error } = await supabase
                .from("driver_documents")
                .insert({
                    driver_id: driverId,
                    document_type: documentType,
                    document_name: file.name,
                    document_url: urlData.publicUrl,
                    document_number: documentNumber,
                    expiry_date: expiryDate,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["driver-documents", variables.driverId] });
            toast.success("تم رفع المستند بنجاح");
        },
        onError: (error: Error) => {
            toast.error(`خطأ في رفع المستند: ${error.message}`);
        },
    });
};
