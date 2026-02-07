import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Bus,
  Home,
  Route,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Plus,
  MapPin,
  TrendingUp,
  TrendingDown,
  Ticket,
  Loader2,
  Calendar,
  Shield,
  Star,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { usePartner } from "@/hooks/usePartner";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface TripRecord {
  trip_id: number;
  route_id: number | null;
  bus_id: number | null;
  departure_time: string;
  arrival_time: string | null;
  base_price: number;
  status: string | null;
}

interface BookingRecord {
  booking_id: number;
  trip_id: number | null;
  total_price: number;
  booking_status: string | null;
  booking_date: string | null;
}

interface BusRecord {
  bus_id: number;
  license_plate: string;
  status: string | null;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
}

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
};

const CompanyDashboard = () => {
  const { partner, partnerId, isLoading: partnerLoading } = usePartner();
  const { can } = usePermissions();
  const [ratingsStats, setRatingsStats] = useState({ average: 0, total: 0, pending: 0 });

  const { data: trips, loading: tripsLoading } = useSupabaseCRUD<TripRecord>({
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });

  const { data: bookings, loading: bookingsLoading } = useSupabaseCRUD<BookingRecord>({
    tableName: 'bookings',
    primaryKey: 'booking_id',
    initialFetch: true
  });

  const { data: buses } = useSupabaseCRUD<BusRecord>({
    tableName: 'buses',
    primaryKey: 'bus_id',
    initialFetch: true
  });

  const { data: routes } = useSupabaseCRUD<RouteRecord>({
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const loading = tripsLoading || bookingsLoading || partnerLoading;

  useEffect(() => {
    const fetchRatingsStats = async () => {
      if (!partnerId) return;
      try {
        const { data: statsData, error: statsError } = await supabase.rpc('get_partner_rating_stats', {
          p_partner_id: partnerId
        });

        const { count: pendingCount, error: pendingError } = await supabase
          .from('v_ratings_requiring_attention')
          .select('*', { count: 'exact', head: true });

        if (!statsError && statsData && statsData.length > 0) {
          setRatingsStats({
            average: statsData[0].average_rating || 0,
            total: statsData[0].total_ratings || 0,
            pending: pendingCount || 0
          });
        }
      } catch (err) {
        console.error('Error fetching ratings stats:', err);
      }
    };

    fetchRatingsStats();
  }, [partnerId]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const todayTrips = trips.filter(t => t.departure_time?.startsWith(today)).length;
    const yesterdayTrips = trips.filter(t => t.departure_time?.startsWith(yesterday)).length;
    const tripChange = yesterdayTrips > 0 ? Math.round(((todayTrips - yesterdayTrips) / yesterdayTrips) * 100) : todayTrips > 0 ? 100 : 0;

    const newBookings = bookings.filter(b => b.booking_status === 'pending').length;
    const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed').length;

    const todayRevenue = bookings
      .filter(b => b.booking_date?.startsWith(today) && (b.booking_status === 'confirmed' || b.booking_status === 'completed'))
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    const yesterdayRevenue = bookings
      .filter(b => b.booking_date?.startsWith(yesterday) && (b.booking_status === 'confirmed' || b.booking_status === 'completed'))
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    const revenueChange = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : todayRevenue > 0 ? 100 : 0;

    const activeBuses = buses.filter(b => b.status === 'active').length;
    const totalBuses = buses.length;

    return [
      { label: "الرحلات اليوم", value: todayTrips, icon: Route, change: `${tripChange >= 0 ? '+' : ''}${tripChange}%`, trend: tripChange >= 0 ? "up" : "down" },
      { label: "الحجوزات الجديدة", value: newBookings, icon: Ticket, change: `${confirmedBookings} مؤكدة`, trend: "up" },
      { label: "الإيرادات اليوم (ريال)", value: todayRevenue.toLocaleString(), icon: CreditCard, change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`, trend: revenueChange >= 0 ? "up" : "down" },
      { label: "متوسط التقييم", value: ratingsStats.average.toFixed(1), icon: Star, change: ratingsStats.pending > 0 ? `${ratingsStats.pending} بانتظار الرد` : "لا يوجد معلق", trend: ratingsStats.pending > 0 ? "down" : "up" }
    ];
  }, [trips, bookings, buses]);

  // Weekly revenue data
  const weeklyRevenueData = useMemo(() => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      const dayRevenue = bookings
        .filter(b => b.booking_date?.startsWith(dateStr) && (b.booking_status === 'confirmed' || b.booking_status === 'completed'))
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      const dayBookings = bookings.filter(b => b.booking_date?.startsWith(dateStr)).length;

      data.push({
        day: dayName,
        revenue: dayRevenue,
        bookings: dayBookings
      });
    }

    return data;
  }, [bookings]);

  // Monthly trips data
  const monthlyTripsData = useMemo(() => {
    const data = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTrips = trips.filter(t => t.departure_time?.startsWith(dateStr)).length;
      const completedTrips = trips.filter(t => t.departure_time?.startsWith(dateStr) && t.status === 'completed').length;

      data.push({
        date: date.getDate().toString(),
        trips: dayTrips,
        completed: completedTrips
      });
    }

    return data;
  }, [trips]);

  // Booking status distribution
  const bookingStatusData = useMemo(() => {
    const statusCounts = {
      pending: bookings.filter(b => b.booking_status === 'pending').length,
      confirmed: bookings.filter(b => b.booking_status === 'confirmed').length,
      completed: bookings.filter(b => b.booking_status === 'completed').length,
      cancelled: bookings.filter(b => b.booking_status === 'cancelled').length,
    };

    return [
      { name: 'قيد الانتظار', value: statusCounts.pending, color: 'hsl(var(--primary))' },
      { name: 'مؤكدة', value: statusCounts.confirmed, color: 'hsl(var(--secondary))' },
      { name: 'مكتملة', value: statusCounts.completed, color: 'hsl(var(--muted-foreground))' },
      { name: 'ملغاة', value: statusCounts.cancelled, color: 'hsl(var(--destructive))' },
    ].filter(item => item.value > 0);
  }, [bookings]);

  // Total revenue
  const totalRevenue = useMemo(() => {
    return bookings
      .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
  }, [bookings]);

  // Recent trips (last 5)
  const recentTrips = useMemo(() => {
    return trips
      .sort((a, b) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime())
      .slice(0, 5)
      .map(trip => {
        const route = routes.find(r => r.route_id === trip.route_id);
        const bus = buses.find(b => b.bus_id === trip.bus_id);
        const tripBookings = bookings.filter(b => b.trip_id === trip.trip_id).length;

        return {
          id: trip.trip_id,
          route: route ? `${route.origin_city} - ${route.destination_city}` : "غير محدد",
          date: trip.departure_time ? new Date(trip.departure_time).toLocaleDateString('ar-SA') : "-",
          time: trip.departure_time ? new Date(trip.departure_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : "-",
          bus: bus?.license_plate || "-",
          bookings: tripBookings,
          status: trip.status || 'scheduled'
        };
      });
  }, [trips, routes, buses, bookings]);

  const chartConfig = {
    revenue: { label: "الإيرادات", color: CHART_COLORS.primary },
    bookings: { label: "الحجوزات", color: CHART_COLORS.secondary },
    trips: { label: "الرحلات", color: CHART_COLORS.primary },
    completed: { label: "مكتملة", color: CHART_COLORS.secondary },
  };

  const hasBankDetails = partner?.bank_name && partner?.iban && partner?.account_number;

  return (
    <DashboardLayout
      subtitle="إليك نظرة عامة على نشاطك اليوم"
      actions={
        <div className="flex items-center gap-2">
          {!hasBankDetails && (
            <Button variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 hidden md:flex" asChild>
              <Link to="/partner/bank-details">
                <AlertCircle className="w-4 h-4 ml-2" />
                إكمال البيانات البنكية
              </Link>
            </Button>
          )}
          {can('trips.manage') && (
            <Button variant="default" size="sm" asChild>
              <Link to="/dashboard/trips">
                <Plus className="w-4 h-4 ml-2" />
                رحلة جديدة
              </Link>
            </Button>
          )}
        </div>
      }
    >
      {!hasBankDetails && !loading && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">البيانات البنكية ناقصة!</p>
              <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">يجب إكمال بيانات الحساب البنكي لتتمكن من استلام المستحقات المالية من المنصة.</p>
            </div>
          </div>
          <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0" asChild>
            <Link to="/partner/bank-details">إدراج البيانات الآن</Link>
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${stat.trend === "up" ? "text-secondary" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"
                    }`}>
                    {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                    {stat.trend === "down" && <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">إيرادات الأسبوع</h3>
                  <p className="text-sm text-muted-foreground">إجمالي: {totalRevenue.toLocaleString()} ريال</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  آخر 7 أيام
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={weeklyRevenueData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="الإيرادات" />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Monthly Trips Chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">الرحلات الشهرية</h3>
                  <p className="text-sm text-muted-foreground">إجمالي الرحلات: {trips.length}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  آخر 30 يوم
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={monthlyTripsData}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="trips" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.2} name="الرحلات" />
                  <Area type="monotone" dataKey="completed" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary} fillOpacity={0.2} name="مكتملة" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* Bookings by Day Chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">الحجوزات اليومية</h3>
                  <p className="text-sm text-muted-foreground">إجمالي الحجوزات: {bookings.length}</p>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart data={weeklyRevenueData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="bookings" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={{ fill: CHART_COLORS.secondary, r: 4 }} name="الحجوزات" />
                </LineChart>
              </ChartContainer>
            </div>

            {/* Booking Status Distribution */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">توزيع حالة الحجوزات</h3>
                  <p className="text-sm text-muted-foreground">جميع الحجوزات</p>
                </div>
              </div>
              {bookingStatusData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex-1 space-y-3">
                    {bookingStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {can('trips.manage') && (
              <Link to="/dashboard/trips" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Route className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="font-medium text-foreground">إضافة رحلة</p>
              </Link>
            )}
            {can('fleet.manage') && (
              <Link to="/dashboard/fleet" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bus className="w-6 h-6 text-secondary-foreground" />
                </div>
                <p className="font-medium text-foreground">إضافة حافلة</p>
              </Link>
            )}
            {can('employees.manage') && (
              <Link to="/dashboard/employees" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <p className="font-medium text-foreground">إضافة موظف</p>
              </Link>
            )}
            {can('bookings.view') && (
              <Link to="/dashboard/bookings" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Ticket className="w-6 h-6 text-foreground" />
                </div>
                <p className="font-medium text-foreground">عرض الحجوزات</p>
              </Link>
            )}
          </div>

          {/* Recent Trips */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">آخر الرحلات</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/trips">عرض الكل</Link>
              </Button>
            </div>
            {recentTrips.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا توجد رحلات
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المسار</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الوقت</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحافلة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحجوزات</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map((trip) => (
                      <tr key={trip.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="font-medium text-foreground">{trip.route}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{trip.date}</td>
                        <td className="py-4 px-4 text-muted-foreground">{trip.time}</td>
                        <td className="py-4 px-4 text-muted-foreground">{trip.bus}</td>
                        <td className="py-4 px-4 text-muted-foreground">{trip.bookings}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${trip.status === "in_progress"
                            ? "bg-secondary/10 text-secondary"
                            : trip.status === "completed"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                            }`}>
                            {trip.status === "in_progress" ? "نشطة" : trip.status === "completed" ? "مكتملة" : "مجدولة"}
                          </span>
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
    </DashboardLayout>
  );
};

export default CompanyDashboard;
