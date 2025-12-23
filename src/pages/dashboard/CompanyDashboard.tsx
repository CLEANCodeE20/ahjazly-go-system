import { useState, useMemo } from "react";
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
  Ticket,
  Loader2
} from "lucide-react";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";

// Sidebar navigation
const sidebarLinks = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/fleet", label: "إدارة الأسطول", icon: Bus },
  { href: "/dashboard/routes", label: "المسارات", icon: MapPin },
  { href: "/dashboard/trips", label: "الرحلات", icon: Route },
  { href: "/dashboard/employees", label: "الموظفين", icon: Users },
  { href: "/dashboard/branches", label: "الفروع", icon: Building2 },
  { href: "/dashboard/bookings", label: "الحجوزات", icon: Ticket },
  { href: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

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

const CompanyDashboard = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const loading = tripsLoading || bookingsLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(t => t.departure_time?.startsWith(today)).length;
    const newBookings = bookings.filter(b => b.booking_status === 'pending').length;
    const todayRevenue = bookings
      .filter(b => b.booking_date?.startsWith(today) && (b.booking_status === 'confirmed' || b.booking_status === 'completed'))
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    const activeBuses = buses.filter(b => b.status === 'active').length;

    return [
      { label: "الرحلات اليوم", value: todayTrips, icon: Route, change: "+2", trend: "up" },
      { label: "الحجوزات الجديدة", value: newBookings, icon: Ticket, change: "+12", trend: "up" },
      { label: "الإيرادات (ريال)", value: todayRevenue.toLocaleString(), icon: CreditCard, change: "+8%", trend: "up" },
      { label: "الحافلات النشطة", value: activeBuses, icon: Bus, change: "0", trend: "neutral" }
    ];
  }, [trips, bookings, buses]);

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

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}>
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">احجزلي</span>
            <p className="text-xs text-sidebar-foreground/60">شركة السفر الذهبي</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === link.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
            <Link to="/">
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">مرحباً، شركة السفر الذهبي 👋</h1>
              <p className="text-sm text-muted-foreground">إليك نظرة عامة على نشاطك اليوم</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard/trips">
                  <Plus className="w-4 h-4 ml-2" />
                  رحلة جديدة
                </Link>
              </Button>
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                س
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
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
                      {stat.trend === "up" && (
                        <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                          <TrendingUp className="w-3 h-3" />
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Link to="/dashboard/trips" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Route className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="font-medium text-foreground">إضافة رحلة</p>
                </Link>
                <Link to="/dashboard/fleet" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                  <div className="w-12 h-12 rounded-xl gradient-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Bus className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <p className="font-medium text-foreground">إضافة حافلة</p>
                </Link>
                <Link to="/dashboard/employees" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <p className="font-medium text-foreground">إضافة موظف</p>
                </Link>
                <Link to="/dashboard/bookings" className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elegant transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Ticket className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="font-medium text-foreground">عرض الحجوزات</p>
                </Link>
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
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                trip.status === "in_progress" 
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
        </div>
      </main>
    </div>
  );
};

export default CompanyDashboard;
