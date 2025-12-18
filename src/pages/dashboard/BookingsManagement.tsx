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
  Calendar,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Eye
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data for bookings
const mockBookings = [
  { 
    id: "BK-001", 
    passengerName: "عبدالله محمد",
    phone: "0501234567",
    route: "الرياض - جدة", 
    date: "2024-01-15", 
    time: "08:00",
    seatNumber: "A12",
    price: 150,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    createdAt: "2024-01-14 10:30"
  },
  { 
    id: "BK-002", 
    passengerName: "سارة أحمد",
    phone: "0559876543",
    route: "الرياض - جدة", 
    date: "2024-01-15", 
    time: "08:00",
    seatNumber: "A14",
    price: 150,
    paymentStatus: "pending",
    bookingStatus: "pending",
    createdAt: "2024-01-14 11:45"
  },
  { 
    id: "BK-003", 
    passengerName: "خالد عمر",
    phone: "0544556677",
    route: "الرياض - الدمام", 
    date: "2024-01-15", 
    time: "10:30",
    seatNumber: "B8",
    price: 80,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    createdAt: "2024-01-14 14:20"
  },
  { 
    id: "BK-004", 
    passengerName: "نورة سعد",
    phone: "0533221100",
    route: "جدة - مكة", 
    date: "2024-01-16", 
    time: "06:00",
    seatNumber: "C3",
    price: 50,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    createdAt: "2024-01-14 16:00"
  },
  { 
    id: "BK-005", 
    passengerName: "فهد ناصر",
    phone: "0511223344",
    route: "الرياض - جدة", 
    date: "2024-01-15", 
    time: "08:00",
    seatNumber: "A20",
    price: 150,
    paymentStatus: "failed",
    bookingStatus: "cancelled",
    createdAt: "2024-01-14 09:15"
  }
];

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

const stats = [
  { label: "حجوزات اليوم", value: 45, icon: Ticket, color: "text-primary" },
  { label: "مؤكدة", value: 38, icon: CheckCircle2, color: "text-secondary" },
  { label: "قيد الانتظار", value: 5, icon: Clock, color: "text-accent" },
  { label: "ملغاة", value: 2, icon: XCircle, color: "text-destructive" }
];

const BookingsManagement = () => {
  const [bookings, setBookings] = useState(mockBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleConfirmBooking = (id: string) => {
    setBookings(bookings.map(b => 
      b.id === id ? { ...b, bookingStatus: "confirmed", paymentStatus: "paid" } : b
    ));
    toast({
      title: "تم التأكيد",
      description: "تم تأكيد الحجز بنجاح",
    });
  };

  const handleCancelBooking = (id: string) => {
    setBookings(bookings.map(b => 
      b.id === id ? { ...b, bookingStatus: "cancelled" } : b
    ));
    toast({
      title: "تم الإلغاء",
      description: "تم إلغاء الحجز",
      variant: "destructive"
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.passengerName.includes(searchQuery) || 
                         booking.phone.includes(searchQuery) ||
                         booking.id.includes(searchQuery);
    const matchesFilter = filterStatus === "all" || booking.bookingStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مؤكد</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> ملغي</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="text-xs font-medium text-secondary">مدفوع</span>;
      case "pending":
        return <span className="text-xs font-medium text-accent">في انتظار الدفع</span>;
      case "failed":
        return <span className="text-xs font-medium text-destructive">فشل الدفع</span>;
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

          {/* Bookings Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الحجز</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المسافر</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الرحلة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المقعد</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">السعر</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الدفع</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-medium text-primary">{booking.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{booking.passengerName}</p>
                            <p className="text-sm text-muted-foreground">{booking.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-foreground">{booking.route}</p>
                          <p className="text-sm text-muted-foreground">{booking.date} - {booking.time}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium">
                          {booking.seatNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-foreground">{booking.price} ر.س</td>
                      <td className="py-4 px-4">{getPaymentBadge(booking.paymentStatus)}</td>
                      <td className="py-4 px-4">{getStatusBadge(booking.bookingStatus)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.bookingStatus === "pending" && (
                            <>
                              <Button size="sm" variant="success" onClick={() => handleConfirmBooking(booking.id)}>
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(booking.id)}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingsManagement;
