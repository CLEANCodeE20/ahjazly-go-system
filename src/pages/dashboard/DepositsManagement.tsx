import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    Search,
    Image as ImageIcon,
    AlertCircle
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DepositRequest {
    request_id: number;
    wallet_id: number;
    amount: number;
    payment_method: string;
    transaction_ref: string;
    proof_image_url: string;
    status: 'pending' | 'completed' | 'rejected';
    notes: string;
    admin_notes: string;
    created_at: string;
    wallet: {
        partner: { company_name: string };
        user: { full_name: string };
    }
}

const DepositsManagement = () => {
    const { data: requests, loading, refetch } = useSupabaseCRUD<DepositRequest>({
        tableName: 'wallet_deposit_requests' as any,
        primaryKey: 'request_id',
        initialFetch: true,
        queryOptions: {
            select: `
                *,
                wallet:wallets(
                    partner:partners(company_name),
                    user:users(full_name)
                )
            `
        }
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredRequests = requests.filter(r =>
        r.transaction_ref?.includes(searchTerm) ||
        r.wallet?.partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.wallet?.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = async (status: 'completed' | 'rejected') => {
        if (!selectedRequest) return;
        setIsSubmitting(true);

        try {
            if (status === 'completed') {
                const { data, error } = await (supabase.rpc as any)('approve_deposit_request', {
                    p_request_id: selectedRequest.request_id,
                    p_admin_notes: adminNotes
                });
                if (error) throw error;
                if (!(data as any).success) throw new Error((data as any).message);
            } else {
                const { error } = await supabase
                    .from('wallet_deposit_requests')
                    .update({
                        status: 'rejected',
                        admin_notes: adminNotes,
                        processed_at: new Date().toISOString(),
                        processed_by: (await supabase.auth.getUser()).data.user?.id // This needs internal user_id mapping usually
                    })
                    .eq('request_id', selectedRequest.request_id);
                if (error) throw error;
            }

            toast({
                title: status === 'completed' ? "تم التأكيد" : "تم الرفض",
                description: status === 'completed' ? "تم شحن رصيد المحفظة بنجاح." : "تم رفض طلب الشحن.",
            });

            setShowDetailsDialog(false);
            setAdminNotes("");
            refetch();
        } catch (error: any) {
            toast({
                title: "خطأ",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout
            title="إدارة طلبات شحن الرصيد"
            subtitle="مراجعة وتأكيد الحوالات البنكية لشحن محافظ الشركاء والعملاء"
        >
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="بحث برقم الحوالة أو اسم الشركة..."
                                className="pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="py-4 px-4 font-bold">الجهة</th>
                                <th className="py-4 px-4 font-bold">المبلغ</th>
                                <th className="py-4 px-4 font-bold">طريقة الدفع</th>
                                <th className="py-4 px-4 font-bold">رقم الحوالة</th>
                                <th className="py-4 px-4 font-bold">الحالة</th>
                                <th className="py-4 px-4 font-bold">التاريخ</th>
                                <th className="py-4 px-4 font-bold">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                [1, 2, 3].map(i => <tr key={i}><td colSpan={7} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>)
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">لا توجد طلبات شحن حالياً</td></tr>
                            ) : (
                                filteredRequests.map((r) => (
                                    <tr key={r.request_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-4 px-4">
                                            <p className="font-bold">{r.wallet?.partner?.company_name || r.wallet?.user?.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{r.wallet?.partner ? 'شركة / شريك' : 'عميل فردي'}</p>
                                        </td>
                                        <td className="py-4 px-4 font-black text-primary">{r.amount.toLocaleString()} ر.س</td>
                                        <td className="py-4 px-4">{r.payment_method}</td>
                                        <td className="py-4 px-4 font-mono">{r.transaction_ref}</td>
                                        <td className="py-4 px-4">
                                            {r.status === 'pending' && <Badge variant="outline" className="text-amber-600 bg-amber-50 gap-1"><Clock className="w-3 h-3" /> انتظار</Badge>}
                                            {r.status === 'completed' && <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> مؤكد</Badge>}
                                            {r.status === 'rejected' && <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> مرفوض</Badge>}
                                        </td>
                                        <td className="py-4 px-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                                        <td className="py-4 px-4">
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                setSelectedRequest(r);
                                                setShowDetailsDialog(true);
                                            }}>
                                                <Eye className="w-4 h-4 ml-2" /> تفاصيل
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>تفاصيل طلب الشحن</DialogTitle>
                        <DialogDescription>مراجعة بيانات الحوالة والموافقة على شحن الرصيد</DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase">المبلغ</p>
                                    <p className="text-lg font-black text-primary">{selectedRequest.amount} ر.س</p>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase">رقم الحوالة</p>
                                    <p className="text-lg font-mono font-bold">{selectedRequest.transaction_ref}</p>
                                </div>
                            </div>

                            {selectedRequest.proof_image_url && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> صورة السند / الإيصال</p>
                                    <div className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90" onClick={() => window.open(selectedRequest.proof_image_url, '_blank')}>
                                        <img src={selectedRequest.proof_image_url} alt="Proof" className="w-full h-auto max-h-48 object-contain bg-black/5" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>ملاحظات الإدارة</Label>
                                <Textarea
                                    placeholder="أدخل أي ملاحظات للعميل هنا..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                />
                            </div>

                            {selectedRequest.status === 'pending' && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-amber-800 text-[10px]">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p>تنبيه: عند الضغط على "تأكيد الشحن"، سيتم إضافة المبلغ فوراً لمحفظة العميل ولا يمكن التراجع عن هذه العملية آلياً.</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>إغلاق</Button>
                        {selectedRequest?.status === 'pending' && (
                            <>
                                <Button variant="destructive" onClick={() => handleAction('rejected')} disabled={isSubmitting}>رفض الطلب</Button>
                                <Button onClick={() => handleAction('completed')} disabled={isSubmitting}>تأكيد الشحن</Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default DepositsManagement;
