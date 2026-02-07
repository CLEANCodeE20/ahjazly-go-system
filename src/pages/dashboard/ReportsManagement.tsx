import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Bus,
  Route,
  Building2,
  BarChart3,
  Ticket,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Loader2,
  FileSpreadsheet,
  FileText,
  ClipboardList
} from "lucide-react";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { useExport } from "@/hooks/useExport";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface BookingRecord {
  booking_id: number;
  trip_id: number | null;
  total_price: number;
  booking_status: string | null;
  booking_date: string | null;
}

interface TripRecord {
  trip_id: number;
  route_id: number | null;
  base_price: number;
  status: string | null;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
}

interface BranchRecord {
  branch_id: number;
  branch_name: string;
  city: string | null;
}

const ReportsManagement = () => {
  const [period, setPeriod] = useState("month");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const { exportToExcel, exportToPDF } = useExport();

  const { data: bookings, loading: bookingsLoading } = useSupabaseCRUD<BookingRecord>({
    tableName: 'bookings',
    primaryKey: 'booking_id',
    initialFetch: true
  });

  const { data: trips, loading: tripsLoading } = useSupabaseCRUD<TripRecord>({
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });

  const { data: routes } = useSupabaseCRUD<RouteRecord>({
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const { data: branches } = useSupabaseCRUD<BranchRecord>({
    tableName: 'branches',
    primaryKey: 'branch_id',
    initialFetch: true
  });

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    let startDate;
    const now = new Date();
    switch (period) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case 'quarter': startDate = subDays(now, 90); break;
      case 'year': startDate = subDays(now, 365); break;
      default: startDate = subDays(now, 30);
    }

    try {
      const { data, error } = await (supabase.rpc as any)('get_partner_analytics', {
        start_date: startDate.toISOString(),
        end_date: now.toISOString()
      });
      if (error) throw error;
      setAnalyticsData(data);
    } catch (e) {
      console.error("Error fetching partner analytics:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useMemo(() => {
    fetchAnalytics();
  }, [period]);

  const loading = bookingsLoading || tripsLoading || analyticsLoading;

  const stats = useMemo(() => {
    if (!analyticsData) return [];

    return [
      { label: "إجمالي الإيرادات", value: (analyticsData.total_revenue || 0).toLocaleString(), change: "+18%", isPositive: true, icon: DollarSign },
      { label: "عدد الرحلات", value: (analyticsData.total_trips || 0).toString(), change: "+12%", isPositive: true, icon: Route },
      { label: "عدد الحجوزات", value: (analyticsData.total_bookings || 0).toString(), change: "+24%", isPositive: true, icon: Ticket },
      { label: "معدل الإشغال", value: `${analyticsData.occupancy_rate || 0}%`, change: "+5%", isPositive: true, icon: PieChart }
    ];
  }, [analyticsData]);

  const topRoutes = useMemo(() => {
    const routeStats: { [key: number]: { trips: number; revenue: number } } = {};

    trips.forEach(trip => {
      if (trip.route_id) {
        if (!routeStats[trip.route_id]) {
          routeStats[trip.route_id] = { trips: 0, revenue: 0 };
        }
        routeStats[trip.route_id].trips += 1;

        const tripBookings = bookings.filter(b => b.trip_id === trip.trip_id);
        routeStats[trip.route_id].revenue += tripBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      }
    });

    const totalRevenue = Object.values(routeStats).reduce((sum, r) => sum + r.revenue, 0);

    return Object.entries(routeStats)
      .map(([routeId, stats]) => {
        const route = routes.find(r => r.route_id === parseInt(routeId));
        return {
          route: route ? `${route.origin_city} - ${route.destination_city}` : "غير محدد",
          trips: stats.trips,
          revenue: stats.revenue,
          percentage: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [trips, bookings, routes]);

  const monthlyRevenue = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentMonth = new Date().getMonth();

    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthBookings = bookings.filter(b => {
        if (!b.booking_date) return false;
        const bookingMonth = new Date(b.booking_date).getMonth();
        return bookingMonth === monthIndex;
      });

      return {
        month: months[monthIndex],
        revenue: monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        trips: trips.filter(t => {
          const tripBookings = bookings.filter(b => b.trip_id === t.trip_id);
          return tripBookings.some(b => {
            if (!b.booking_date) return false;
            return new Date(b.booking_date).getMonth() === monthIndex;
          });
        }).length,
        bookings: monthBookings.length
      };
    });
  }, [bookings, trips]);

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  const cityPerformance = useMemo(() => {
    // Group metrics by Origin City (serving as Branch proxy)
    const cityStats: { [key: string]: { revenue: number; bookings: number } } = {};

    bookings.forEach(booking => {
      if (booking.booking_status === 'cancelled') return;

      const trip = trips.find(t => t.trip_id === booking.trip_id);
      if (trip) {
        const route = routes.find(r => r.route_id === trip.route_id);
        if (route) {
          const city = route.origin_city || "غير محدد";
          if (!cityStats[city]) cityStats[city] = { revenue: 0, bookings: 0 };

          cityStats[city].bookings += 1;
          cityStats[city].revenue += (booking.total_price || 0);
        }
      }
    });

    return Object.entries(cityStats).map(([city, stats]) => ({
      city,
      revenue: stats.revenue,
      bookings: stats.bookings,
      // Growth/Performance requires historical comparison, for now we show current
      avgBookingValue: stats.bookings > 0 ? Math.round(stats.revenue / stats.bookings) : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [bookings, trips, routes]);

  const handleExportExcel = () => {
    const dataToExport = cityPerformance.map(c => ({
      "المدينة/الفرع": c.city,
      "الإيرادات (ر.س)": c.revenue,
      "الحجوزات": c.bookings,
      "متوسط الحجز": c.avgBookingValue
    }));
    exportToExcel(dataToExport, "location_performance_report");
  };

  const handleExportPDF = () => {
    const dataToExport = cityPerformance.map(c => ({
      "المدينة": c.city,
      "الإيرادات": c.revenue.toLocaleString(),
      "الحجوزات": c.bookings,
      "متوسط الحجز": c.avgBookingValue.toLocaleString()
    }));

    const summaryData = analyticsData ? [
      { label: "إجمالي الإيرادات", value: `${(analyticsData.total_revenue || 0).toLocaleString()} ر.س` },
      { label: "عدد الرحلات", value: (analyticsData.total_trips || 0).toString() },
      { label: "عدد الحجوزات", value: (analyticsData.total_bookings || 0).toString() },
      { label: "معدل الإشغال", value: `${analyticsData.occupancy_rate || 0}%` }
    ] : [];

    exportToPDF(dataToExport, [
      { header: "المدينة", key: "المدينة" },
      { header: "الإيرادات", key: "الإيرادات" },
      { header: "الحجوزات", key: "الحجوزات" },
      { header: "متوسط الحجز", key: "متوسط الحجز" }
    ], {
      title: "تقرير أداء المدن والفروع",
      filename: "city_performance_report",
      summaryData
    });
  };

  return (
    <DashboardLayout
      title="التقارير والإحصائيات"
      subtitle="نظرة شاملة على أداء الشركة"
      actions={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/advanced-reports'}>
            <ClipboardList className="w-4 h-4 ml-2" />
            التقارير التفصيلية
          </Button>
          <UISelect value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">آخر أسبوع</SelectItem>
              <SelectItem value="month">آخر شهر</SelectItem>
              <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </UISelect>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileText className="w-4 h-4 ml-2 text-red-600" />
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium ${stat.isPositive ? "text-secondary" : "text-destructive"}`}>
                      {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">الإيرادات الشهرية</h2>
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {monthlyRevenue.map((month, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-16 text-sm text-muted-foreground">{month.month}</span>
                      <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-lg transition-all duration-500"
                          style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 text-sm font-medium text-foreground text-left">
                        {month.revenue.toLocaleString()} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Routes */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">أفضل المسارات</h2>
                  <Route className="w-5 h-5 text-muted-foreground" />
                </div>
                {topRoutes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                ) : (
                  <div className="space-y-4">
                    {topRoutes.map((route, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">{route.route}</span>
                            <span className="text-sm text-muted-foreground">{route.percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: `${route.percentage}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{route.trips} رحلة</span>
                            <span>{route.revenue.toLocaleString()} ر.س</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* City/Branch Performance */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground">أداء المدن (الفروع)</h2>
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              {cityPerformance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المدينة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإيرادات</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحجوزات</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">متوسط الحجز</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">مؤشر الأداء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cityPerformance.map((city, index) => (
                        <tr key={index} className="border-b border-border last:border-0">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <span className="font-medium text-foreground">{city.city}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-foreground">{city.revenue.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4 text-muted-foreground">{city.bookings}</td>
                          <td className="py-4 px-4 text-sm">{city.avgBookingValue.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `${Math.min((city.revenue / (cityPerformance[0]?.revenue || 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsManagement;
