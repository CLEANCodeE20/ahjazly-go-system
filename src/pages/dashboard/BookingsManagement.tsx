import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Eye,
  Printer,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TicketPrint from "@/components/TicketPrint";
import { useReactToPrint } from "react-to-print";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { usePartner } from "@/hooks/usePartner";

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
  const { partner } = usePartner();
  const { data: bookings, loading, update, refetch } = useSupabaseCRUD<BookingRecord>({
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

  useRealtimeBookings(() => {
    refetch();
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const { exportToExcel, exportToPDF } = useExport();
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `تذكرة-${selectedBooking?.booking_id}`,
  });

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

  const handleExport = (type: 'excel' | 'pdf') => {
    const dataToExport = filteredBookings.map(b => {
      const user = getUserInfo(b.user_id);
      const route = getRouteInfo(b.trip_id);
      const trip = getTripTime(b.trip_id);
      return {
        "رقم الحجز": `BK-${b.booking_id}`,
        "المسافر": user.name,
        "الجوال": user.phone,
        "المسار": route,
        "التاريخ": trip.date,
        "الوقت": trip.time,
        "السعر": b.total_price,
        "الحالة": b.booking_status === 'confirmed' ? 'مؤكد' : b.booking_status === 'pending' ? 'انتظار' : 'ملغي'
      };
    });

    if (type === 'excel') {
      exportToExcel(dataToExport, "bookings_report");
    } else {
      exportToPDF(dataToExport, [
        { header: "رقم الحجز", key: "رقم الحجز" },
        { header: "المسافر", key: "المسافر" },
        { header: "المسار", key: "المسار" },
        { header: "التاريخ", key: "التاريخ" },
        { header: "السعر", key: "السعر" },
        { header: "الحالة", key: "الحالة" }
      ], { title: "تقرير الحجوزات" });
    }
  };

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
    <DashboardLayout
      title="إدارة الحجوزات"
      subtitle="عرض ومتابعة جميع الحجوزات"
      actions={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
              Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 ml-2 text-red-600" />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-card rounded-xl border border-border p-4">
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
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSelectedBooking(booking);
                              setShowPrintDialog(true);
                            }}>
                              <Printer className="w-4 h-4" />
                            </Button>
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

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>طباعة التذكرة</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <>
              <TicketPrint
                ref={ticketRef}
                booking={{
                  booking_id: selectedBooking.booking_id,
                  total_price: selectedBooking.total_price,
                  booking_date: selectedBooking.booking_date,
                  payment_method: selectedBooking.payment_method,
                  payment_status: selectedBooking.payment_status
                }}
                passenger={getUserInfo(selectedBooking.user_id)}
                companyName={partner?.company_name}
                logoUrl={partner?.logo_url}
                trip={{
                  origin: (() => {
                    const trip = trips.find(t => t.trip_id === selectedBooking.trip_id);
                    const route = routes.find(r => r.route_id === trip?.route_id);
                    return route?.origin_city || 'غير محدد';
                  })(),
                  destination: (() => {
                    const trip = trips.find(t => t.trip_id === selectedBooking.trip_id);
                    const route = routes.find(r => r.route_id === trip?.route_id);
                    return route?.destination_city || 'غير محدد';
                  })(),
                  ...getTripTime(selectedBooking.trip_id)
                }}
              />
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={() => handlePrint()}>
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </Button>
                <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                  إغلاق
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BookingsManagement;
