import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Building2,
    DollarSign,
    ArrowRightLeft,
    CheckCircle2,
    Clock,
    Search,
    Plus,
    Calendar,
    Loader2,
    Printer
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

interface PartnerBalance {
    partner_id: number;
    company_name: string;
    total_earned: number;
    total_settled: number;
    total_pending_settlement: number;
    current_balance: number;
    available_for_settlement: number;
}

interface SettlementRecord {
    settlement_id: number;
    partner_id: number;
    amount: number;
    period_start: string;
    period_end: string;
    status: string;
    payment_reference: string;
    created_at: string;
}

const PartnerSettlements = () => {
    const { userRole } = useAuth();
    const { data: balances, loading: balancesLoading } = useSupabaseCRUD<PartnerBalance>({
        tableName: 'partner_balance_report' as any,
        primaryKey: 'partner_id',
        initialFetch: true
    });

    const { data: settlements, loading: settlementsLoading, refetch: refetchSettlements } = useSupabaseCRUD<SettlementRecord>({
        tableName: 'partner_settlements' as any,
        primaryKey: 'settlement_id',
        initialFetch: true
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPartner, setSelectedPartner] = useState<PartnerBalance | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [amount, setAmount] = useState("");
    const [ref, setRef] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSettlement = async () => {
        if (!selectedPartner) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('partner_settlements' as any)
                .insert({
                    partner_id: selectedPartner.partner_id,
                    amount: parseFloat(amount),
                    period_start: new Date(new Date().setDate(1)).toISOString(), // Default to start of month
                    period_end: new Date().toISOString(),
                    payment_reference: ref,
                    status: 'completed',
                    processed_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({ title: "تمت التسوية", description: "تم تسجيل عملية الدفع للشريك بنجاح" });
            setShowAddDialog(false);
            refetchSettlements();
        } catch (error: any) {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPrintableStatement = (pId: number) => {
        window.open(`/dashboard/financial-statement?partner_id=${pId}`, '_blank');
    };

    return (
        <DashboardLayout
            title="تسوية حسابات الشركاء"
            subtitle="إدارة المدفوعات من المنصة إلى شركات النقل (غرفة المقاصة)"
        >
            <div className="space-y-8">
                {/* Partner Balances Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {balancesLoading ? (
                        <Skeleton className="h-32 w-full" />
                    ) : balances.map((pb) => (
                        <Card key={pb.partner_id} className="relative overflow-hidden border-primary/10">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    {pb.company_name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">المستحق الحالي</p>
                                        <p className="text-2xl font-black text-primary">{pb.current_balance.toLocaleString()} ر.س</p>
                                    </div>
                                    {userRole?.role === 'SUPERUSER' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => openPrintableStatement(pb.partner_id)}
                                            >
                                                <Printer className="w-3 h-3" /> كشف حساب
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => {
                                                    setSelectedPartner(pb);
                                                    setAmount(pb.available_for_settlement.toString());
                                                    setShowAddDialog(true);
                                                }}
                                            >
                                                تسوية الآن
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Settlement History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-lg flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-secondary" />
                            سجل التسويات المالية
                        </h3>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="py-4 px-4 font-bold">الشريك</th>
                                            <th className="py-4 px-4 font-bold">المبلغ</th>
                                            <th className="py-4 px-4 font-bold">المرجع</th>
                                            <th className="py-4 px-4 font-bold">التاريخ</th>
                                            <th className="py-4 px-4 font-bold">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {settlementsLoading ? (
                                            <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                                        ) : settlements.map((s) => (
                                            <tr key={s.settlement_id}>
                                                <td className="py-4 px-4 font-bold">
                                                    {balances.find(b => b.partner_id === s.partner_id)?.company_name || `#${s.partner_id}`}
                                                </td>
                                                <td className="py-4 px-4 font-black text-secondary">{s.amount} ر.س</td>
                                                <td className="py-4 px-4 font-mono text-xs">{s.payment_reference || '---'}</td>
                                                <td className="py-4 px-4 text-muted-foreground">
                                                    {new Date(s.created_at).toLocaleDateString('ar-SA')}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">مكتمل</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Settlement Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تسجيل تسوية مالية للشريك</DialogTitle>
                        <DialogDescription>تأكيد تحويل المستحقات من حساب المنصة إلى حساب {selectedPartner?.company_name}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>المبلغ المحول</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>رقم العملية / المرجع البنكي</Label>
                            <Input
                                placeholder="أدخل رقم الحوالة..."
                                value={ref}
                                onChange={(e) => setRef(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                        <Button onClick={handleAddSettlement} disabled={isSubmitting}>
                            {isSubmitting ? 'جاري الحفظ...' : 'تأكيد التسوية النهائية'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PartnerSettlements;
