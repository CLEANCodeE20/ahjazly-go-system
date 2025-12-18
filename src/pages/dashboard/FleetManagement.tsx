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
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  MapPin,
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

// Mock data for buses
const mockBuses = [
  { id: 1, plateNumber: "ABC-1234", model: "Mercedes-Benz Tourismo", year: 2022, seats: 45, status: "active", licenseExpiry: "2024-06-15" },
  { id: 2, plateNumber: "XYZ-5678", model: "Volvo 9700", year: 2021, seats: 40, status: "active", licenseExpiry: "2024-08-20" },
  { id: 3, plateNumber: "DEF-9012", model: "Scania Touring", year: 2023, seats: 50, status: "maintenance", licenseExpiry: "2024-12-01" },
  { id: 4, plateNumber: "GHI-3456", model: "MAN Lion's Coach", year: 2020, seats: 45, status: "active", licenseExpiry: "2024-03-10" },
  { id: 5, plateNumber: "JKL-7890", model: "Setra S 516 HDH", year: 2022, seats: 48, status: "inactive", licenseExpiry: "2024-05-25" }
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

const FleetManagement = () => {
  const [buses, setBuses] = useState(mockBuses);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBus, setNewBus] = useState({
    plateNumber: "",
    model: "",
    year: "",
    seats: "",
    licenseExpiry: ""
  });

  const handleAddBus = () => {
    const bus = {
      id: buses.length + 1,
      ...newBus,
      year: parseInt(newBus.year),
      seats: parseInt(newBus.seats),
      status: "active"
    };
    setBuses([...buses, bus]);
    setNewBus({ plateNumber: "", model: "", year: "", seats: "", licenseExpiry: "" });
    setIsDialogOpen(false);
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تم إضافة الحافلة إلى الأسطول",
    });
  };

  const handleDeleteBus = (id: number) => {
    setBuses(buses.filter(bus => bus.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الحافلة من الأسطول",
      variant: "destructive"
    });
  };

  const filteredBuses = buses.filter(bus => 
    bus.plateNumber.includes(searchQuery) || 
    bus.model.includes(searchQuery)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> نشطة</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><AlertCircle className="w-3 h-3" /> صيانة</span>;
      case "inactive":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">غير نشطة</span>;
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
                link.href === "/dashboard/fleet"
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
              <h1 className="text-xl font-bold text-foreground">إدارة الأسطول</h1>
              <p className="text-sm text-muted-foreground">إضافة وتعديل حافلات الشركة</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة حافلة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>إضافة حافلة جديدة</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات الحافلة الجديدة لإضافتها إلى الأسطول
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber">رقم اللوحة</Label>
                      <Input
                        id="plateNumber"
                        value={newBus.plateNumber}
                        onChange={(e) => setNewBus({ ...newBus, plateNumber: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">الموديل</Label>
                      <Input
                        id="model"
                        value={newBus.model}
                        onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                        placeholder="Mercedes-Benz"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">سنة الصنع</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newBus.year}
                        onChange={(e) => setNewBus({ ...newBus, year: e.target.value })}
                        placeholder="2023"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seats">عدد المقاعد</Label>
                      <Input
                        id="seats"
                        type="number"
                        value={newBus.seats}
                        onChange={(e) => setNewBus({ ...newBus, seats: e.target.value })}
                        placeholder="45"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseExpiry">انتهاء الترخيص</Label>
                      <Input
                        id="licenseExpiry"
                        type="date"
                        value={newBus.licenseExpiry}
                        onChange={(e) => setNewBus({ ...newBus, licenseExpiry: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddBus}>
                    إضافة الحافلة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{buses.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الحافلات</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{buses.filter(b => b.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">حافلات نشطة</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{buses.filter(b => b.status === "maintenance").length}</p>
                  <p className="text-sm text-muted-foreground">في الصيانة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم اللوحة أو الموديل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Buses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuses.map((bus) => (
              <div key={bus.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Bus className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteBus(bus.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-bold text-foreground text-lg mb-1">{bus.plateNumber}</h3>
                <p className="text-muted-foreground text-sm mb-4">{bus.model}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">سنة الصنع</span>
                    <span className="text-foreground">{bus.year}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">عدد المقاعد</span>
                    <span className="text-foreground">{bus.seats} مقعد</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">انتهاء الترخيص</span>
                    <span className="text-foreground">{bus.licenseExpiry}</span>
                  </div>
                </div>

                {getStatusBadge(bus.status)}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FleetManagement;
