import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Calendar, Download,
  ArrowUpRight, ArrowDownRight, Building2, CreditCard, Loader2
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import AdminSidebar from "@/components/layout/AdminSidebar";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const FinancialReports = () => {
  const [period, setPeriod] = useState('30days');
  const [stats, setStats] = useState<any>(null);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [topPartners, setTopPartners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const getStartDate = () => {
    const now = new Date();
    switch (period) {
      case '7days': return subDays(now, 7);
      case '30days': return subDays(now, 30);
      case '90days': return subDays(now, 90);
      case 'year': return subDays(now, 365);
      default: return subDays(now, 30);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const startDate = getStartDate();
    const endDate = new Date();

    try {
      // 1. Fetch High-level Stats (RPC)
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_dashboard_stats', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (summaryError) throw summaryError;
      setStats(summaryData);

      // 2. Fetch Daily Revenue Trend (View)
      const { data: trendData, error: trendError } = await supabase
        .from('analytics_daily_revenue')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (trendError) throw trendError;

      // Format dates for chart
      const formattedTrend = trendData?.map(d => ({
        ...d,
        formattedDate: format(new Date(d.date), 'dd MMM', { locale: ar })
      })) || [];
      setDailyRevenue(formattedTrend);

      // 3. Fetch Top Partners (View)
      const { data: partnersData, error: partnersError } = await supabase
        .from('analytics_partner_performance')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(5);

      if (partnersError) throw partnersError;
      setTopPartners(partnersData || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-muted/30" dir="rtl">
      <AdminSidebar />
      <div className="lg:mr-64 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">التقارير المالية</h1>
              <p className="text-muted-foreground mt-1">تحليل شامل للإيرادات والعمولات (محدث مباشر)</p>
            </div>
            <div className="flex gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">آخر 7 أيام</SelectItem>
                  <SelectItem value="30days">آخر 30 يوم</SelectItem>
                  <SelectItem value="90days">آخر 3 أشهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="إجمالي الإيرادات"
                  value={formatCurrency(stats?.total_revenue || 0)}
                  icon={DollarSign}
                  color="bg-primary"
                  subtext="إجمالي قيمة الحجوزات المدفوعة"
                />
                <StatCard
                  title="عمولة المنصة"
                  value={formatCurrency(stats?.platform_revenue || 0)}
                  icon={TrendingUp}
                  color="bg-green-600"
                  subtext="صافي ربح النظام"
                />
                <StatCard
                  title="متوسط قيمة الحجز"
                  value={formatCurrency(stats?.avg_booking_value || 0)}
                  icon={CreditCard}
                  color="bg-purple-600"
                />
                <StatCard
                  title="عدد الحجوزات"
                  value={(stats?.total_bookings || 0).toLocaleString()}
                  icon={Users}
                  color="bg-blue-600"
                />
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>تطور الإيرادات</CardTitle>
                    <CardDescription>الإيرادات اليومية خلال الفترة المحددة</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailyRevenue}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="formattedDate" className="text-xs" />
                        <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total_revenue"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Partners */}
                <Card>
                  <CardHeader>
                    <CardTitle>أفضل الشركاء أداءً</CardTitle>
                    <CardDescription>الشركاء الأكثر تحقيقاً للإيرادات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topPartners} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="company_name" type="category" className="text-xs" width={100} />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="total_revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                          {topPartners.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل أداء الشركاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right py-3 px-4 font-medium">الشريك</th>
                          <th className="text-right py-3 px-4 font-medium">الحجوزات</th>
                          <th className="text-right py-3 px-4 font-medium">إجمالي الإيرادات</th>
                          <th className="text-right py-3 px-4 font-medium">عمولة المنصة</th>
                          <th className="text-right py-3 px-4 font-medium">صافي الشريك</th>
                          <th className="text-right py-3 px-4 font-medium">متوسط الحجز</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPartners.map((partner, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{partner.company_name}</td>
                            <td className="py-3 px-4">{partner.total_bookings}</td>
                            <td className="py-3 px-4">{formatCurrency(partner.total_revenue)}</td>
                            <td className="py-3 px-4 text-primary">{formatCurrency(partner.total_commission)}</td>
                            <td className="py-3 px-4 text-green-600">{formatCurrency(partner.net_revenue)}</td>
                            <td className="py-3 px-4">{formatCurrency(partner.avg_booking_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
