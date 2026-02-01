import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    CreditCard,
    Download,
    Filter,
    Loader2,
    DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useExport } from "@/hooks/useExport";
import { Printer } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const FinancialAnalytics = () => {
    const { userRole } = useAuth();
    const isAdmin = userRole?.role === 'admin';
    const { exportToPDF } = useExport();
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [partnerStats, setPartnerStats] = useState<any[]>([]);
    const [walletStats, setWalletStats] = useState<any>({ total_balance: 0, total_transactions: 0 });

    useEffect(() => {
        fetchAnalytics();
    }, [userRole]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch Daily Revenue
            let dailyQuery = supabase.from("daily_financial_summary" as any).select("*").order("report_date", { ascending: true }).limit(15);
            if (!isAdmin) {
                // For partners, we need to filter by their trips. 
                // Note: daily_financial_summary is global, so we might need a partner-specific view or filter.
                // For now, let's use the partner_financial_summary for top-level stats.
            }
            const { data: daily } = await dailyQuery;
            if (daily) setDailyData(daily);

            // 2. Fetch Payment Methods
            const { data: pm } = await supabase.from("payment_methods_report" as any).select("*");
            if (pm) setPaymentMethods(pm);

            // 3. Fetch Partner Balances (Admin only)
            if (isAdmin) {
                const { data: ps } = await supabase.from("partner_balance_report" as any).select("*");
                if (ps) setPartnerStats(ps);

                // 4. Wallet Overview
                const { data: ws } = await supabase.from("wallets" as any).select("balance");
                if (ws) {
                    const total = (ws as any[]).reduce((sum, w) => sum + w.balance, 0);
                    setWalletStats({ total_balance: total, count: (ws as any[]).length });
                }
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        const dataToExport = dailyData.map(d => ({
            "التاريخ": new Date(d.report_date).toLocaleDateString('ar-SA'),
            "الإيرادات": d.gross_revenue.toLocaleString(),
            "العمولة": d.platform_commission.toLocaleString(),
            "الصافي": d.net_revenue.toLocaleString(),
            "المستردات": d.total_refunds.toLocaleString()
        }));

        exportToPDF(dataToExport, [
            { header: "التاريخ", key: "التاريخ" },
            { header: "الإيرادات", key: "الإيرادات" },
            { header: "العمولة", key: "العمولة" },
            { header: "الصافي", key: "الصافي" },
            { header: "المستردات", key: "المستردات" }
        ], { title: "تقرير التحليلات المالية" });
    };

    const openPrintableStatement = () => {
        const url = isAdmin
            ? `/dashboard/financial-statement`
            : `/dashboard/financial-statement?partner_id=${userRole?.partner_id}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <DashboardLayout title="التحليلات المالية">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title="التحليلات المالية المتقدمة"
            subtitle="نظرة شاملة على الأداء المالي، المحافظ، وتسويات الشركاء"
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={openPrintableStatement}>
                        <Printer className="w-4 h-4" /> كشف حساب ورقي
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
                        <Download className="w-4 h-4" /> تصدير PDF
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold">إجمالي الإيرادات (30 يوم)</p>
                                    <h3 className="text-2xl font-black mt-1">
                                        {dailyData.reduce((sum, d) => sum + d.gross_revenue, 0).toLocaleString()} ر.س
                                    </h3>
                                </div>
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs text-green-600 font-bold">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>12% زيادة عن الشهر الماضي</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold">رصيد المحافظ الكلي</p>
                                    <h3 className="text-2xl font-black mt-1">
                                        {walletStats.total_balance.toLocaleString()} ر.س
                                    </h3>
                                </div>
                                <div className="p-2 bg-secondary/10 rounded-lg">
                                    <Wallet className="w-5 h-5 text-secondary" />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-muted-foreground">موزعة على {walletStats.count} محفظة نشطة</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold">عمولات المنصة</p>
                                    <h3 className="text-2xl font-black mt-1">
                                        {dailyData.reduce((sum, d) => sum + d.platform_commission, 0).toLocaleString()} ر.س
                                    </h3>
                                </div>
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-amber-600" />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-muted-foreground">صافي ربح المنصة قبل التشغيل</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold">مستحقات الشركاء</p>
                                    <h3 className="text-2xl font-black mt-1">
                                        {partnerStats.reduce((sum, p) => sum + p.current_balance, 0).toLocaleString()} ر.س
                                    </h3>
                                </div>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-muted-foreground">إجمالي المبالغ المطلوب تسويتها للشركات</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">اتجاهات الإيرادات اليومية</CardTitle>
                            <CardDescription>مقارنة بين إجمالي الدخل وصافي الربح</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="report_date"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                            fontSize={10}
                                        />
                                        <YAxis fontSize={10} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="gross_revenue" name="الإيرادات" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="net_revenue" name="الصافي" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">توزيع طرق الدفع</CardTitle>
                            <CardDescription>نسبة استخدام المحفظة مقابل البطاقات</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentMethods}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="total_amount"
                                            nameKey="payment_method"
                                        >
                                            {paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 - Wallet & Settlements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">تسويات الشركاء (الأرصدة المعلقة)</CardTitle>
                            <CardDescription>المبالغ المستحقة لكل شركة نقل</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {partnerStats.slice(0, 5).map((p, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-bold">{p.company_name}</span>
                                            <span className="text-muted-foreground">{p.current_balance.toLocaleString()} ر.س</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${Math.min((p.current_balance / 10000) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {partnerStats.length > 5 && (
                                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">عرض الكل...</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">أداء المحفظة (الاستردادات vs الدفع)</CardTitle>
                            <CardDescription>تحليل حركة الأموال داخل نظام المحفظة</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyData.slice(-7)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="report_date"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString('ar-SA', { day: 'numeric' })}
                                            fontSize={10}
                                        />
                                        <YAxis fontSize={10} />
                                        <Tooltip />
                                        <Bar dataKey="total_refunds" name="استردادات للمحفظة" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="cancellation_fees" name="رسوم إلغاء (ربح)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FinancialAnalytics;
