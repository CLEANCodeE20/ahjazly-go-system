import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Banknote,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    ExternalLink,
    Loader2,
    User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WithdrawalRequest {
    request_id: number;
    wallet_id: number;
    amount: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    status: string;
    created_at: string;
    notes: string;
    rejection_reason: string;
    wallet: {
        user: {
            full_name: string;
            phone_number: string;
        }
    }
}

const WithdrawalsManagement = () => {
    const { data: requests, loading, refetch } = useSupabaseCRUD<WithdrawalRequest>({
        tableName: 'wallet_withdrawal_requests' as any,
        primaryKey: 'request_id',
        initialFetch: true,
        queryOptions: {
            select: `
        *,
        wallet:wallets(
          user:users(full_name, phone_number)
        )
      `
        }
    });

    const { userRole } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
    const [showProcessDialog, setShowProcessDialog] = useState(false);
    const [processStatus, setProcessStatus] = useState<'completed' | 'rejected'>('completed');
    const [notes, setNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const filteredRequests = requests.filter(req =>
        req.wallet?.user?.full_name?.includes(searchTerm) ||
        req.account_number?.includes(searchTerm) ||
        req.bank_name?.includes(searchTerm)
    );

    const handleProcess = async () => {
        if (!selectedRequest || !userRole?.auth_id) return; // Gold Standard: UUID
        setIsProcessing(true);

        try {
            const { error } = await supabase
                .from('wallet_withdrawal_requests' as any)
                .update({
                    status: processStatus,
                    notes: notes,
                    processed_at: new Date().toISOString(),
                    processed_by_auth_id: userRole.auth_id // Gold Standard: UUID
                })
                .eq('request_id', selectedRequest.request_id);

            if (error) throw error;

            toast({
                title: processStatus === 'completed' ? "تم تأكيد التحويل" : "تم رفض الطلب",
                description: "تم تحديث حالة طلب السحب بنجاح.",
            });

            setShowProcessDialog(false);
            refetch();
        } catch (error: any) {
            toast({
                title: "خطأ في المعالجة",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 ml-1" /> مكتمل</Badge>;
            case 'pending': return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 ml-1" /> قيد الانتظار</Badge>;
            case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3 ml-1" /> مرفوض</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout
            title="إدارة طلبات السحب"
            subtitle="مراجعة ومعالجة طلبات تحويل الرصيد للحسابات البنكية"
        >
            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="بحث باسم العميل، رقم الحساب، أو البنك..."
                            className="pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Requests Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="py-4 px-4 font-bold">العميل</th>
                                        <th className="py-4 px-4 font-bold">المبلغ</th>
                                        <th className="py-4 px-4 font-bold">تفاصيل البنك</th>
                                        <th className="py-4 px-4 font-bold">التاريخ</th>
                                        <th className="py-4 px-4 font-bold">الحالة</th>
                                        <th className="py-4 px-4 font-bold">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                            </td>
                                        </tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">لا توجد طلبات سحب</td>
                                        </tr>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <tr key={req.request_id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{req.wallet?.user?.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{req.wallet?.user?.phone_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-black text-secondary">
                                                    {req.amount.toLocaleString()} ر.س
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="font-medium">{req.bank_name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{req.account_number}</p>
                                                </td>
                                                <td className="py-4 px-4 text-muted-foreground">
                                                    {new Date(req.created_at).toLocaleDateString('ar-SA')}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {getStatusBadge(req.status)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {req.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-2"
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setShowProcessDialog(true);
                                                            }}
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            معالجة
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Process Dialog */}
            <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>معالجة طلب السحب #{selectedRequest?.request_id}</DialogTitle>
                        <DialogDescription>يرجى التأكد من تحويل المبلغ بنكياً قبل تأكيد العملية.</DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">المبلغ:</span>
                                    <span className="font-black text-secondary">{selectedRequest.amount} ر.س</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">البنك:</span>
                                    <span className="font-bold">{selectedRequest.bank_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">الحساب:</span>
                                    <span className="font-mono">{selectedRequest.account_number}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">الاسم:</span>
                                    <span className="font-bold">{selectedRequest.account_name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>القرار</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={processStatus === 'completed' ? 'default' : 'outline'}
                                        className="flex-1 gap-2"
                                        onClick={() => setProcessStatus('completed')}
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> تأكيد التحويل
                                    </Button>
                                    <Button
                                        variant={processStatus === 'rejected' ? 'destructive' : 'outline'}
                                        className="flex-1 gap-2"
                                        onClick={() => setProcessStatus('rejected')}
                                    >
                                        <XCircle className="w-4 h-4" /> رفض الطلب
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>ملاحظات (تظهر للعميل)</Label>
                                <Textarea
                                    placeholder="أدخل رقم العملية البنكية أو سبب الرفض..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowProcessDialog(false)}>إلغاء</Button>
                        <Button
                            variant={processStatus === 'completed' ? 'default' : 'destructive'}
                            onClick={handleProcess}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'جاري التنفيذ...' : 'حفظ القرار النهائي'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default WithdrawalsManagement;
