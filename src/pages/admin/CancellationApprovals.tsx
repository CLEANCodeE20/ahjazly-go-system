import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, XCircle, Users, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface TripCancellationRequest {
    trip_id: number;
    departure_time: string;
    status: string;
    route: {
        origin_city: string;
        destination_city: string;
    };
    partner: {
        company_name: string;
    };
    passenger_count: number;
}

const CancellationApprovals = () => {
    const queryClient = useQueryClient();
    const { userRole, isAdmin } = useAuth();

    const { data: requests = [], isLoading } = useQuery<TripCancellationRequest[]>({
        queryKey: ["cancellation-requests", userRole?.partner_id],
        queryFn: async () => {
            let query = supabase
                .from("trips")
                .select(`
                    trip_id,
                    departure_time,
                    status,
                    partner_id,
                    route:routes(origin_city, destination_city),
                    partner:partners(company_name)
                `)
                .eq("status", "pending_cancellation" as any);

            // If not Superuser, filter by partner_id
            if (!isAdmin() && userRole?.partner_id) {
                query = query.eq("partner_id", userRole.partner_id);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch passenger count for each
            const enrichedData = await Promise.all(data.map(async (trip: any) => {
                const { count } = await supabase
                    .from("bookings")
                    .select("*", { count: 'exact', head: true })
                    .eq("trip_id", trip.trip_id)
                    .eq("booking_status", "confirmed");

                return {
                    ...trip,
                    passenger_count: count || 0
                };
            }));

            return enrichedData as TripCancellationRequest[];
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (tripId: number) => {
            const { error } = await supabase
                .from("trips")
                .update({ status: "cancelled" })
                .eq("trip_id", tripId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("تمت الموافقة على إلغاء الرحلة وبدء عملية الاسترداد");
            queryClient.invalidateQueries({ queryKey: ["cancellation-requests"] });
        },
        onError: (error: any) => {
            toast.error("خطأ في الموافقة: " + error.message);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (tripId: number) => {
            const { error } = await supabase
                .from("trips")
                .update({ status: "scheduled" })
                .eq("trip_id", tripId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("تم رفض طلب الإلغاء وإعادة الرحلة للحالة المجدولة");
            queryClient.invalidateQueries({ queryKey: ["cancellation-requests"] });
        },
        onError: (error: any) => {
            toast.error("خطأ في الرفض: " + error.message);
        }
    });

    const isDashboardPath = window.location.pathname.startsWith('/dashboard');
    const Layout = isDashboardPath ? DashboardLayout : AdminLayout;

    // Common props for both layouts
    const layoutProps = isDashboardPath ? {
        title: "طلبات إلغاء الرحلات",
        subtitle: "مراجعة طلبات الإلغاء الجماعي التي تتطلب موافقة الإدارة"
    } : {
        title: "طلبات إلغاء الرحلات",
        subtitle: "مراجعة طلبات الإلغاء الجماعي التي تتطلب موافقة الإدارة"
    };

    if (isLoading) {
        return (
            <Layout {...layoutProps}>
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout {...layoutProps}>
            <div className="space-y-6">
                {requests.length === 0 ? (
                    <Card className="bg-muted/50 border-dashed">
                        <CardContent className="py-12 text-center">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">لا توجد طلبات معلقة</h3>
                            <p className="text-muted-foreground">تمت معالجة كافة طلبات الإلغاء بنجاح.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {requests.map((request) => (
                            <Card key={request.trip_id} className="overflow-hidden border-orange-200">
                                <div className="bg-orange-50 px-6 py-2 border-b border-orange-100 flex justify-between items-center">
                                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        يتطلب قرار فوري
                                    </Badge>
                                    <span className="text-sm font-medium text-orange-800">
                                        شركة: {request.partner.company_name}
                                    </span>
                                </div>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">
                                                        {request.route.origin_city} ← {request.route.destination_city}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground leading-none">رقم الرحلة #{request.trip_id}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    {format(new Date(request.departure_time), "PPP", { locale: ar })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    {format(new Date(request.departure_time), "p", { locale: ar })}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                                                    <Users className="w-4 h-4" />
                                                    {request.passenger_count} راكب متأثر
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col justify-end gap-3 pt-4 md:pt-0">
                                            <Button
                                                variant="destructive"
                                                className="gap-2"
                                                onClick={() => approveMutation.mutate(request.trip_id)}
                                                disabled={approveMutation.isPending}
                                            >
                                                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                تأكيد الإلغاء والاسترداد
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => rejectMutation.mutate(request.trip_id)}
                                                disabled={rejectMutation.isPending}
                                            >
                                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                رفض الإلغاء وبقاء الرحلة
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CancellationApprovals;
