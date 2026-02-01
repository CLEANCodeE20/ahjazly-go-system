import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Wallet,
    Search,
    Plus,
    Minus,
    History,
    User,
    ArrowRightLeft,
    Loader2,
    AlertCircle
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWallet {
    wallet_id: number;
    auth_id: string; // Gold Standard: UUID
    balance: number;
    currency: string;
    user: {
        full_name: string;
        phone_number: string;
    }
}

const AdminWalletManagement = () => {
    const { data: wallets, loading, refetch } = useSupabaseCRUD<UserWallet>({
        tableName: 'wallets' as any,
        primaryKey: 'wallet_id',
        initialFetch: true,
        queryOptions: {
            select: `
        *,
        user:users(full_name, phone_number)
      `
        }
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
    const [showAdjustDialog, setShowAdjustDialog] = useState(false);
    const [adjustType, setAdjustType] = useState<'deposit' | 'payment'>('deposit');
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredWallets = wallets.filter(w =>
        w.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.user?.phone_number?.includes(searchTerm)
    );

    const handleAdjustment = async () => {
        if (!selectedWallet) return;
        setIsSubmitting(true);

        try {
            const { data, error } = await (supabase.rpc as any)('process_wallet_transaction', {
                p_auth_id: selectedWallet.auth_id, // Gold Standard: UUID
                p_type: adjustType,
                p_amount: parseFloat(amount),
                p_reference_id: 'MANUAL-' + Date.now(),
                p_description: notes || (adjustType === 'deposit' ? 'إيداع يدوي من الإدارة' : 'خصم يدوي من الإدارة')
            });

            if (error) throw error;
            if (!(data as any).success) throw new Error((data as any).message);

            toast({
                title: "تم التحديث",
                description: "تم تعديل رصيد المحفظة بنجاح.",
            });

            setShowAdjustDialog(false);
            setAmount("");
            setNotes("");
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
            title="إدارة محافظ العملاء"
            subtitle="الرقابة الكاملة على أرصدة المستخدمين وإجراء التعديلات اليدوية"
        >
            <div className="space-y-6">
                {/* Search and Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="md:col-span-3">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    placeholder="بحث باسم العميل أو رقم الهاتف..."
                                    className="pr-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary text-primary-foreground">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs opacity-70">إجمالي أرصدة العملاء</p>
                                <p className="text-xl font-black">
                                    {wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString()} ر.س
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 opacity-20" />
                        </CardContent>
                    </Card>
                </div>

                {/* Wallets Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="py-4 px-4 font-bold">العميل</th>
                                        <th className="py-4 px-4 font-bold">الرصيد الحالي</th>
                                        <th className="py-4 px-4 font-bold">العملة</th>
                                        <th className="py-4 px-4 font-bold">آخر تحديث</th>
                                        <th className="py-4 px-4 font-bold">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                                        ))
                                    ) : filteredWallets.length === 0 ? (
                                        <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">لا توجد محافظ مطابقة للبحث</td></tr>
                                    ) : (
                                        filteredWallets.map((w) => (
                                            <tr key={w.wallet_id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{w.user?.full_name || 'عميل غير معروف'}</p>
                                                            <p className="text-xs text-muted-foreground">{w.user?.phone_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 font-black text-lg text-primary">
                                                    {w.balance.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-4 text-muted-foreground">{w.currency}</td>
                                                <td className="py-4 px-4 text-muted-foreground">---</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1 h-8"
                                                            onClick={() => {
                                                                setSelectedWallet(w);
                                                                setAdjustType('deposit');
                                                                setShowAdjustDialog(true);
                                                            }}
                                                        >
                                                            <Plus className="w-3 h-3" /> إيداع
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1 h-8 text-red-600 hover:text-red-700"
                                                            onClick={() => {
                                                                setSelectedWallet(w);
                                                                setAdjustType('payment');
                                                                setShowAdjustDialog(true);
                                                            }}
                                                        >
                                                            <Minus className="w-3 h-3" /> خصم
                                                        </Button>
                                                    </div>
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

            {/* Adjustment Dialog */}
            <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {adjustType === 'deposit' ? 'إيداع رصيد يدوي' : 'خصم رصيد يدوي'}
                        </DialogTitle>
                        <DialogDescription>
                            تعديل رصيد المحفظة للعميل: {selectedWallet?.user?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-amber-800 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p>تنبيه: هذه العملية ستؤثر مباشرة على الرصيد المالي للعميل وسيتم تسجيلها في كشف حسابه.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>سبب التعديل / ملاحظات</Label>
                            <Textarea
                                placeholder="مثلاً: تسوية حجز قديم، مكافأة تميز..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>إلغاء</Button>
                        <Button
                            variant={adjustType === 'deposit' ? 'default' : 'destructive'}
                            onClick={handleAdjustment}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'جاري التنفيذ...' : 'تأكيد التعديل'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminWalletManagement;
