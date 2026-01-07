import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    RefreshCw,
    Search,
    CheckCircle2,
    Clock,
    ArrowLeftRight,
    User,
    Phone,
    Banknote,
    Navigation,
    Loader2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RefundRecord {
    refund_id: number;
    booking_id: number;
    user_id: number;
    refund_amount: number;
    refund_method: string;
    bank_account: string | null;
    stc_pay_number: string | null;
    transaction_id: string | null;
    status: string;
    created_at: string;
    user?: {
        full_name: string;
        phone_number: string;
    };
}

const RefundsManagement = () => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
    const [txId, setTxId] = useState("");
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const { data: refunds, loading, refetch, update } = useSupabaseCRUD<RefundRecord>({
        tableName: 'refunds',
        primaryKey: 'refund_id',
        initialFetch: true,
        select: '*, user:users(full_name, phone_number)'
    });

    const handleProcessRefund = async () => {
        if (!selectedRefund || !txId) {
            toast.error("يرجى إدخال رقم المعاملة");
            return;
        }

        setProcessing(true);
        try {
            await update(selectedRefund.refund_id, {
                status: 'completed',
                transaction_id: txId,
                //@ts-ignore - added in migration but might not be in types yet
                completed_at: new Date().toISOString(),
                processed_at: new Date().toISOString()
            });

            setIsConfirmOpen(false);
            setTxId("");
            // Explicitly refetch to ensure we get joined user data back 
            // as update.select().single() loses joins
            await refetch();
        } catch (error: any) {
            // Already handled by hook toast, but let's close if it was a success masked as error
        } finally {
            setProcessing(false);
        }
    };

    const filteredRefunds = refunds.filter(r => {
        const matchesSearch = r.user?.full_name?.includes(searchTerm) ||
            r.booking_id.toString().includes(searchTerm);
        const matchesStatus = filterStatus === "all" || r.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> تم الإرجاع</span>;
            case "pending":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
            case "failed":
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><ArrowLeftRight className="w-3 h-3" /> فشل</span>;
            default:
                return <span className="text-xs text-muted-foreground">{status}</span>;
        }
    };

    return (
        <DashboardLayout
            title="إدارة المستردات"
            subtitle="معالجة طلبات إرجاع المبالغ للعملاء"
        >
            <div className="space-y-6">
                {/* Filters */}
                <div className="bg-card rounded-xl border border-border p-4 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="بحث باسم العميل أو رقم الحجز..."
                            className="pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الطلبات</SelectItem>
                            <SelectItem value="pending">قيد المراجعة</SelectItem>
                            <SelectItem value="completed">تم الإرجاع</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                    ) : filteredRefunds.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-card rounded-xl border border-dashed border-border text-muted-foreground">
                            لا توجد طلبات استرداد حالياً
                        </div>
                    ) : (
                        filteredRefunds.map((refund) => (
                            <div key={refund.refund_id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">BK-{refund.booking_id}</span>
                                        <h3 className="text-lg font-bold mt-1 flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            {refund.user?.full_name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {refund.user?.phone_number}
                                        </p>
                                    </div>
                                    {getStatusBadge(refund.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-5 border-y border-border/50 py-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">المبلغ المستحق</p>
                                        <p className="text-xl font-bold text-secondary">{refund.refund_amount} ر.س</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">طريقة الدفع الأصلية</p>
                                        <p className="text-sm font-medium">{refund.refund_method}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                        تاريخ الإلغاء: {new Date(refund.created_at).toLocaleString('ar-SA')}
                                    </div>
                                    {refund.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => { setSelectedRefund(refund); setIsConfirmOpen(true); }}
                                        >
                                            <Banknote className="w-4 h-4 ml-2" />
                                            تأكيد الإرجاع
                                        </Button>
                                    )}
                                    {refund.status === 'completed' && (
                                        <div className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
                                            رقم المعاملة: {refund.transaction_id}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد إرجاع المبلغ</DialogTitle>
                        <DialogDescription>
                            يرجى إدخال رقم المرجع (Transaction ID) للحوالة التي قمت بإرسالها للعميل لتوثيقها في النظام.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-3 rounded-lg text-sm">
                            <div className="flex justify-between mb-1">
                                <span>اسم العميل:</span>
                                <span className="font-bold">{selectedRefund?.user?.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>المبلغ المطلوب إرجاعه:</span>
                                <span className="font-bold text-secondary">{selectedRefund?.refund_amount} ر.س</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">رقم الحوالة / المعاملة</label>
                            <Input
                                placeholder="أدخل رقم العملية..."
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>إلغاء</Button>
                        <Button onClick={handleProcessRefund} disabled={processing || !txId}>
                            {processing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                            إتمام العملية
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default RefundsManagement;
