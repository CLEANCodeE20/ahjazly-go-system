import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Eye
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { toast } from "@/hooks/use-toast";

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

interface BookingRecord {
  booking_id: number;
  user_id: number | null;
  trip_id: number | null;
  booking_date: string;
  booking_status: string | null;
  payment_method: string | null;
  payment_status: string | null;
  total_price: number;
  platform_commission: number | null;
  partner_revenue: number | null;
}

interface TripRecord {
  trip_id: number;
  route_id: number | null;
  departure_time: string;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
}

interface UserRecord {
  user_id: number;
  full_name: string;
  phone_number: string | null;
}

const BookingsManagement = () => {
  const { data: bookings, loading, update } = useSupabaseCRUD<BookingRecord>({ 
    tableName: 'bookings',
    primaryKey: 'booking_id',
    initialFetch: true
  });

  const { data: trips } = useSupabaseCRUD<TripRecord>({ 
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });

  const { data: routes } = useSupabaseCRUD<RouteRecord>({ 
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const { data: users } = useSupabaseCRUD<UserRecord>({ 
    tableName: 'users',
    primaryKey: 'user_id',
    initialFetch: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const getRouteInfo = (tripId: number | null) => {
    const trip = trips.find(t => t.trip_id === tripId);
    if (!trip) return 'غير محدد';
    const route = routes.find(r => r.route_id === trip.route_id);
    return route ? `${route.origin_city} - ${route.destination_city}` : 'غير محدد';
  };

  const getTripTime = (tripId: number | null) => {
    const trip = trips.find(t => t.trip_id === tripId);
    if (!trip) return { date: '', time: '' };
    const dt = new Date(trip.departure_time);
    return {
      date: dt.toLocaleDateString('ar-SA'),
      time: dt.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getUserInfo = (userId: number | null) => {
    const user = users.find(u => u.user_id === userId);
    return user ? { name: user.full_name, phone: user.phone_number || '' } : { name: 'زائر', phone: '' };
  };

  const handleConfirmBooking = async (id: number) => {
    try {
      await update(id, { booking_status: 'confirmed', payment_status: 'paid' } as never);
      toast({
        title: "تم التأكيد",
        description: "تم تأكيد الحجز بنجاح",
      });
    } catch (error) {
      console.error('Confirm error:', error);
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await update(id, { booking_status: 'cancelled' } as never);
      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الحجز",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const userInfo = getUserInfo(booking.user_id);
    const matchesSearch = userInfo.name.includes(searchQuery) || 
                         userInfo.phone.includes(searchQuery) ||
                         booking.booking_id.toString().includes(searchQuery);
    const matchesFilter = filterStatus === "all" || booking.booking_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: "إجمالي الحجوزات", value: bookings.length, icon: Ticket, color: "text-primary" },
    { label: "مؤكدة", value: bookings.filter(b => b.booking_status === 'confirmed').length, icon: CheckCircle2, color: "text-secondary" },
    { label: "قيد الانتظار", value: bookings.filter(b => b.booking_status === 'pending').length, icon: Clock, color: "text-accent" },
    { label: "ملغاة", value: bookings.filter(b => b.booking_status === 'cancelled').length, icon: XCircle, color: "text-destructive" }
  ];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مؤكد</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> ملغي</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <span className="text-xs font-medium text-secondary">مدفوع</span>;
      case "pending":
        return <span className="text-xs font-medium text-accent">في انتظار الدفع</span>;
      case "failed":
        return <span className="text-xs font-medium text-destructive">فشل الدفع</span>;
      case "refunded":
        return <span className="text-xs font-medium text-muted-foreground">مسترد</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground hidden lg:block">
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
                link.href === "/dashboard/bookings"
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
              <h1 className="text-xl font-bold text-foreground">إدارة الحجوزات</h1>
              <p className="text-sm text-muted-foreground">عرض ومتابعة جميع الحجوزات</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو رقم الجوال أو رقم الحجز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                {["all", "confirmed", "pending", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === "all" && "الكل"}
                    {status === "confirmed" && "مؤكد"}
                    {status === "pending" && "قيد الانتظار"}
                    {status === "cancelled" && "ملغي"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && bookings.length === 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && bookings.length === 0 && (
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد حجوزات</h3>
              <p className="text-muted-foreground">لم يتم إجراء أي حجوزات بعد</p>
            </div>
          )}

          {/* Bookings Table */}
          {bookings.length > 0 && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الحجز</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المسافر</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الرحلة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الدفع</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => {
                      const userInfo = getUserInfo(booking.user_id);
                      const tripTime = getTripTime(booking.trip_id);
                      return (
                        <tr key={booking.booking_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-medium text-primary">BK-{booking.booking_id.toString().padStart(3, '0')}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{userInfo.name}</p>
                                <p className="text-sm text-muted-foreground">{userInfo.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-foreground">{getRouteInfo(booking.trip_id)}</p>
                              <p className="text-sm text-muted-foreground">{tripTime.date} - {tripTime.time}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-foreground">{booking.total_price} ر.س</td>
                          <td className="py-4 px-4">{getPaymentBadge(booking.payment_status)}</td>
                          <td className="py-4 px-4">{getStatusBadge(booking.booking_status)}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {booking.booking_status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" className="text-secondary border-secondary hover:bg-secondary/10" onClick={() => handleConfirmBooking(booking.booking_id)}>
                                    <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(booking.booking_id)}>
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingsManagement;
