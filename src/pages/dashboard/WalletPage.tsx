import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Plus,
    ArrowRightLeft,
    Banknote,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Printer
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WalletPage = () => {
    const { wallet, transactions, isLoading, requestWithdrawal, requestDeposit } = useWallet();
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [showDepositDialog, setShowDepositDialog] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [transactionRef, setTransactionRef] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");

    const handleWithdraw = () => {
        requestWithdrawal.mutate({
            amount: parseFloat(withdrawAmount),
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber
        }, {
            onSuccess: () => {
                setShowWithdrawDialog(false);
                setWithdrawAmount("");
                setBankName("");
                setAccountName("");
                setAccountNumber("");
            }
        });
    };

    const handleDeposit = () => {
        requestDeposit.mutate({
            amount: parseFloat(depositAmount),
            payment_method: paymentMethod,
            transaction_ref: transactionRef
        }, {
            onSuccess: () => {
                setShowDepositDialog(false);
                setDepositAmount("");
                setPaymentMethod("");
                setTransactionRef("");
            }
        });
    };

    const openPrintableStatement = () => {
        window.open(`/dashboard/financial-statement?wallet_id=${wallet?.wallet_id}`, '_blank');
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
            case 'payment': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
            case 'withdrawal': return <Banknote className="w-4 h-4 text-amber-600" />;
            case 'bonus': return <Plus className="w-4 h-4 text-primary" />;
            default: return <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'deposit': return 'استرداد / شحن';
            case 'payment': return 'دفع حجز';
            case 'withdrawal': return 'سحب نقدي';
            case 'bonus': return 'مكافأة';
            default: return 'تسوية';
        }
    };

    return (
        <DashboardLayout
            title={wallet?.partner_id ? "محفظة الشركة" : "المحفظة الإلكترونية"}
            subtitle={wallet?.partner_id ? "إدارة الرصيد التشغيلي للمكتب" : "إدارة رصيدك المالي والعمليات المستردة"}
        >
            <div className="space-y-6">
                {/* Balance Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2 bg-primary text-primary-foreground overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <Wallet className="w-64 h-64 -ml-20 -mt-20 rotate-12" />
                        </div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-primary-foreground/70 text-sm font-medium mb-1">
                                        {wallet?.partner_id ? "رصيد المكتب الحالي" : "الرصيد الحالي"}
                                    </p>
                                    <h2 className="text-5xl font-black">
                                        {isLoading ? <Skeleton className="h-12 w-32 bg-white/20" /> : `${wallet?.balance?.toLocaleString() || '0'} ${wallet?.currency || 'ر.س'}`}
                                    </h2>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <Wallet className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="gap-2">
                                            <Banknote className="w-4 h-4" />
                                            طلب سحب كاش
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>طلب سحب رصيد نقدي</DialogTitle>
                                            <DialogDescription>سيتم تحويل المبلغ لحسابك البنكي خلال 3-5 أيام عمل.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>المبلغ المراد سحبه</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                />
                                                <p className="text-[10px] text-muted-foreground">الحد الأدنى للسحب: 50 ر.س</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>اسم البنك / المحفظة</Label>
                                                <Input
                                                    placeholder="مثلاً: الكريمي، بنك التضامن..."
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>اسم صاحب الحساب</Label>
                                                <Input
                                                    placeholder="الاسم الكامل كما هو في البنك"
                                                    value={accountName}
                                                    onChange={(e) => setAccountName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رقم الحساب / الآيبان</Label>
                                                <Input
                                                    placeholder="أدخل رقم الحساب بدقة"
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>إلغاء</Button>
                                            <Button onClick={handleWithdraw} disabled={requestWithdrawal.isPending}>
                                                {requestWithdrawal.isPending ? 'جاري التقديم...' : 'تأكيد الطلب'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white gap-2">
                                            <Plus className="w-4 h-4" />
                                            شحن الرصيد
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>إشعار شحن رصيد</DialogTitle>
                                            <DialogDescription>قم بتحويل المبلغ لإحدى حساباتنا ثم أدخل بيانات الحوالة هنا.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                                                <p className="font-bold mb-1">حساباتنا للتحويل:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>الكريمي: 12345678</li>
                                                    <li>بنك التضامن: 98765432</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>المبلغ المحول</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={depositAmount}
                                                    onChange={(e) => setDepositAmount(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>طريقة التحويل</Label>
                                                <Input
                                                    placeholder="مثلاً: الكريمي، بنك التضامن..."
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>رقم المرجع / الحوالة</Label>
                                                <Input
                                                    placeholder="أدخل رقم الحوالة للتأكيد"
                                                    value={transactionRef}
                                                    onChange={(e) => setTransactionRef(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>إلغاء</Button>
                                            <Button onClick={handleDeposit} disabled={requestDeposit.isPending}>
                                                {requestDeposit.isPending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                    variant="outline"
                                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white gap-2"
                                    onClick={openPrintableStatement}
                                >
                                    <Printer className="w-4 h-4" />
                                    كشف حساب
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 flex flex-col justify-center items-center p-6 text-center bg-muted/30">
                        <AlertCircle className="w-10 h-10 text-amber-500 mb-4" />
                        <h3 className="font-bold mb-2">لماذا المحفظة؟</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            استخدم المحفظة لاسترداد مبالغ الحجوزات الملغاة فوراً، أو لشحن رصيدك لتسهيل عملية الحجز القادمة دون الحاجة لتحويلات بنكية متكررة.
                        </p>
                    </Card>
                </div>

                {/* Transactions History */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        <h3 className="font-black text-lg">سجل العمليات</h3>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">العملية</th>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">التاريخ</th>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">المبلغ</th>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">الرصيد السابق</th>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">الرصيد الجديد</th>
                                            <th className="py-3 px-4 font-bold text-muted-foreground">المرجع</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {isLoading ? (
                                            [1, 2, 3].map((i) => (
                                                <tr key={i}>
                                                    <td colSpan={6} className="p-4"><Skeleton className="h-8 w-full" /></td>
                                                </tr>
                                            ))
                                        ) : transactions?.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-muted-foreground">لا توجد عمليات سابقة</td>
                                            </tr>
                                        ) : (
                                            transactions?.map((tx) => (
                                                <tr key={tx.transaction_id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                                                {getTransactionIcon(tx.type)}
                                                            </div>
                                                            <span className="font-bold">{getTransactionLabel(tx.type)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                                                    </td>
                                                    <td className={`py-4 px-4 font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount} {wallet?.currency}
                                                    </td>
                                                    <td className="py-4 px-4 text-muted-foreground">{tx.previous_balance}</td>
                                                    <td className="py-4 px-4 font-bold">{tx.new_balance}</td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant="outline" className="font-mono text-[10px]">
                                                            {tx.reference_id ? `#${tx.reference_id}` : '---'}
                                                        </Badge>
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
            </div>
        </DashboardLayout>
    );
};

export default WalletPage;
