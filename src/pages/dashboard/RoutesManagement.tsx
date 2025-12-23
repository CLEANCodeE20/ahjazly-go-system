import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Navigation,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical
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
import { Label } from "@/components/ui/label";
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

interface RouteRecord {
  route_id: number;
  partner_id: number | null;
  origin_city: string;
  destination_city: string;
  distance_km: number | null;
  estimated_duration_hours: number | null;
  created_at: string;
  updated_at: string;
}

interface RouteStop {
  stop_id: number;
  route_id: number | null;
  stop_name: string;
  stop_location: string | null;
  stop_order: number | null;
  preparation_time: string | null;
}

const RoutesManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { partnerId, partner, isLoading: partnerLoading } = usePartner();
  
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [routeStops, setRouteStops] = useState<Record<number, RouteStop[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    origin_city: "",
    destination_city: "",
    distance_km: "",
    estimated_duration_hours: "",
  });
  const [newStops, setNewStops] = useState<{name: string; location: string; time: string}[]>([]);
  const [stopFormData, setStopFormData] = useState({
    stop_name: "",
    stop_location: "",
    preparation_time: ""
  });

  useEffect(() => {
    fetchRoutes();
  }, [partnerId]);

  const fetchRoutes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching routes:', error);
      toast({ title: "خطأ", description: "فشل في تحميل المسارات", variant: "destructive" });
    } else {
      setRoutes(data || []);
      // Fetch stops for all routes
      if (data && data.length > 0) {
        const routeIds = data.map(r => r.route_id);
        const { data: stopsData } = await supabase
          .from('route_stops')
          .select('*')
          .in('route_id', routeIds)
          .order('stop_order', { ascending: true });
        
        if (stopsData) {
          const stopsMap: Record<number, RouteStop[]> = {};
          stopsData.forEach(stop => {
            if (stop.route_id) {
              if (!stopsMap[stop.route_id]) stopsMap[stop.route_id] = [];
              stopsMap[stop.route_id].push(stop);
            }
          });
          setRouteStops(stopsMap);
        }
      }
    }
    setLoading(false);
  };

  const filteredRoutes = routes.filter(route => 
    route.origin_city?.includes(searchTerm) || 
    route.destination_city?.includes(searchTerm)
  );

  const handleSubmit = async () => {
    if (!formData.origin_city || !formData.destination_city) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const routeData = {
      origin_city: formData.origin_city,
      destination_city: formData.destination_city,
      distance_km: Number(formData.distance_km) || null,
      estimated_duration_hours: Number(formData.estimated_duration_hours) || null,
      partner_id: partnerId,
    };

    try {
      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update(routeData)
          .eq('route_id', editingRoute.route_id);
        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث المسار بنجاح" });
      } else {
        const { data: newRoute, error } = await supabase
          .from('routes')
          .insert(routeData)
          .select()
          .single();
        if (error) throw error;
        
        // Add stops if any were added
        if (newStops.length > 0 && newRoute) {
          const stopsToInsert = newStops.map((stop, index) => ({
            route_id: newRoute.route_id,
            stop_name: stop.name,
            stop_location: stop.location || null,
            stop_order: index + 1,
            preparation_time: stop.time || null
          }));
          
          const { error: stopsError } = await supabase
            .from('route_stops')
            .insert(stopsToInsert);
          
          if (stopsError) {
            console.error('Error adding stops:', stopsError);
          }
        }
        
        toast({ title: "تمت الإضافة", description: "تم إضافة المسار ونقاط الصعود بنجاح" });
      }

      setFormData({ origin_city: "", destination_city: "", distance_km: "", estimated_duration_hours: "" });
      setNewStops([]);
      setEditingRoute(null);
      setIsAddDialogOpen(false);
      fetchRoutes();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewStop = () => {
    setNewStops([...newStops, { name: "", location: "", time: "" }]);
  };

  const updateNewStop = (index: number, field: 'name' | 'location' | 'time', value: string) => {
    const updated = [...newStops];
    updated[index][field] = value;
    setNewStops(updated);
  };

  const removeNewStop = (index: number) => {
    setNewStops(newStops.filter((_, i) => i !== index));
  };

  const handleEdit = (route: RouteRecord) => {
    setEditingRoute(route);
    setFormData({
      origin_city: route.origin_city,
      destination_city: route.destination_city,
      distance_km: route.distance_km?.toString() || "",
      estimated_duration_hours: route.estimated_duration_hours?.toString() || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('routes').delete().eq('route_id', deleteId);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحذف", description: "تم حذف المسار بنجاح" });
        fetchRoutes();
      }
      setDeleteId(null);
    }
  };

  const handleAddStop = async () => {
    if (!stopFormData.stop_name || !selectedRouteForStop) {
      toast({ title: "خطأ", description: "يرجى ملء اسم المحطة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const currentStops = routeStops[selectedRouteForStop] || [];
    const nextOrder = currentStops.length + 1;

    const { error } = await supabase
      .from('route_stops')
      .insert({
        route_id: selectedRouteForStop,
        stop_name: stopFormData.stop_name,
        stop_location: stopFormData.stop_location || null,
        stop_order: nextOrder,
        preparation_time: stopFormData.preparation_time || null
      });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تمت الإضافة", description: "تم إضافة نقطة الصعود بنجاح" });
      setStopFormData({ stop_name: "", stop_location: "", preparation_time: "" });
      setIsAddStopDialogOpen(false);
      fetchRoutes();
    }
    setIsSubmitting(false);
  };

  const handleDeleteStop = async (stopId: number) => {
    const { error } = await supabase.from('route_stops').delete().eq('stop_id', stopId);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الحذف", description: "تم حذف نقطة الصعود" });
      fetchRoutes();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
            <p className="text-xs text-sidebar-foreground/60">{partner?.company_name || "شركتي"}</p>
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
              <h1 className="text-xl font-bold text-foreground">إدارة المسارات</h1>
              <p className="text-sm text-muted-foreground">إضافة وإدارة مسارات الرحلات ونقاط الصعود</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRoute(null);
                  setFormData({ origin_city: "", destination_city: "", distance_km: "", estimated_duration_hours: "" });
                }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مسار
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRoute ? "تعديل المسار" : "إضافة مسار جديد"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>مدينة الانطلاق *</Label>
                      <Input 
                        placeholder="تعز"
                        value={formData.origin_city}
                        onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مدينة الوصول *</Label>
                      <Input 
                        placeholder="الرياض"
                        value={formData.destination_city}
                        onChange={(e) => setFormData({...formData, destination_city: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المسافة (كم)</Label>
                      <Input 
                        type="number"
                        placeholder="950"
                        value={formData.distance_km}
                        onChange={(e) => setFormData({...formData, distance_km: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المدة (ساعات)</Label>
                      <Input 
                        type="number"
                        step="0.5"
                        placeholder="6"
                        value={formData.estimated_duration_hours}
                        onChange={(e) => setFormData({...formData, estimated_duration_hours: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  {/* نقاط الصعود */}
                  {!editingRoute && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">نقاط الصعود</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addNewStop}>
                          <Plus className="w-4 h-4 ml-1" />
                          إضافة نقطة
                        </Button>
                      </div>
                      
                      {newStops.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                          لا توجد نقاط صعود. اضغط "إضافة نقطة" لإضافة محطات على المسار
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {newStops.map((stop, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mt-1">
                                {index + 1}
                              </div>
                              <div className="flex-1 space-y-2">
                                <Input
                                  placeholder="اسم نقطة الصعود (مثال: تعز، إب، صنعاء)"
                                  value={stop.name}
                                  onChange={(e) => updateNewStop(index, 'name', e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="الموقع (اختياري)"
                                    value={stop.location}
                                    onChange={(e) => updateNewStop(index, 'location', e.target.value)}
                                  />
                                  <Input
                                    type="time"
                                    placeholder="وقت الاستعداد"
                                    value={stop.time}
                                    onChange={(e) => updateNewStop(index, 'time', e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeNewStop(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                      {editingRoute ? "حفظ التغييرات" : "إضافة المسار"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setNewStops([]);
                    }}>
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
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.values(routeStops).flat().length}
                  </p>
                  <p className="text-sm text-muted-foreground">نقاط الصعود</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {routes.reduce((acc, r) => acc + (r.distance_km || 0), 0)} كم
                  </p>
                  <p className="text-sm text-muted-foreground">إجمالي المسافات</p>
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

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
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
          {!loading && routes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Route className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مسارات</h3>
              <p className="text-muted-foreground mb-4">ابدأ بإضافة مسار جديد</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة مسار
              </Button>
            </div>
          )}

          {/* Routes List */}
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div key={route.route_id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Route Header */}
                <div className="p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                          <Route className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">
                            {route.origin_city} - {route.destination_city}
                          </h3>
                        </div>
                      </div>

                      {/* Route Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{route.origin_city}</span>
                          <span className="text-muted-foreground">←</span>
                          <span className="text-foreground">{route.destination_city}</span>
                        </div>
                        {route.distance_km && route.distance_km > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Navigation className="w-4 h-4" />
                            <span>{route.distance_km} كم</span>
                          </div>
                        )}
                        {route.estimated_duration_hours && route.estimated_duration_hours > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{route.estimated_duration_hours} ساعة</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          <span>{(routeStops[route.route_id] || []).length} محطات</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedRouteId(expandedRouteId === route.route_id ? null : route.route_id)}
                      >
                        {expandedRouteId === route.route_id ? (
                          <>
                            <ChevronUp className="w-4 h-4 ml-1" />
                            إخفاء المحطات
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 ml-1" />
                            عرض المحطات
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRouteForStop(route.route_id);
                          setIsAddStopDialogOpen(true);
                        }}
                      >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة محطة
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(route)}>
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(route.route_id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Route Stops */}
                {expandedRouteId === route.route_id && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      نقاط الصعود والنزول
                    </h4>
                    {(routeStops[route.route_id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        لا توجد محطات لهذا المسار
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(routeStops[route.route_id] || []).map((stop, index) => (
                          <div key={stop.stop_id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{stop.stop_name}</p>
                              {stop.stop_location && (
                                <p className="text-xs text-muted-foreground">{stop.stop_location}</p>
                              )}
                            </div>
                            {stop.preparation_time && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {stop.preparation_time}
                              </span>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDeleteStop(stop.stop_id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Stop Dialog */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة نقطة صعود</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>اسم المحطة *</Label>
              <Input 
                placeholder="مثال: محطة الرياض الرئيسية"
                value={stopFormData.stop_name}
                onChange={(e) => setStopFormData({...stopFormData, stop_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>الموقع التفصيلي</Label>
              <Input 
                placeholder="العنوان أو رابط الخريطة"
                value={stopFormData.stop_location}
                onChange={(e) => setStopFormData({...stopFormData, stop_location: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>وقت التجهيز</Label>
              <Input 
                type="time"
                value={stopFormData.preparation_time}
                onChange={(e) => setStopFormData({...stopFormData, preparation_time: e.target.value})}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddStop} className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                إضافة المحطة
              </Button>
              <Button variant="outline" onClick={() => setIsAddStopDialogOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المسار؟ سيتم حذف جميع نقاط الصعود المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoutesManagement;