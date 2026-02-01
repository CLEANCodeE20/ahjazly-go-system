import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DollarSign,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Download,
    FileText,
    Calendar,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { useExport } from "@/hooks/useExport";
import { FileSpreadsheet } from "lucide-react";

interface RefundRecord {
    refund_id: number;
    booking_id: number;
    customer_name: string;
    refund_amount: number;
    refund_method: string | null;
    status: string;
    refund_reference: string | null;
    requested_at: string;
    processed_at: string | null;
    processing_hours: number;
    processed_by_name: string | null;
    rejection_reason: string | null;
    notes: string | null;
    original_payment_method: string;
}

const RefundsManagement = () => {
    const { can } = usePermissions();
    const { exportToExcel, exportToPDF } = useExport();
    const [refunds, setRefunds] = useState<RefundRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        status: "",
        refund_reference: "",
        notes: "",
        rejection_reason: "",
    });

    useEffect(() => {
        fetchRefunds();
    }, []);

    const fetchRefunds = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("refunds_status_report")
            .select("*")
            .order("requested_at", { ascending: false });

        if (!error && data) {
            setRefunds(data);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async () => {
        if (!selectedRefund || !formData.status) {
            toast({ title: "خطأ", description: "يرجى اختيار الحالة", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            const { data, error } = await supabase.rpc("update_refund_status", {
                p_refund_id: selectedRefund.refund_id,
                p_new_status: formData.status,
                p_refund_reference: formData.refund_reference || null,
                p_notes: formData.notes || null,
                p_rejection_reason: formData.status === "rejected" ? formData.rejection_reason : null,
            });

            if (error) throw error;

            toast({ title: "✅ تم التحديث", description: "تم تحديث حالة الاسترداد بنجاح" });
            setIsDialogOpen(false);
            setSelectedRefund(null);
            setFormData({ status: "", refund_reference: "", notes: "", rejection_reason: "" });
            fetchRefunds();
        } catch (error: any) {
            toast({ title: "❌ خطأ", description: error.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const openUpdateDialog = (refund: RefundRecord) => {
        setSelectedRefund(refund);
        setFormData({
            status: refund.status,
            refund_reference: refund.refund_reference || "",
            notes: refund.notes || "",
            rejection_reason: refund.rejection_reason || "",
        });
        setIsDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-blue-100 text-blue-800",
            processing: "bg-purple-100 text-purple-800",
            completed: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
            failed: "bg-gray-100 text-gray-800",
        };
        const labels = {
            pending: "قيد الانتظار",
            approved: "تمت الموافقة",
            processing: "قيد المعالجة",
            completed: "مكتمل",
            rejected: "مرفوض",
            failed: "فشل",
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    const filteredRefunds = refunds.filter((refund) => {
        const matchesSearch =
            refund.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refund.booking_id.toString().includes(searchQuery);
        const matchesStatus = filterStatus === "all" || refund.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const pendingCount = refunds.filter((r) => r.status === "pending").length;
    const completedCount = refunds.filter((r) => r.status === "completed").length;
    const totalAmount = refunds.reduce((sum, r) => sum + r.refund_amount, 0);

    // Export function
    const handleExport = (format: "excel" | "pdf") => {
        const dataToExport = filteredRefunds.map((r) => ({
            "رقم الطلب": r.refund_id,
            "رقم الحجز": r.booking_id,
            "اسم العميل": r.customer_name,
            "المبلغ": r.refund_amount.toFixed(2),
            "طريقة الدفع": r.refund_method || "-",
            "الحالة": r.status,
            "الرقم المرجعي": r.refund_reference || "-",
            "تاريخ الطلب": new Date(r.requested_at).toLocaleDateString("ar-SA"),
            "تاريخ المعالجة": r.processed_at ? new Date(r.processed_at).toLocaleDateString("ar-SA") : "-",
            "معالج بواسطة": r.processed_by_name || "-",
        }));

        if (format === "excel") {
            exportToExcel(dataToExport, "refunds_report");
        } else {
            exportToPDF(
                dataToExport,
                [
                    { header: "رقم الطلب", key: "رقم الطلب" },
                    { header: "رقم الحجز", key: "رقم الحجز" },
                    { header: "اسم العميل", key: "اسم العميل" },
                    { header: "المبلغ", key: "المبلغ" },
                    { header: "الحالة", key: "الحالة" },
                    { header: "تاريخ الطلب", key: "تاريخ الطلب" },
                ],
                { title: "تقرير طلبات الاسترداد" }
            );
        }
    };

    return (
        <DashboardLayout
            title="إدارة طلبات الاسترداد"
            subtitle="معالجة ومتابعة طلبات استرداد الأموال"
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard/advanced-reports?type=refunds'}>
                        <FileText className="w-4 h-4 ml-2 text-blue-600" />
                        تقرير تفصيلي
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("excel")}>
                        <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
                        تصدير Excel
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("pdf")}>
                        <Download className="w-4 h-4 ml-2 text-red-600" />
                        تصدير PDF
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                                <p className="text-sm text-muted-foreground">مكتمل</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{totalAmount.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">إجمالي المبالغ (ر.س)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="بحث بالاسم أو رقم الحجز..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل الحالات</SelectItem>
                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                <SelectItem value="approved">تمت الموافقة</SelectItem>
                                <SelectItem value="processing">قيد المعالجة</SelectItem>
                                <SelectItem value="completed">مكتمل</SelectItem>
                                <SelectItem value="rejected">مرفوض</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Refunds List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8">جاري التحميل...</div>
                    ) : filteredRefunds.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">لا توجد طلبات استرداد</div>
                    ) : (
                        filteredRefunds.map((refund) => (
                            <div
                                key={refund.refund_id}
                                className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-foreground text-lg">{refund.customer_name}</h3>
                                            {getStatusBadge(refund.status)}
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                            <div>
                                                <span className="font-medium">رقم الحجز:</span> #{refund.booking_id}
                                            </div>
                                            <div>
                                                <span className="font-medium">المبلغ:</span> {refund.refund_amount} ر.س
                                            </div>
                                            <div>
                                                <span className="font-medium">الطريقة:</span> {refund.refund_method || "-"}
                                            </div>
                                            <div>
                                                <span className="font-medium">وقت المعالجة:</span>{" "}
                                                {refund.processing_hours ? `${refund.processing_hours.toFixed(1)} ساعة` : "-"}
                                            </div>
                                        </div>
                                        {refund.refund_reference && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">الرقم المرجعي:</span> {refund.refund_reference}
                                            </div>
                                        )}
                                        {refund.rejection_reason && (
                                            <div className="mt-2 text-sm text-red-600">
                                                <span className="font-medium">سبب الرفض:</span> {refund.rejection_reason}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        {can("bookings.refund") && refund.status !== "completed" && refund.status !== "rejected" && (
                                            <Button onClick={() => openUpdateDialog(refund)} variant="outline">
                                                تحديث الحالة
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Update Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>تحديث حالة الاسترداد</DialogTitle>
                        <DialogDescription>
                            الحجز رقم #{selectedRefund?.booking_id} - {selectedRefund?.customer_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>الحالة الجديدة *</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="approved">تمت الموافقة</SelectItem>
                                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                                    <SelectItem value="completed">مكتمل</SelectItem>
                                    <SelectItem value="rejected">مرفوض</SelectItem>
                                    <SelectItem value="failed">فشل</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.status === "completed" && (
                            <div className="space-y-2">
                                <Label>الرقم المرجعي</Label>
                                <Input
                                    placeholder="رقم المعاملة من البنك/بوابة الدفع"
                                    value={formData.refund_reference}
                                    onChange={(e) => setFormData({ ...formData, refund_reference: e.target.value })}
                                />
                            </div>
                        )}

                        {formData.status === "rejected" && (
                            <div className="space-y-2">
                                <Label>سبب الرفض *</Label>
                                <Textarea
                                    placeholder="اذكر سبب رفض الاسترداد"
                                    value={formData.rejection_reason}
                                    onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                placeholder="ملاحظات إضافية (اختياري)"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            إلغاء
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={isProcessing}>
                            {isProcessing ? "جاري التحديث..." : "حفظ التغييرات"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default RefundsManagement;
