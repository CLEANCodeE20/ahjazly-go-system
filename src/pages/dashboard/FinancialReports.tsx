import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    DollarSign,
    Calendar,
    Download,
    FileSpreadsheet,
    Users,
    CreditCard,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useExport } from "@/hooks/useExport";

interface DailySummary {
    report_date: string;
    total_bookings: number;
    paid_bookings: number;
    cancelled_bookings: number;
    gross_revenue: number;
    platform_commission: number;
    partner_revenue: number;
    total_refunds: number;
    cancellation_fees: number;
    net_revenue: number;
}

interface PartnerSummary {
    partner_id: number;
    company_name: string;
    total_bookings: number;
    paid_bookings: number;
    gross_revenue: number;
    platform_commission: number;
    partner_revenue: number;
    total_refunds: number;
    net_partner_revenue: number;
    online_payments: number;
    cash_payments: number;
}

interface PaymentMethodReport {
    payment_method: string;
    transaction_count: number;
    successful_count: number;
    failed_count: number;
    total_amount: number;
    avg_transaction_value: number;
    success_rate_percentage: number;
}

const FinancialReports = () => {
    const [reportType, setReportType] = useState("daily");
    const [dailyData, setDailyData] = useState<DailySummary[]>([]);
    const [partnerData, setPartnerData] = useState<PartnerSummary[]>([]);
    const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodReport[]>([]);
    const [loading, setLoading] = useState(false);
    const { exportToExcel, exportToPDF } = useExport();

    useEffect(() => {
        fetchReportData();
    }, [reportType]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            if (reportType === "daily") {
                const { data } = await supabase
                    .from("daily_financial_summary")
                    .select("*")
                    .order("report_date", { ascending: false })
                    .limit(30);
                if (data) setDailyData(data);
            } else if (reportType === "partner") {
                const { data } = await supabase
                    .from("partner_financial_summary")
                    .select("*");
                if (data) setPartnerData(data);
            } else if (reportType === "payment_methods") {
                const { data } = await supabase
                    .from("payment_methods_report")
                    .select("*");
                if (data) setPaymentMethodData(data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format: "excel" | "pdf") => {
        let dataToExport: any[] = [];
        let columns: any[] = [];
        let title = "";

        if (reportType === "daily") {
            title = "التقرير المالي اليومي";
            dataToExport = dailyData.map((d) => ({
                "التاريخ": new Date(d.report_date).toLocaleDateString("ar-SA"),
                "إجمالي الحجوزات": d.total_bookings,
                "الحجوزات المدفوعة": d.paid_bookings,
                "الإيرادات الإجمالية": d.gross_revenue.toFixed(2),
                "عمولة المنصة": d.platform_commission.toFixed(2),
                "إيرادات الشركاء": d.partner_revenue.toFixed(2),
                "المبالغ المستردة": d.total_refunds.toFixed(2),
                "صافي الإيرادات": d.net_revenue.toFixed(2),
            }));
            columns = [
                { header: "التاريخ", key: "التاريخ" },
                { header: "إجمالي الحجوزات", key: "إجمالي الحجوزات" },
                { header: "الحجوزات المدفوعة", key: "الحجوزات المدفوعة" },
                { header: "الإيرادات الإجمالية", key: "الإيرادات الإجمالية" },
                { header: "عمولة المنصة", key: "عمولة المنصة" },
                { header: "صافي الإيرادات", key: "صافي الإيرادات" },
            ];
        } else if (reportType === "partner") {
            title = "تقرير الشركاء المالي";
            dataToExport = partnerData.map((p) => ({
                "الشريك": p.company_name,
                "الحجوزات": p.total_bookings,
                "الإيرادات الإجمالية": p.gross_revenue.toFixed(2),
                "عمولة المنصة": p.platform_commission.toFixed(2),
                "صافي إيرادات الشريك": p.net_partner_revenue.toFixed(2),
                "مدفوعات إلكترونية": p.online_payments.toFixed(2),
                "مدفوعات نقدية": p.cash_payments.toFixed(2),
            }));
            columns = [
                { header: "الشريك", key: "الشريك" },
                { header: "الحجوزات", key: "الحجوزات" },
                { header: "الإيرادات الإجمالية", key: "الإيرادات الإجمالية" },
                { header: "عمولة المنصة", key: "عمولة المنصة" },
                { header: "صافي إيرادات الشريك", key: "صافي إيرادات الشريك" },
            ];
        } else if (reportType === "payment_methods") {
            title = "تقرير طرق الدفع";
            dataToExport = paymentMethodData.map((pm) => ({
                "طريقة الدفع": pm.payment_method,
                "عدد المعاملات": pm.transaction_count,
                "الناجحة": pm.successful_count,
                "الفاشلة": pm.failed_count,
                "المبلغ الإجمالي": pm.total_amount.toFixed(2),
                "معدل النجاح %": pm.success_rate_percentage.toFixed(1),
            }));
            columns = [
                { header: "طريقة الدفع", key: "طريقة الدفع" },
                { header: "عدد المعاملات", key: "عدد المعاملات" },
                { header: "الناجحة", key: "الناجحة" },
                { header: "المبلغ الإجمالي", key: "المبلغ الإجمالي" },
                { header: "معدل النجاح %", key: "معدل النجاح %" },
            ];
        }

        if (format === "excel") {
            exportToExcel(dataToExport, `financial_report_${reportType}`);
        } else {
            exportToPDF(dataToExport, columns, { title });
        }
    };

    return (
        <DashboardLayout
            title="التقارير المالية"
            subtitle="تقارير شاملة عن الإيرادات والمدفوعات"
            actions={
                <div className="flex items-center gap-2">
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">التقرير اليومي</SelectItem>
                            <SelectItem value="partner">تقرير الشركاء</SelectItem>
                            <SelectItem value="payment_methods">طرق الدفع</SelectItem>
                        </SelectContent>
                    </Select>
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
                {loading ? (
                    <div className="text-center py-12">جاري تحميل التقرير...</div>
                ) : (
                    <>
                        {/* Daily Report */}
                        {reportType === "daily" && (
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الحجوزات</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">المدفوعة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الإيرادات</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">العمولة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">المستردة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الصافي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dailyData.map((row, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="px-4 py-3 text-sm">
                                                        {new Date(row.report_date).toLocaleDateString("ar-SA")}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{row.total_bookings}</td>
                                                    <td className="px-4 py-3 text-sm">{row.paid_bookings}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                                                        {row.gross_revenue.toFixed(2)} ر.س
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{row.platform_commission.toFixed(2)} ر.س</td>
                                                    <td className="px-4 py-3 text-sm text-red-600">
                                                        {row.total_refunds.toFixed(2)} ر.س
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-blue-600">
                                                        {row.net_revenue.toFixed(2)} ر.س
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Partner Report */}
                        {reportType === "partner" && (
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الشريك</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الحجوزات</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الإيرادات</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">العمولة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">صافي الشريك</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">إلكتروني</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">نقدي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partnerData.map((row, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="px-4 py-3 text-sm font-medium">{row.company_name}</td>
                                                    <td className="px-4 py-3 text-sm">{row.total_bookings}</td>
                                                    <td className="px-4 py-3 text-sm">{row.gross_revenue.toFixed(2)} ر.س</td>
                                                    <td className="px-4 py-3 text-sm">{row.platform_commission.toFixed(2)} ر.س</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-green-600">
                                                        {row.net_partner_revenue.toFixed(2)} ر.س
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{row.online_payments.toFixed(2)} ر.س</td>
                                                    <td className="px-4 py-3 text-sm">{row.cash_payments.toFixed(2)} ر.س</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Payment Methods Report */}
                        {reportType === "payment_methods" && (
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-4 py-3 text-right text-sm font-medium">طريقة الدفع</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">المعاملات</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الناجحة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">الفاشلة</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">المبلغ الإجمالي</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium">معدل النجاح</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentMethodData.map((row, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="px-4 py-3 text-sm font-medium">{row.payment_method}</td>
                                                    <td className="px-4 py-3 text-sm">{row.transaction_count}</td>
                                                    <td className="px-4 py-3 text-sm text-green-600">{row.successful_count}</td>
                                                    <td className="px-4 py-3 text-sm text-red-600">{row.failed_count}</td>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        {row.total_amount.toFixed(2)} ر.س
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.success_rate_percentage >= 90
                                                                ? "bg-green-100 text-green-800"
                                                                : row.success_rate_percentage >= 70
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {row.success_rate_percentage.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FinancialReports;
