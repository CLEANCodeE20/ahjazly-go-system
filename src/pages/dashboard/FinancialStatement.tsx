import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinancialStatement = () => {
    const [searchParams] = useSearchParams();
    const partnerId = searchParams.get("partner_id");
    const walletId = searchParams.get("wallet_id");
    const [data, setData] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [partnerId, walletId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (partnerId) {
                // Fetch Partner Statement
                const { data: balance } = await supabase
                    .from("partner_balance_report" as any)
                    .select("*")
                    .eq("partner_id", partnerId as any)
                    .single();

                const { data: ledger } = await supabase
                    .from("booking_ledger")
                    .select("*")
                    .eq("partner_id", partnerId as any)
                    .order("created_at", { ascending: false });

                setData(balance);
                setTransactions(ledger || []);
            } else if (walletId) {
                // Fetch User/Partner Wallet Statement
                const { data: wallet } = await supabase
                    .from("wallets" as any)
                    .select("*, user:users(full_name, phone_number), partner:partners(company_name)")
                    .eq("wallet_id", walletId as any)
                    .single();

                const { data: txs } = await supabase
                    .from("wallet_transactions" as any)
                    .select("*")
                    .eq("wallet_id", walletId as any)
                    .order("created_at", { ascending: false });

                setData(wallet);
                setTransactions(txs || []);
            }
        } catch (error) {
            console.error("Error fetching statement:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-8 md:p-16 text-right" dir="rtl">
            {/* Print Controls - Hidden on Print */}
            <div className="fixed top-4 left-4 flex gap-2 print:hidden">
                <Button onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" /> طباعة التقرير
                </Button>
                <Button variant="outline" onClick={() => window.close()}>إغلاق</Button>
            </div>

            {/* Report Header */}
            <div className="flex justify-between items-center border-b-2 border-primary pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-primary">أحجزلي - Ahjazly</h1>
                    <p className="text-sm text-muted-foreground mt-1">منصة إدارة النقل الذكية</p>
                </div>
                <div className="text-left">
                    <h2 className="text-xl font-bold">كشف حساب مالي</h2>
                    <p className="text-xs text-muted-foreground">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
            </div>

            {/* Entity Info */}
            <div className="grid grid-cols-2 gap-8 mb-8 bg-muted/30 p-6 rounded-xl">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">بيانات الجهة:</p>
                    <p className="text-lg font-bold">
                        {partnerId ? data?.company_name : (data?.partner?.company_name || data?.user?.full_name)}
                    </p>
                    <p className="text-sm">
                        {partnerId ? `رقم الشريك: #${partnerId}` : (data?.partner ? `رقم الشريك: #${data.partner_id}` : `رقم الهاتف: ${data?.user?.phone_number}`)}
                    </p>
                </div>
                <div className="text-left">
                    <p className="text-xs text-muted-foreground mb-1">الرصيد الحالي المستحق:</p>
                    <p className="text-3xl font-black text-primary">
                        {partnerId ? data?.current_balance?.toLocaleString() : data?.balance?.toLocaleString()} ر.س
                    </p>
                </div>
            </div>

            {/* Summary Table */}
            {partnerId && (
                <div className="mb-8">
                    <h3 className="font-bold mb-4 border-r-4 border-secondary pr-3">ملخص الحساب</h3>
                    <table className="w-full border-collapse border border-border text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="border border-border p-3">إجمالي الأرباح</th>
                                <th className="border border-border p-3">إجمالي المسحوبات</th>
                                <th className="border border-border p-3">الرصيد المتاح للتسوية</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-center">
                                <td className="border border-border p-3 font-bold text-green-600">{data?.total_earned?.toLocaleString()} ر.س</td>
                                <td className="border border-border p-3 font-bold text-red-600">{data?.total_settled?.toLocaleString()} ر.س</td>
                                <td className="border border-border p-3 font-black text-primary">{data?.available_for_settlement?.toLocaleString()} ر.س</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Transactions Table */}
            <div>
                <h3 className="font-bold mb-4 border-r-4 border-secondary pr-3">سجل العمليات التفصيلي</h3>
                <table className="w-full border-collapse border border-border text-xs">
                    <thead className="bg-muted">
                        <tr>
                            <th className="border border-border p-2">التاريخ</th>
                            <th className="border border-border p-2">العملية</th>
                            <th className="border border-border p-2">الوصف / المرجع</th>
                            <th className="border border-border p-2">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-muted/10">
                                <td className="border border-border p-2 text-center">
                                    {new Date(tx.created_at).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="border border-border p-2 text-center">
                                    <span className="font-bold">
                                        {partnerId ? tx.entry_type : tx.type}
                                    </span>
                                </td>
                                <td className="border border-border p-2">
                                    {partnerId ? tx.note : tx.description}
                                    {tx.reference_id && <span className="text-[10px] block opacity-50">{tx.reference_id}</span>}
                                </td>
                                <td className={`border border-border p-2 text-center font-bold ${(tx.amount > 0 && partnerId) || (tx.amount > 0 && walletId)
                                    ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {tx.amount?.toLocaleString()} ر.س
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-border text-center text-xs text-muted-foreground">
                <p>هذا التقرير تم إنشاؤه آلياً من منصة أحجزلي ولا يتطلب توقيعاً رسمياً.</p>
                <p className="mt-1">www.ahjazly.com | دعم العملاء: 920000000</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          body { padding: 0; margin: 0; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}} />
        </div>
    );
};

export default FinancialStatement;
