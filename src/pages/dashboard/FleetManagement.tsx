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
  CheckCircle2,
  AlertCircle,
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

interface BusRecord {
  bus_id: number;
  partner_id: number | null;
  license_plate: string;
  model: string | null;
  bus_type: string | null;
  bus_class_id: number | null;
  capacity: number | null;
  status: string | null;
  owner_user_id: number | null;
  created_at: string;
}

const FleetManagement = () => {
  const { 
    data: buses, 
    loading, 
    create, 
    remove 
  } = useSupabaseCRUD<BusRecord>({ 
    tableName: 'buses',
    primaryKey: 'bus_id',
    initialFetch: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBus, setNewBus] = useState({
    license_plate: "",
    model: "",
    capacity: "",
    bus_type: "standard",
    status: "active"
  });

  const handleAddBus = async () => {
    if (!newBus.license_plate || !newBus.model) return;
    
    setIsSubmitting(true);
    try {
      await create({
        license_plate: newBus.license_plate,
        model: newBus.model,
        capacity: parseInt(newBus.capacity) || 40,
        bus_type: newBus.bus_type as "standard" | "vip" | "sleeper" | "double_decker",
        status: newBus.status as "active" | "maintenance" | "inactive" | "retired"
      });
      setNewBus({ license_plate: "", model: "", capacity: "", bus_type: "standard", status: "active" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Add bus error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBus = async () => {
    if (deleteId) {
      await remove(deleteId);
      setDeleteId(null);
    }
  };

  const filteredBuses = buses.filter(bus => 
    bus.license_plate?.includes(searchQuery) || 
    bus.model?.includes(searchQuery)
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> نشطة</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><AlertCircle className="w-3 h-3" /> صيانة</span>;
      case "inactive":
      case "retired":
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
                      <Label htmlFor="license_plate">رقم اللوحة *</Label>
                      <Input
                        id="license_plate"
                        value={newBus.license_plate}
                        onChange={(e) => setNewBus({ ...newBus, license_plate: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">الموديل *</Label>
                      <Input
                        id="model"
                        value={newBus.model}
                        onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                        placeholder="Mercedes-Benz"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">عدد المقاعد</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newBus.capacity}
                        onChange={(e) => setNewBus({ ...newBus, capacity: e.target.value })}
                        placeholder="45"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نوع الحافلة</Label>
                      <Select value={newBus.bus_type} onValueChange={(v) => setNewBus({ ...newBus, bus_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">عادية</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                          <SelectItem value="sleeper">نوم</SelectItem>
                          <SelectItem value="double_decker">طابقين</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddBus} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
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

          {/* Loading State */}
          {loading && buses.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && buses.length === 0 && (
            <div className="text-center py-12">
              <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد حافلات</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة حافلة جديدة</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حافلة
              </Button>
            </div>
          )}

          {/* Buses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuses.map((bus) => (
              <div key={bus.bus_id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Bus className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => setDeleteId(bus.bus_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-bold text-foreground text-lg mb-1">{bus.license_plate}</h3>
                <p className="text-muted-foreground text-sm mb-4">{bus.model}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">النوع</span>
                    <span className="text-foreground">{bus.bus_type === 'standard' ? 'عادية' : bus.bus_type === 'vip' ? 'VIP' : bus.bus_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">عدد المقاعد</span>
                    <span className="text-foreground">{bus.capacity || 40} مقعد</span>
                  </div>
                </div>

                {getStatusBadge(bus.status)}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الحافلة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBus} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FleetManagement;
