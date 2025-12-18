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
  User,
  Ticket
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

// Mock data for trips
const mockTrips = [
  { 
    id: 1, 
    route: "الرياض - جدة", 
    date: "2024-01-15", 
    departureTime: "08:00",
    arrivalTime: "14:00",
    bus: "ABC-1234", 
    mainDriver: "أحمد محمد",
    assistantDriver: "خالد سعد",
    price: 150,
    bookedSeats: 40,
    totalSeats: 45,
    status: "active" 
  },
  { 
    id: 2, 
    route: "الرياض - الدمام", 
    date: "2024-01-15", 
    departureTime: "10:30",
    arrivalTime: "14:30",
    bus: "XYZ-5678", 
    mainDriver: "سعد عبدالله",
    assistantDriver: "محمد علي",
    price: 80,
    bookedSeats: 35,
    totalSeats: 40,
    status: "active" 
  },
  { 
    id: 3, 
    route: "جدة - مكة", 
    date: "2024-01-16", 
    departureTime: "06:00",
    arrivalTime: "07:30",
    bus: "DEF-9012", 
    mainDriver: "عمر حسن",
    assistantDriver: "فهد ناصر",
    price: 50,
    bookedSeats: 28,
    totalSeats: 50,
    status: "scheduled" 
  }
];

const routes = [
  "الرياض - جدة",
  "الرياض - الدمام",
  "جدة - مكة",
  "الرياض - القصيم",
  "جدة - المدينة"
];

const buses = ["ABC-1234", "XYZ-5678", "DEF-9012", "GHI-3456"];
const drivers = ["أحمد محمد", "سعد عبدالله", "عمر حسن", "خالد سعد", "محمد علي", "فهد ناصر"];

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

const TripsManagement = () => {
  const [trips, setTrips] = useState(mockTrips);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    route: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    bus: "",
    mainDriver: "",
    assistantDriver: "",
    price: ""
  });

  const handleAddTrip = () => {
    const trip = {
      id: trips.length + 1,
      ...newTrip,
      price: parseInt(newTrip.price),
      bookedSeats: 0,
      totalSeats: 45,
      status: "scheduled"
    };
    setTrips([...trips, trip]);
    setNewTrip({
      route: "",
      date: "",
      departureTime: "",
      arrivalTime: "",
      bus: "",
      mainDriver: "",
      assistantDriver: "",
      price: ""
    });
    setIsDialogOpen(false);
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تم إضافة الرحلة الجديدة",
    });
  };

  const filteredTrips = trips.filter(trip => 
    trip.route.includes(searchQuery) || 
    trip.bus.includes(searchQuery)
  );

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
                    <Label>المسار</Label>
                    <Select onValueChange={(value) => setNewTrip({ ...newTrip, route: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المسار" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route} value={route}>{route}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">التاريخ</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTrip.date}
                        onChange={(e) => setNewTrip({ ...newTrip, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departureTime">وقت المغادرة</Label>
                      <Input
                        id="departureTime"
                        type="time"
                        value={newTrip.departureTime}
                        onChange={(e) => setNewTrip({ ...newTrip, departureTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="arrivalTime">وقت الوصول</Label>
                      <Input
                        id="arrivalTime"
                        type="time"
                        value={newTrip.arrivalTime}
                        onChange={(e) => setNewTrip({ ...newTrip, arrivalTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الحافلة</Label>
                      <Select onValueChange={(value) => setNewTrip({ ...newTrip, bus: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحافلة" />
                        </SelectTrigger>
                        <SelectContent>
                          {buses.map((bus) => (
                            <SelectItem key={bus} value={bus}>{bus}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">السعر (ريال)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newTrip.price}
                        onChange={(e) => setNewTrip({ ...newTrip, price: e.target.value })}
                        placeholder="150"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>السائق الأساسي</Label>
                      <Select onValueChange={(value) => setNewTrip({ ...newTrip, mainDriver: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السائق" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>السائق المساعد</Label>
                      <Select onValueChange={(value) => setNewTrip({ ...newTrip, assistantDriver: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السائق المساعد" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddTrip}>
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
              <Input type="date" className="md:w-48" />
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                        <Route className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{trip.route}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {trip.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trip.departureTime} - {trip.arrivalTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">الحافلة</p>
                      <p className="font-medium text-foreground">{trip.bus}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السائق</p>
                      <p className="font-medium text-foreground">{trip.mainDriver}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">المقاعد</p>
                      <p className="font-medium text-foreground">{trip.bookedSeats}/{trip.totalSeats}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">السعر</p>
                      <p className="font-bold text-secondary">{trip.price} ر.س</p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                      trip.status === "active" 
                        ? "bg-secondary/10 text-secondary" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {trip.status === "active" ? "نشطة" : "مجدولة"}
                    </span>
                    <Button variant="outline" size="sm">
                      التفاصيل
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">نسبة الحجز</span>
                    <span className="text-foreground font-medium">{Math.round((trip.bookedSeats / trip.totalSeats) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-secondary rounded-full transition-all"
                      style={{ width: `${(trip.bookedSeats / trip.totalSeats) * 100}%` }}
                    />
                  </div>
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
