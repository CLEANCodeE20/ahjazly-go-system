import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Route,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Printer,
  Ban
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
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCancellationPolicies } from "@/hooks/useCancellationPolicies";
import TripManifest from "@/components/TripManifest";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import TripSeatManager from "@/components/dashboard/TripSeatManager";
import { TripsSkeleton } from "@/components/ui/TripsSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import TripAutomationMonitor from "@/components/dashboard/TripAutomationMonitor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

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
  cancel_policy_id?: number | null;
  linked_trip_id?: number | null;
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
  const { partner, partnerId } = usePartner();

  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const { data: policies = [] } = useCancellationPolicies(partnerId || undefined);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { exportToExcel, exportToPDF } = useExport();
  const manifestRef = useRef<HTMLDivElement>(null);
  const [selectedTripForManifest, setSelectedTripForManifest] = useState<TripRecord | null>(null);
  const [tripPassengers, setTripPassengers] = useState<any[]>([]);
  const [showManifestDialog, setShowManifestDialog] = useState(false);
  const [showSeatManager, setShowSeatManager] = useState(false);
  const [selectedTripForSeats, setSelectedTripForSeats] = useState<TripRecord | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("trips");
  const [formData, setFormData] = useState({
    route_id: "",
    bus_id: "",
    driver_id: "",
    departure_time: "",
    arrival_time: "",
    base_price: "",
    cancel_policy_id: "",
    linked_trip_id: ""
  });

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  const fetchData = async () => {
    if (!partnerId) return;
    setLoading(true);

    const [tripsRes, routesRes, busesRes, driversRes] = await Promise.all([
      supabase.from('trips')
        .select('*')
        .eq('partner_id', partnerId)
        .order('departure_time', { ascending: false }),
      supabase.from('routes')
        .select('route_id, origin_city, destination_city')
        .eq('partner_id', partnerId),
      supabase.from('buses')
        .select('bus_id, license_plate, capacity, model')
        .eq('partner_id', partnerId),
      supabase.from('drivers')
        .select('driver_id, full_name, phone_number')
        .eq('partner_id', partnerId)
    ]);

    if (!tripsRes.error) setTrips(tripsRes.data || []);
    if (!routesRes.error) setRoutes(routesRes.data || []);
    if (!busesRes.error) setBuses(busesRes.data || []);
    if (!driversRes.error) setDrivers(driversRes.data || []);

    setLoading(false);
  };

  const handlePrintManifest = useReactToPrint({
    contentRef: manifestRef,
    documentTitle: `كشف-ركاب-${selectedTripForManifest?.trip_id}`,
  });

  const fetchTripPassengers = async (tripId: number) => {
    setIsDataLoading(true);
    try {
      const { data: bookingsData, error: bError } = await supabase
        .from('bookings')
        .select(`
          booking_id,
          booking_status,
          payment_status,
          passengers (
            full_name,
            phone_number,
            seat_id,
            seats (
              seat_number
            )
          )
        `)
        .eq('trip_id', tripId)
        .neq('booking_status', 'cancelled');

      if (bError) throw bError;

      const manifest: any[] = [];
      bookingsData?.forEach((b: any) => {
        if (b.passengers && Array.isArray(b.passengers)) {
          b.passengers.forEach((p: any) => {
            manifest.push({
              name: p.full_name,
              phone: p.phone_number,
              // Try to get seat_number from the joined seats table
              seat_number: p.seats?.seat_number || p.seat_id || '-',
              status: b.booking_status,
              payment: b.payment_status
            });
          });
        }
      });

      setTripPassengers(manifest);
    } catch (error: any) {
      toast({ title: "خطأ", description: "فشل جلب قائمة الركاب", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleOpenManifest = async (trip: TripRecord) => {
    setSelectedTripForManifest(trip);
    await fetchTripPassengers(trip.trip_id);
    setShowManifestDialog(true);
  };

  const handleOpenSeatManager = (trip: TripRecord) => {
    setSelectedTripForSeats(trip);
    setShowSeatManager(true);
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
      cancel_policy_id: formData.cancel_policy_id && formData.cancel_policy_id !== "none" ? parseInt(formData.cancel_policy_id) : (policies.find(p => p.is_default)?.cancel_policy_id || null),
      linked_trip_id: formData.linked_trip_id && formData.linked_trip_id !== "none" ? parseInt(formData.linked_trip_id) : null,
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
      base_price: trip.base_price?.toString() || "",
      cancel_policy_id: trip.cancel_policy_id?.toString() || "",
      linked_trip_id: trip.linked_trip_id?.toString() || ""
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
    try {
      if (newStatus === 'cancelled') {
        const { data, error } = await (supabase.rpc as any)('request_trip_cancellation', {
          p_trip_id: tripId,
          p_reason: 'إلغاء من قبل الشركة الناقلة'
        });

        if (error) throw error;

        if (data.action === 'pending_approval') {
          toast({
            title: "طلب قيد المراجعة",
            description: `نظراً لوجود ${data.passengers} راكب، تم إرسال طلب الإلغاء للمدير العام للموافقة.`,
          });
        } else {
          toast({ title: "تم الإلغاء", description: "تم إلغاء الرحلة وتحرير المقاعد آلياً." });
        }
      } else {
        const { error } = await supabase
          .from('trips')
          .update({ status: newStatus })
          .eq('trip_id', tripId);

        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث حالة الرحلة" });
      }
      fetchData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      route_id: "",
      bus_id: "",
      driver_id: "",
      departure_time: "",
      arrival_time: "",
      base_price: "",
      cancel_policy_id: policies.find(p => p.is_default)?.cancel_policy_id?.toString() || "",
      linked_trip_id: ""
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

  const getPolicyInfo = (policyId: number | null) => {
    if (!policyId) return 'استرداد كامل (بدون سياسة)';
    const policy = policies.find(p => p.cancel_policy_id === policyId);
    return policy ? policy.policy_name : 'غير محدد';
  };

  const filteredTrips = trips.filter(trip => {
    const routeInfo = getRouteInfo(trip.route_id);
    const matchesSearch = routeInfo.includes(searchQuery) || getBusInfo(trip.bus_id).includes(searchQuery);
    const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-SA');
  const calculateDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ar-SA');
  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string | null) => {
    const styles = {
      scheduled: "bg-muted text-muted-foreground",
      in_progress: "bg-primary/10 text-primary",
      completed: "bg-secondary/10 text-secondary",
      cancelled: "bg-destructive/10 text-destructive",
      delayed: "bg-accent/10 text-accent",
      pending_cancellation: "bg-orange-100 text-orange-700 font-bold animate-pulse"
    };
    const labels = {
      scheduled: "مجدولة",
      in_progress: "جارية",
      completed: "مكتملة",
      cancelled: "ملغية",
      delayed: "متأخرة",
      pending_cancellation: "إلغاء قيد المراجعة"
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.scheduled}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    const dataToExport = filteredTrips.map(t => ({
      "المسار": getRouteInfo(t.route_id),
      "التاريخ": formatDate(t.departure_time),
      "وقت المغادرة": formatTime(t.departure_time),
      "الحافلة": getBusInfo(t.bus_id),
      "السائق": getDriverInfo(t.driver_id),
      "سياسة الإلغاء": getPolicyInfo(t.cancel_policy_id),
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
        { header: "سياسة الإلغاء", key: "سياسة الإلغاء" },
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
    <DashboardLayout
      title="إدارة الرحلات"
      subtitle="إنشاء وإدارة رحلات الشركة"
      actions={
        <div className="flex items-center gap-2">
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

                <div className="space-y-2">
                  <Label>سياسة الإلغاء</Label>
                  <Select value={formData.cancel_policy_id} onValueChange={(v) => setFormData({ ...formData, cancel_policy_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر سياسة الإلغاء" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون سياسة (استرداد كامل)</SelectItem>
                      {policies.map((policy) => (
                        <SelectItem key={policy.cancel_policy_id} value={policy.cancel_policy_id.toString()}>
                          {policy.policy_name} {policy.is_default && "(الافتراضية)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ربط مع رحلة أخرى (اختياري)</Label>
                  <Select value={formData.linked_trip_id} onValueChange={(v) => setFormData({ ...formData, linked_trip_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر رحلة للربط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون ربط</SelectItem>
                      {trips.filter(t => t.trip_id !== editingTrip?.trip_id).map((trip) => (
                        <SelectItem key={trip.trip_id} value={trip.trip_id.toString()}>
                          #{trip.trip_id} - {getRouteInfo(trip.route_id)} ({formatDate(trip.departure_time)})
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
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="trips" className="gap-2">
            <Route className="w-4 h-4" />
            إدارة الرحلات
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Activity className="w-4 h-4" />
            المراقبة التلقائية
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
          <div className="bg-card rounded-xl border border-border p-4">
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
          {loading && <TripsSkeleton />}

          {/* Empty State */}
          {!loading && trips.length === 0 && (
            <EmptyState
              icon={Route}
              title="لا توجد رحلات"
              description="لم تقم بإضافة أي رحلات بعد. ابدأ بإنشاء جدول رحلاتك الآن."
              actionLabel="رحلة جديدة"
              onAction={() => setIsDialogOpen(true)}
            />
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
                          {trip.linked_trip_id && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                              رحلة مترابطة #{trip.linked_trip_id}
                            </span>
                          )}
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
                      <p className="text-xs text-muted-foreground mb-1">سياسة الإلغاء</p>
                      <p className="font-medium text-foreground text-sm truncate max-w-[120px]">{getPolicyInfo(trip.cancel_policy_id)}</p>
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
                        <DropdownMenuItem onClick={() => handleOpenManifest(trip)}>
                          <Users className="w-4 h-4 ml-2" />
                          كشف الركاب
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenSeatManager(trip)}>
                          <Ban className="w-4 h-4 ml-2 text-red-600" />
                          إدارة المقاعد
                        </DropdownMenuItem>
                        {trip.status === 'scheduled' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(trip.trip_id, 'in_progress')}>
                              <PlayCircle className="w-4 h-4 ml-2" />
                              بدء الرحلة
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(trip.trip_id, 'completed')} className="text-green-600">
                              <CheckCircle2 className="w-4 h-4 ml-2" />
                              إكمال الرحلة مباشرة
                            </DropdownMenuItem>
                          </>
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
        </TabsContent>

        <TabsContent value="monitoring">
          <TripAutomationMonitor />
        </TabsContent>
      </Tabs>

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

      {/* Manifest Dialog */}
      <Dialog open={showManifestDialog} onOpenChange={setShowManifestDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>كشف ركاب الرحلة</DialogTitle>
          </DialogHeader>
          {isDataLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedTripForManifest && (
            <>
              <TripManifest
                ref={manifestRef}
                companyName={partner?.company_name}
                logoUrl={undefined}
                trip={{
                  trip_id: selectedTripForManifest.trip_id,
                  origin: routes.find(r => r.route_id === selectedTripForManifest.route_id)?.origin_city || 'غير محدد',
                  destination: routes.find(r => r.route_id === selectedTripForManifest.route_id)?.destination_city || 'غير محدد',
                  date: formatDate(selectedTripForManifest.departure_time),
                  time: formatTime(selectedTripForManifest.departure_time),
                  bus: getBusInfo(selectedTripForManifest.bus_id),
                  driver: getDriverInfo(selectedTripForManifest.driver_id)
                }}
                passengers={tripPassengers}
              />
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" onClick={() => handlePrintManifest()}>
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة الكشف
                </Button>
                <Button variant="outline" onClick={() => setShowManifestDialog(false)}>
                  إغلاق
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Seat Manager Dialog */}
      {selectedTripForSeats && (
        <TripSeatManager
          isOpen={showSeatManager}
          onClose={() => setShowSeatManager(false)}
          tripId={selectedTripForSeats.trip_id}
          busId={selectedTripForSeats.bus_id}
          routeInfo={getRouteInfo(selectedTripForSeats.route_id) + " - " + calculateDate(selectedTripForSeats.departure_time)}
        />
      )}
    </DashboardLayout>
  );
};

export default TripsManagement;