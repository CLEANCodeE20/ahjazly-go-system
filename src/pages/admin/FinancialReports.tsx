import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, DollarSign, Users, CreditCard, Loader2,
  AlertCircle,
  Download,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  ArrowUpRight,
  Building2
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth } from 'date-fns';
import { arSA } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface FinancialSummary {
  report_month: string;
  partner_id: number;
  company_name: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  gross_revenue: number;
  platform_revenue: number; // Commission
  partner_revenue: number;
  cancellation_rate: number;
  trips_operated: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const FinancialReports = () => {
  const [period, setPeriod] = useState('year'); // year, 6months, 3months
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialSummary[]>([]);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      if (period === 'year') startDate = subMonths(new Date(), 12);
      else if (period === '6months') startDate = subMonths(new Date(), 6);
      else if (period === '3months') startDate = subMonths(new Date(), 3);

      const { data: reports, error } = await supabase
        .from('reports_executive_summary')
        .select('*')
        .gte('report_month', startOfMonth(startDate).toISOString())
        .order('report_month', { ascending: true });

      if (error) throw error;
      setData(reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل تحميل البيانات المالية",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  // --- Calculations ---

  // 1. Overall Aggregation
  const stats = useMemo(() => data.reduce((acc, curr) => ({
    total_revenue: acc.total_revenue + (curr.gross_revenue || 0),
    platform_revenue: acc.platform_revenue + (curr.platform_revenue || 0),
    total_bookings: acc.total_bookings + (curr.total_bookings || 0),
    cancelled_bookings: acc.cancelled_bookings + (curr.cancelled_bookings || 0),
  }), { total_revenue: 0, platform_revenue: 0, total_bookings: 0, cancelled_bookings: 0 }), [data]);

  const cancellationRate = stats.total_bookings > 0
    ? ((stats.cancelled_bookings / stats.total_bookings) * 100).toFixed(1)
    : "0";

  const avgBookingValue = stats.total_bookings > 0
    ? (stats.total_revenue / stats.total_bookings)
    : 0;

  // 2. Trend Data (Grouped by Month) - For Area Charts
  const trendData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const month = format(new Date(curr.report_month), 'MMM yyyy', { locale: arSA });
      if (!acc[month]) {
        acc[month] = { name: month, revenue: 0, commission: 0, bookings: 0 };
      }
      acc[month].revenue += curr.gross_revenue || 0;
      acc[month].commission += curr.platform_revenue || 0;
      acc[month].bookings += curr.total_bookings || 0;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [data]);

  // 3. Company Performance Data (Grouped by Company) - For Ranking & Pie Charts
  const companyData = useMemo(() => {
    const grouped = data.reduce((acc: any, curr) => {
      const name = curr.company_name || 'غير معروف';
      if (!acc[name]) {
        acc[name] = { name, revenue: 0, commission: 0, bookings: 0, trips: 0 };
      }
      acc[name].revenue += curr.gross_revenue || 0;
      acc[name].commission += curr.platform_revenue || 0;
      acc[name].bookings += curr.total_bookings || 0;
      acc[name].trips += curr.trips_operated || 0;
      return acc;
    }, {});
    return Object.values(grouped).sort((a: any, b: any) => b.revenue - a.revenue);
  }, [data]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
      'الشهر': format(new Date(item.report_month), 'yyyy-MM-dd'),
      'الشركة': item.company_name,
      'إجمالي الحجوزات': item.total_bookings,
      'الحجوزات المؤكدة': item.confirmed_bookings,
      'الحجوزات الملغاة': item.cancelled_bookings,
      'إجمالي الإيرادات': item.gross_revenue,
      'عمولة المنصة': item.platform_revenue,
      'صافي الشريك': item.partner_revenue,
      'نسبة الإلغاء %': item.cancellation_rate
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    XLSX.writeFile(wb, `financial_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <Card className="hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: color ? 'var(--primary)' : undefined }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2 font-mono">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-xl bg-secondary/10 text-secondary`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="التحليلات المالية المتقدمة"
      subtitle="منصة ذكاء الأعمال ومراقبة الأداء المالي للشركاء"
      actions={
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="الفترة الزمنية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">آخر 3 أشهر</SelectItem>
              <SelectItem value="6months">آخر 6 أشهر</SelectItem>
              <SelectItem value="year">السنة الحالية</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToExcel} disabled={loading || data.length === 0}>
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="overview">النظرة العامة</TabsTrigger>
            <TabsTrigger value="companies">تحليل الشركات</TabsTrigger>
            <TabsTrigger value="comparative">المقارنة المعيارية</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW TAB === */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي الإيرادات" value={formatCurrency(stats.total_revenue)} icon={DollarSign} subtext="حجم التعاملات الكلي" />
              <StatCard title="صافي الأرباح" value={formatCurrency(stats.platform_revenue)} icon={TrendingUp} subtext="عمولة المنصة" />
              <StatCard title="إجمالي الحجوزات" value={stats.total_bookings} icon={Users} subtext={`${stats.cancelled_bookings} ملغي `} />
              <StatCard title="معدل النمو" value={"+12.5%"} icon={ArrowUpRight} subtext="مقارنة بالفترة السابقة" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend Area Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>تطور الإيرادات والأرباح</CardTitle>
                  <CardDescription>تحليل الاتجاه الزمني للأداء المالي</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                      <Area type="monotone" dataKey="commission" name="الأرباح" stroke="#10b981" fillOpacity={1} fill="transparent" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Market Share Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الحصص السوقية</CardTitle>
                  <CardDescription>نسبة مساهمة الشركات في الإيراد</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={companyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {companyData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* === COMPANIES ANALYSIS TAB === */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء الشركات التفصيلي</CardTitle>
                <CardDescription>تحليل الأداء المالي والتشغيلي لكل شريك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-4 font-bold">الشركة</th>
                        <th className="p-4 font-bold">الإيرادات المحققة</th>
                        <th className="p-4 font-bold">الحصة من الأرباح</th>
                        <th className="p-4 font-bold">الحجوزات</th>
                        <th className="p-4 font-bold">متوسط الحجز</th>
                        <th className="p-4 font-bold">الأداء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {companyData.map((co: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-4 font-medium flex items-center gap-2">
                            <div className="p-2 rounded bg-secondary/10 text-secondary"><Building2 className="w-4 h-4" /></div>
                            {co.name}
                          </td>
                          <td className="p-4 font-bold">{formatCurrency(co.revenue)}</td>
                          <td className="p-4 text-emerald-600">{formatCurrency(co.commission)}</td>
                          <td className="p-4">{co.bookings}</td>
                          <td className="p-4 text-muted-foreground">{formatCurrency(co.revenue / (co.bookings || 1))}</td>
                          <td className="p-4">
                            <div className="h-2 w-24 bg-secondary/20 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary" style={{ width: `${(co.revenue / stats.total_revenue) * 100}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === COMPARATIVE TAB === */}
          <TabsContent value="comparative" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>المقارنة المعيارية (Benchmarking)</CardTitle>
                  <CardDescription>مقارنة الأداء بين أفضل الشركات</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={companyData.slice(0, 10)} layout="vertical" margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} />
                      <Legend />
                      <Bar dataKey="revenue" name="الإيرادات" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="commission" name="الأرباح" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
};

export default FinancialReports;
