import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Loader2,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
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

interface TripRecord {
  trip_id: number;
  partner_id: number | null;
  route_id: number | null;
  bus_id: number | null;
  driver_id: number | null;
  departure_time: string;
  arrival_time: string | null;
  base_price: number;
  status: string | null;
  created_at: string;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
}

interface BusRecord {
  bus_id: number;
  license_plate: string;
  capacity: number | null;
  model: string | null;
}

interface DriverRecord {
  driver_id: number;
  full_name: string;
  phone_number: string | null;
}

const TripsManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { partnerId, partner } = usePartner();

  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { exportToExcel, exportToPDF } = useExport();
  const [formData, setFormData] = useState({
    route_id: "",
    bus_id: "",
    driver_id: "",
    departure_time: "",
    arrival_time: "",
    base_price: ""
  });

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all data in parallel
    const [tripsRes, routesRes, busesRes, driversRes] = await Promise.all([
      supabase.from('trips').select('*').order('departure_time', { ascending: false }),
      supabase.from('routes').select('route_id, origin_city, destination_city'),
      supabase.from('buses').select('bus_id, license_plate, capacity, model'),
      supabase.from('drivers').select('driver_id, full_name, phone_number')
    ]);

    if (!tripsRes.error) setTrips(tripsRes.data || []);
    if (!routesRes.error) setRoutes(routesRes.data || []);
    if (!busesRes.error) setBuses(busesRes.data || []);
    if (!driversRes.error) setDrivers(driversRes.data || []);

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.route_id || !formData.departure_time || !formData.base_price) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const tripData = {
      route_id: parseInt(formData.route_id),
      bus_id: formData.bus_id ? parseInt(formData.bus_id) : null,
      driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
      departure_time: formData.departure_time,
      arrival_time: formData.arrival_time || null,
      base_price: parseFloat(formData.base_price),
      partner_id: partnerId,
      status: 'scheduled' as const
    };

    try {
      if (editingTrip) {
        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('trip_id', editingTrip.trip_id);
        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث الرحلة بنجاح" });
      } else {
        const { error } = await supabase
          .from('trips')
          .insert(tripData);
        if (error) throw error;
        toast({ title: "تمت الإضافة", description: "تم إنشاء الرحلة بنجاح" });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (trip: TripRecord) => {
    setEditingTrip(trip);
    setFormData({
      route_id: trip.route_id?.toString() || "",
      bus_id: trip.bus_id?.toString() || "",
      driver_id: trip.driver_id?.toString() || "",
      departure_time: trip.departure_time ? new Date(trip.departure_time).toISOString().slice(0, 16) : "",
      arrival_time: trip.arrival_time ? new Date(trip.arrival_time).toISOString().slice(0, 16) : "",
      base_price: trip.base_price?.toString() || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('trips').delete().eq('trip_id', deleteId);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحذف", description: "تم حذف الرحلة بنجاح" });
        fetchData();
      }
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (tripId: number, newStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed') => {
    const { error } = await supabase
      .from('trips')
      .update({ status: newStatus })
      .eq('trip_id', tripId);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحديث", description: "تم تحديث حالة الرحلة" });
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      route_id: "",
      bus_id: "",
      driver_id: "",
      departure_time: "",
      arrival_time: "",
      base_price: ""
    });
    setEditingTrip(null);
  };

  const getRouteInfo = (routeId: number | null) => {
    const route = routes.find(r => r.route_id === routeId);
    return route ? `${route.origin_city} - ${route.destination_city}` : 'غير محدد';
  };

  const getBusInfo = (busId: number | null) => {
    const bus = buses.find(b => b.bus_id === busId);
    return bus ? `${bus.license_plate} ${bus.model ? `(${bus.model})` : ''}` : 'غير محدد';
  };

  const getDriverInfo = (driverId: number | null) => {
    const driver = drivers.find(d => d.driver_id === driverId);
    return driver ? driver.full_name : 'غير محدد';
  };

  const filteredTrips = trips.filter(trip => {
    const routeInfo = getRouteInfo(trip.route_id);
    const matchesSearch = routeInfo.includes(searchQuery) || getBusInfo(trip.bus_id).includes(searchQuery);
    const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-SA');
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string | null) => {
    const styles = {
      scheduled: "bg-muted text-muted-foreground",
      in_progress: "bg-primary/10 text-primary",
      completed: "bg-secondary/10 text-secondary",
      cancelled: "bg-destructive/10 text-destructive",
      delayed: "bg-accent/10 text-accent"
    };
    const labels = {
      scheduled: "مجدولة",
      in_progress: "جارية",
      completed: "مكتملة",
      cancelled: "ملغية",
      delayed: "متأخرة"
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.scheduled}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    const dataToExport = filteredTrips.map(t => ({
      "المسار": getRouteInfo(t.route_id),
      "التاريخ": formatDate(t.departure_time),
      "وقت المغادرة": formatTime(t.departure_time),
      "الحافلة": getBusInfo(t.bus_id),
      "السائق": getDriverInfo(t.driver_id),
      "السعر": t.base_price,
      "الحالة": t.status === 'scheduled' ? 'مجدولة' : t.status === 'in_progress' ? 'جارية' : 'مكتملة'
    }));

    if (type === 'excel') {
      exportToExcel(dataToExport, "trips_list");
    } else {
      exportToPDF(dataToExport, [
        { header: "المسار", key: "المسار" },
        { header: "التاريخ", key: "التاريخ" },
        { header: "وقت المغادرة", key: "وقت المغادرة" },
        { header: "الحافلة", key: "الحافلة" },
        { header: "السائق", key: "السائق" },
        { header: "السعر", key: "السعر" },
        { header: "الحالة", key: "الحالة" }
      ], { title: "قائمة الرحلات" });
    }
  };

  // Stats
  const scheduledCount = trips.filter(t => t.status === 'scheduled').length;
  const inProgressCount = trips.filter(t => t.status === 'in_progress').length;
  const completedCount = trips.filter(t => t.status === 'completed').length;

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
            <p className="text-xs text-sidebar-foreground/60">{partner?.company_name || "شركتي"}</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === link.href
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
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">إدارة الرحلات</h1>
              <p className="text-sm text-muted-foreground">إنشاء وإدارة رحلات الشركة</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  رحلة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingTrip ? "تعديل الرحلة" : "إنشاء رحلة جديدة"}</DialogTitle>
                  <DialogDescription>أدخل تفاصيل الرحلة</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>المسار *</Label>
                    <Select value={formData.route_id} onValueChange={(v) => setFormData({ ...formData, route_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المسار" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route.route_id} value={route.route_id.toString()}>
                            {route.origin_city} - {route.destination_city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>وقت المغادرة *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.departure_time}
                        onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وقت الوصول المتوقع</Label>
                      <Input
                        type="datetime-local"
                        value={formData.arrival_time}
                        onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الحافلة</Label>
                      <Select value={formData.bus_id} onValueChange={(v) => setFormData({ ...formData, bus_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحافلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {buses.map((bus) => (
                            <SelectItem key={bus.bus_id} value={bus.bus_id.toString()}>
                              {bus.license_plate} {bus.model && `(${bus.model})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>السعر (ريال) *</Label>
                      <Input
                        type="number"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                        placeholder="150"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>السائق</Label>
                    <Select value={formData.driver_id} onValueChange={(v) => setFormData({ ...formData, driver_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السائق" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.driver_id} value={driver.driver_id.toString()}>
                            {driver.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    {editingTrip ? "حفظ التغييرات" : "إنشاء الرحلة"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Route className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{trips.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الرحلات</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{scheduledCount}</p>
                  <p className="text-sm text-muted-foreground">مجدولة</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">جارية</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">مكتملة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث بالمسار أو الحافلة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="scheduled">مجدولة</SelectItem>
                  <SelectItem value="in_progress">جارية</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && trips.length === 0 && (
            <div className="text-center py-12">
              <Route className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد رحلات</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإنشاء رحلة جديدة</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                رحلة جديدة
              </Button>
            </div>
          )}

          {/* Trips List */}
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <div key={trip.trip_id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <Route className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{getRouteInfo(trip.route_id)}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(trip.departure_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(trip.departure_time)}
                            {trip.arrival_time && ` - ${formatTime(trip.arrival_time)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">الحافلة</p>
                      <p className="font-medium text-foreground text-sm">{getBusInfo(trip.bus_id)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السائق</p>
                      <p className="font-medium text-foreground text-sm">{getDriverInfo(trip.driver_id)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السعر</p>
                      <p className="font-bold text-secondary">{trip.base_price} ر.س</p>
                    </div>
                    <div className="text-center">
                      {getStatusBadge(trip.status)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(trip)}>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        {trip.status === 'scheduled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.trip_id, 'in_progress')}>
                            <PlayCircle className="w-4 h-4 ml-2" />
                            بدء الرحلة
                          </DropdownMenuItem>
                        )}
                        {trip.status === 'in_progress' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.trip_id, 'completed')}>
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                            إنهاء الرحلة
                          </DropdownMenuItem>
                        )}
                        {trip.status === 'scheduled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(trip.trip_id, 'cancelled')} className="text-destructive">
                            <XCircle className="w-4 h-4 ml-2" />
                            إلغاء الرحلة
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setDeleteId(trip.trip_id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه الرحلة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TripsManagement;