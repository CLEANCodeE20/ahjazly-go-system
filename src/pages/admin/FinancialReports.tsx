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
  ArrowUpRight, ArrowDownRight, Building2, CreditCard
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

interface RevenueStats {
  totalRevenue: number;
  platformCommission: number;
  partnerRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  growthRate: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  commission: number;
  bookings: number;
}

interface PartnerData {
  name: string;
  revenue: number;
  commission: number;
  bookings: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const FinancialReports = () => {
  const [period, setPeriod] = useState('6months');
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    platformCommission: 0,
    partnerRevenue: 0,
    totalBookings: 0,
    avgBookingValue: 0,
    growthRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<{name: string; value: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = subMonths(now, 6);
    }
    
    return { startDate, endDate: now };
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDateRange();

    try {
      // Fetch bookings data
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          total_price,
          platform_commission,
          partner_revenue,
          payment_method,
          booking_date,
          payment_status,
          trips!inner(partner_id, partners!inner(company_name))
        `)
        .gte('booking_date', startDate.toISOString())
        .lte('booking_date', endDate.toISOString())
        .eq('payment_status', 'paid');

      if (bookings) {
        // Calculate main stats
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        const platformCommission = bookings.reduce((sum, b) => sum + (b.platform_commission || 0), 0);
        const partnerRevenue = bookings.reduce((sum, b) => sum + (b.partner_revenue || 0), 0);
        
        // Calculate growth rate (compare with previous period)
        const previousStart = subMonths(startDate, period === '1month' ? 1 : period === '3months' ? 3 : period === '6months' ? 6 : 12);
        const { data: previousBookings } = await supabase
          .from('bookings')
          .select('total_price')
          .gte('booking_date', previousStart.toISOString())
          .lt('booking_date', startDate.toISOString())
          .eq('payment_status', 'paid');
        
        const previousRevenue = previousBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
        const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        setStats({
          totalRevenue,
          platformCommission,
          partnerRevenue,
          totalBookings: bookings.length,
          avgBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
          growthRate
        });

        // Group by month for chart
        const monthlyGrouped: Record<string, MonthlyData> = {};
        bookings.forEach(booking => {
          const monthKey = format(new Date(booking.booking_date || ''), 'yyyy-MM');
          if (!monthlyGrouped[monthKey]) {
            monthlyGrouped[monthKey] = {
              month: format(new Date(booking.booking_date || ''), 'MMM yyyy', { locale: ar }),
              revenue: 0,
              commission: 0,
              bookings: 0
            };
          }
          monthlyGrouped[monthKey].revenue += booking.total_price || 0;
          monthlyGrouped[monthKey].commission += booking.platform_commission || 0;
          monthlyGrouped[monthKey].bookings += 1;
        });
        setMonthlyData(Object.values(monthlyGrouped).sort((a, b) => a.month.localeCompare(b.month)));

        // Group by partner
        const partnerGrouped: Record<string, PartnerData> = {};
        bookings.forEach(booking => {
          const trip = booking.trips as any;
          const partnerName = trip?.partners?.company_name || 'غير معروف';
          if (!partnerGrouped[partnerName]) {
            partnerGrouped[partnerName] = {
              name: partnerName,
              revenue: 0,
              commission: 0,
              bookings: 0
            };
          }
          partnerGrouped[partnerName].revenue += booking.total_price || 0;
          partnerGrouped[partnerName].commission += booking.platform_commission || 0;
          partnerGrouped[partnerName].bookings += 1;
        });
        setPartnerData(Object.values(partnerGrouped).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

        // Group by payment method
        const paymentGrouped: Record<string, number> = {};
        bookings.forEach(booking => {
          const method = booking.payment_method || 'غير محدد';
          const methodLabels: Record<string, string> = {
            'cash': 'نقدي',
            'card': 'بطاقة',
            'wallet': 'محفظة',
            'bank_transfer': 'تحويل بنكي',
            'stc_pay': 'STC Pay'
          };
          const label = methodLabels[method] || method;
          paymentGrouped[label] = (paymentGrouped[label] || 0) + (booking.total_price || 0);
        });
        setPaymentMethodData(Object.entries(paymentGrouped).map(([name, value]) => ({ name, value })));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
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

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: {
    title: string;
    value: string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">التقارير المالية</h1>
            <p className="text-muted-foreground mt-1">تحليل شامل للإيرادات والعمولات</p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">شهر واحد</SelectItem>
                <SelectItem value="3months">3 أشهر</SelectItem>
                <SelectItem value="6months">6 أشهر</SelectItem>
                <SelectItem value="1year">سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 ml-2" />
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الإيرادات"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            trend={stats.growthRate >= 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(stats.growthRate).toFixed(1)}% عن الفترة السابقة`}
            color="bg-primary"
          />
          <StatCard
            title="عمولة المنصة"
            value={formatCurrency(stats.platformCommission)}
            icon={TrendingUp}
            color="bg-green-600"
          />
          <StatCard
            title="إيرادات الشركاء"
            value={formatCurrency(stats.partnerRevenue)}
            icon={Building2}
            color="bg-blue-600"
          />
          <StatCard
            title="عدد الحجوزات"
            value={stats.totalBookings.toLocaleString('ar-SA')}
            icon={CreditCard}
            color="bg-purple-600"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>تطور الإيرادات</CardTitle>
              <CardDescription>الإيرادات الشهرية خلال الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Commission vs Partner Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>العمولات vs إيرادات الشركاء</CardTitle>
              <CardDescription>مقارنة شهرية بين عمولة المنصة وإيرادات الشركاء</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value), 
                      name === 'commission' ? 'عمولة المنصة' : 'إيرادات الشركاء'
                    ]}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend formatter={(value) => value === 'commission' ? 'عمولة المنصة' : 'الإيرادات'} />
                  <Bar dataKey="commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Partners */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>أفضل الشركاء أداءً</CardTitle>
              <CardDescription>الشركاء الأكثر إيرادات خلال الفترة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={partnerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {partnerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>طرق الدفع</CardTitle>
              <CardDescription>توزيع الإيرادات حسب طريقة الدفع</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'المبلغ']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص أداء الشركاء</CardTitle>
            <CardDescription>تفاصيل الإيرادات والعمولات لكل شريك</CardDescription>
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
                  {partnerData.map((partner, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{partner.name}</td>
                      <td className="py-3 px-4">{partner.bookings}</td>
                      <td className="py-3 px-4">{formatCurrency(partner.revenue)}</td>
                      <td className="py-3 px-4 text-primary">{formatCurrency(partner.commission)}</td>
                      <td className="py-3 px-4 text-green-600">{formatCurrency(partner.revenue - partner.commission)}</td>
                      <td className="py-3 px-4">{formatCurrency(partner.bookings > 0 ? partner.revenue / partner.bookings : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialReports;
