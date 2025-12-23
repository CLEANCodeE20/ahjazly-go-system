import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Plus,
  Search,
  MapPin,
  Ticket,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
  Navigation
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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

// Sample routes data
const initialRoutes = [
  { 
    id: 1, 
    name: "الرياض - جدة", 
    from: "الرياض",
    to: "جدة",
    distance: 950,
    duration: "6 ساعات",
    stops: ["القصيم", "المدينة المنورة"],
    basePrice: 150,
    status: "active"
  },
  { 
    id: 2, 
    name: "الرياض - الدمام", 
    from: "الرياض",
    to: "الدمام",
    distance: 400,
    duration: "4 ساعات",
    stops: ["الأحساء"],
    basePrice: 80,
    status: "active"
  },
  { 
    id: 3, 
    name: "جدة - مكة", 
    from: "جدة",
    to: "مكة المكرمة",
    distance: 80,
    duration: "1.5 ساعة",
    stops: [],
    basePrice: 50,
    status: "active"
  },
  { 
    id: 4, 
    name: "الرياض - القصيم", 
    from: "الرياض",
    to: "بريدة",
    distance: 350,
    duration: "3.5 ساعات",
    stops: ["المجمعة"],
    basePrice: 70,
    status: "inactive"
  },
  { 
    id: 5, 
    name: "جدة - المدينة", 
    from: "جدة",
    to: "المدينة المنورة",
    distance: 420,
    duration: "4.5 ساعات",
    stops: ["ينبع"],
    basePrice: 100,
    status: "active"
  }
];

const RoutesManagement = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [routes, setRoutes] = useState(initialRoutes);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<typeof initialRoutes[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    from: "",
    to: "",
    distance: "",
    duration: "",
    stops: "",
    basePrice: ""
  });

  const filteredRoutes = routes.filter(route => 
    route.name.includes(searchTerm) || 
    route.from.includes(searchTerm) ||
    route.to.includes(searchTerm)
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.from || !formData.to || !formData.basePrice) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (editingRoute) {
      setRoutes(routes.map(r => 
        r.id === editingRoute.id 
          ? { 
              ...r, 
              ...formData, 
              distance: Number(formData.distance),
              basePrice: Number(formData.basePrice),
              stops: formData.stops.split(",").map(s => s.trim()).filter(Boolean)
            }
          : r
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المسار بنجاح"
      });
    } else {
      const newRoute = {
        id: Date.now(),
        ...formData,
        distance: Number(formData.distance),
        basePrice: Number(formData.basePrice),
        stops: formData.stops.split(",").map(s => s.trim()).filter(Boolean),
        status: "active" as const
      };
      setRoutes([...routes, newRoute]);
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة المسار الجديد بنجاح"
      });
    }

    setFormData({ name: "", from: "", to: "", distance: "", duration: "", stops: "", basePrice: "" });
    setEditingRoute(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (route: typeof initialRoutes[0]) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      from: route.from,
      to: route.to,
      distance: route.distance.toString(),
      duration: route.duration,
      stops: route.stops.join(", "),
      basePrice: route.basePrice.toString()
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setRoutes(routes.filter(r => r.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف المسار بنجاح"
    });
  };

  const toggleStatus = (id: number) => {
    setRoutes(routes.map(r => 
      r.id === id 
        ? { ...r, status: r.status === "active" ? "inactive" : "active" }
        : r
    ));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 translate-x-0 hidden lg:block">
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
              <h1 className="text-xl font-bold text-foreground">إدارة المسارات</h1>
              <p className="text-sm text-muted-foreground">إضافة وإدارة مسارات الرحلات</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRoute(null);
                  setFormData({ name: "", from: "", to: "", distance: "", duration: "", stops: "", basePrice: "" });
                }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مسار
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingRoute ? "تعديل المسار" : "إضافة مسار جديد"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>اسم المسار *</Label>
                    <Input 
                      placeholder="مثال: الرياض - جدة"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نقطة الانطلاق *</Label>
                      <Input 
                        placeholder="المدينة"
                        value={formData.from}
                        onChange={(e) => setFormData({...formData, from: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نقطة الوصول *</Label>
                      <Input 
                        placeholder="المدينة"
                        value={formData.to}
                        onChange={(e) => setFormData({...formData, to: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المسافة (كم)</Label>
                      <Input 
                        type="number"
                        placeholder="950"
                        value={formData.distance}
                        onChange={(e) => setFormData({...formData, distance: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مدة الرحلة</Label>
                      <Input 
                        placeholder="6 ساعات"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>محطات التوقف</Label>
                    <Input 
                      placeholder="القصيم، المدينة (مفصولة بفاصلة)"
                      value={formData.stops}
                      onChange={(e) => setFormData({...formData, stops: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر الأساسي (ريال) *</Label>
                    <Input 
                      type="number"
                      placeholder="150"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingRoute ? "حفظ التغييرات" : "إضافة المسار"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
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
                  <Route className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{routes.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المسارات</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{routes.filter(r => r.status === "active").length}</p>
                  <p className="text-sm text-muted-foreground">مسارات نشطة</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{routes.reduce((acc, r) => acc + r.stops.length, 0)}</p>
                  <p className="text-sm text-muted-foreground">محطات التوقف</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="بحث عن مسار..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Routes List */}
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div key={route.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <Route className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{route.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            route.status === "active" 
                              ? "bg-secondary/10 text-secondary" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {route.status === "active" ? "نشط" : "غير نشط"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{route.from}</span>
                        <span className="text-muted-foreground">←</span>
                        <span className="text-foreground">{route.to}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Navigation className="w-4 h-4" />
                        <span>{route.distance} كم</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{route.duration}</span>
                      </div>
                    </div>

                    {/* Stops */}
                    {route.stops.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">محطات التوقف:</span>
                        <div className="flex flex-wrap gap-2">
                          {route.stops.map((stop, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs">
                              {stop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">{route.basePrice}</p>
                      <p className="text-xs text-muted-foreground">ريال</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => handleEdit(route)}>
                          <Edit className="w-4 h-4 ml-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(route.id)}>
                          {route.status === "active" ? "إيقاف" : "تفعيل"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(route.id)}
                        >
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

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <Route className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد مسارات</h3>
              <p className="text-muted-foreground mb-4">لم يتم العثور على مسارات مطابقة للبحث</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoutesManagement;
