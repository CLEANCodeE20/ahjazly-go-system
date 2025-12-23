import { useState } from "react";
import { Link } from "react-router-dom";
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
  Loader2
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
  partner_id: number | null;
  route_id: number | null;
  bus_id: number | null;
  driver_id: number | null;
  departure_time: string;
  arrival_time: string | null;
  base_price: number;
  status: string | null;
  created_at: string;
  updated_at: string;
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
}

interface DriverRecord {
  driver_id: number;
  full_name: string;
}

const TripsManagement = () => {
  const { data: trips, loading, create } = useSupabaseCRUD<TripRecord>({ 
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });
  
  const { data: routes } = useSupabaseCRUD<RouteRecord>({ 
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const { data: buses } = useSupabaseCRUD<BusRecord>({ 
    tableName: 'buses',
    primaryKey: 'bus_id',
    initialFetch: true
  });

  const { data: drivers } = useSupabaseCRUD<DriverRecord>({ 
    tableName: 'drivers',
    primaryKey: 'driver_id',
    initialFetch: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTrip, setNewTrip] = useState({
    route_id: "",
    bus_id: "",
    driver_id: "",
    departure_time: "",
    arrival_time: "",
    base_price: ""
  });

  const handleAddTrip = async () => {
    if (!newTrip.route_id || !newTrip.departure_time || !newTrip.base_price) return;
    
    setIsSubmitting(true);
    try {
      await create({
        route_id: parseInt(newTrip.route_id),
        bus_id: newTrip.bus_id ? parseInt(newTrip.bus_id) : null,
        driver_id: newTrip.driver_id ? parseInt(newTrip.driver_id) : null,
        departure_time: newTrip.departure_time,
        arrival_time: newTrip.arrival_time || null,
        base_price: parseFloat(newTrip.base_price),
        status: 'scheduled' as const
      });
      setNewTrip({
        route_id: "",
        bus_id: "",
        driver_id: "",
        departure_time: "",
        arrival_time: "",
        base_price: ""
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Add trip error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRouteInfo = (routeId: number | null) => {
    const route = routes.find(r => r.route_id === routeId);
    return route ? `${route.origin_city} - ${route.destination_city}` : 'غير محدد';
  };

  const getBusInfo = (busId: number | null) => {
    const bus = buses.find(b => b.bus_id === busId);
    return bus ? bus.license_plate : 'غير محدد';
  };

  const getDriverInfo = (driverId: number | null) => {
    const driver = drivers.find(d => d.driver_id === driverId);
    return driver ? driver.full_name : 'غير محدد';
  };

  const filteredTrips = trips.filter(trip => {
    const routeInfo = getRouteInfo(trip.route_id);
    const busInfo = getBusInfo(trip.bus_id);
    return routeInfo.includes(searchQuery) || busInfo.includes(searchQuery);
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
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
                link.href === "/dashboard/trips"
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
              <h1 className="text-xl font-bold text-foreground">إدارة الرحلات</h1>
              <p className="text-sm text-muted-foreground">إنشاء وإدارة رحلات الشركة</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  رحلة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>إنشاء رحلة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل تفاصيل الرحلة الجديدة
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>المسار *</Label>
                    <Select value={newTrip.route_id} onValueChange={(v) => setNewTrip({ ...newTrip, route_id: v })}>
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
                      <Label htmlFor="departure_time">وقت المغادرة *</Label>
                      <Input
                        id="departure_time"
                        type="datetime-local"
                        value={newTrip.departure_time}
                        onChange={(e) => setNewTrip({ ...newTrip, departure_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arrival_time">وقت الوصول المتوقع</Label>
                      <Input
                        id="arrival_time"
                        type="datetime-local"
                        value={newTrip.arrival_time}
                        onChange={(e) => setNewTrip({ ...newTrip, arrival_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الحافلة</Label>
                      <Select value={newTrip.bus_id} onValueChange={(v) => setNewTrip({ ...newTrip, bus_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحافلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {buses.map((bus) => (
                            <SelectItem key={bus.bus_id} value={bus.bus_id.toString()}>
                              {bus.license_plate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base_price">السعر (ريال) *</Label>
                      <Input
                        id="base_price"
                        type="number"
                        value={newTrip.base_price}
                        onChange={(e) => setNewTrip({ ...newTrip, base_price: e.target.value })}
                        placeholder="150"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>السائق</Label>
                    <Select value={newTrip.driver_id} onValueChange={(v) => setNewTrip({ ...newTrip, driver_id: v })}>
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
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddTrip} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    إنشاء الرحلة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث بالمسار أو رقم الحافلة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && trips.length === 0 && (
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
              <p className="text-muted-foreground mb-4">ابدأ بإضافة رحلة جديدة</p>
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
                      <p className="font-medium text-foreground">{getBusInfo(trip.bus_id)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السائق</p>
                      <p className="font-medium text-foreground">{getDriverInfo(trip.driver_id)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السعر</p>
                      <p className="font-bold text-secondary">{trip.base_price} ر.س</p>
                    </div>
                    <div className="text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                        trip.status === "scheduled" 
                          ? "bg-muted text-muted-foreground" 
                          : trip.status === "in_progress"
                          ? "bg-primary/10 text-primary"
                          : trip.status === "completed"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {trip.status === "scheduled" ? "مجدولة" : 
                         trip.status === "in_progress" ? "جارية" :
                         trip.status === "completed" ? "مكتملة" :
                         trip.status === "cancelled" ? "ملغاة" : trip.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button variant="outline" size="sm">
                    التفاصيل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TripsManagement;
