import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MapPin,
    Edit,
    Trash2,
    MoreVertical,
    Clock,
    Navigation,
    Loader2,
    ChevronDown,
    ChevronUp,
    Map as MapIcon,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RouteRecord {
    route_id: number;
    partner_id: number | null;
    origin_city: string;
    destination_city: string;
    distance_km: number | null;
    estimated_duration_hours: number | null;
    created_at: string;
    partners?: {
        company_name: string;
    };
}

interface City {
    city_id: number;
    name_ar: string;
    name_en: string;
    code: string;
}

interface Partner {
    partner_id: number;
    company_name: string;
}

interface RouteStop {
    stop_id: number;
    route_id: number;
    stop_name: string;
    stop_location: string | null;
    stop_order: number;
    preparation_time: string | null;
}

const RoutesManagement = () => {
    const [routes, setRoutes] = useState<RouteRecord[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [routeStops, setRouteStops] = useState<Record<number, RouteStop[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteRecord | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        partner_id: "all",
        origin_city: "",
        destination_city: "",
        distance_km: "",
        estimated_duration_hours: "",
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Cities
            const { data: citiesData } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .order('name_ar');
            setCities(citiesData || []);

            // 2. Fetch Partners
            const { data: partnersData } = await supabase
                .from('partners')
                .select('partner_id, company_name')
                .order('company_name');
            setPartners(partnersData || []);

            // 3. Fetch Routes
            await fetchRoutes();
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error("حدث خطأ أثناء تحميل البيانات");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        const { data, error } = await supabase
            .from('routes')
            .select('*, partners(company_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching routes:', error);
            toast.error("فشل في تحميل المسارات");
        } else {
            setRoutes(data || []);
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
                        if (!stopsMap[stop.route_id]) stopsMap[stop.route_id] = [];
                        stopsMap[stop.route_id].push(stop);
                    });
                    setRouteStops(stopsMap);
                }
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.origin_city || !formData.destination_city) {
            toast.error("يرجى اختيار مدينة الانطلاق ومدينة الوصول");
            return;
        }

        setIsSubmitting(true);
        const routeData = {
            origin_city: formData.origin_city,
            destination_city: formData.destination_city,
            distance_km: Number(formData.distance_km) || null,
            estimated_duration_hours: Number(formData.estimated_duration_hours) || null,
            partner_id: formData.partner_id === "all" ? null : Number(formData.partner_id),
        };

        try {
            if (editingRoute) {
                const { error } = await supabase
                    .from('routes')
                    .update(routeData)
                    .eq('route_id', editingRoute.route_id);
                if (error) throw error;
                toast.success("تم تحديث المسار بنجاح");
            } else {
                const { error } = await supabase
                    .from('routes')
                    .insert(routeData);
                if (error) throw error;
                toast.success("تم إضافة المسار بنجاح");
            }

            setIsAddDialogOpen(false);
            resetForm();
            fetchRoutes();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingRoute(null);
        setFormData({
            partner_id: "all",
            origin_city: "",
            destination_city: "",
            distance_km: "",
            estimated_duration_hours: "",
        });
    };

    const handleEdit = (route: RouteRecord) => {
        setEditingRoute(route);
        setFormData({
            partner_id: route.partner_id?.toString() || "all",
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
                toast.error(error.message);
            } else {
                toast.success("تم حذف المسار بنجاح");
                fetchRoutes();
            }
            setDeleteId(null);
        }
    };

    const filteredRoutes = routes.filter(route =>
        route.origin_city?.includes(searchTerm) ||
        route.destination_city?.includes(searchTerm) ||
        route.partners?.company_name?.includes(searchTerm)
    );

    return (
        <AdminLayout
            title="إدارة المسارات"
            subtitle="إضافة وتعديل مسارات الرحلات ومحطاتها عبر النظام"
            actions={
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مسار
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingRoute ? "تعديل المسار" : "إضافة مسار جديد"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>الشركة المالكة (الشريك)</Label>
                                <Select
                                    value={formData.partner_id}
                                    onValueChange={(val) => setFormData({ ...formData, partner_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الشريك (أو اتركه عام)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">عام (بدون شريك محدد)</SelectItem>
                                        {partners.map(p => (
                                            <SelectItem key={p.partner_id} value={p.partner_id.toString()}>
                                                {p.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>من مدينة (الانطلاق)</Label>
                                    <Select
                                        value={formData.origin_city}
                                        onValueChange={(val) => setFormData({ ...formData, origin_city: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر مدينة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.map(c => (
                                                <SelectItem key={c.city_id} value={c.name_ar}>
                                                    {c.name_ar} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>إلى مدينة (الوصول)</Label>
                                    <Select
                                        value={formData.destination_city}
                                        onValueChange={(val) => setFormData({ ...formData, destination_city: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر مدينة" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.map(c => (
                                                <SelectItem key={c.city_id} value={c.name_ar}>
                                                    {c.name_ar} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>المسافة التقريبية (كم)</Label>
                                    <Input
                                        type="number"
                                        value={formData.distance_km}
                                        onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                                        placeholder="900"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>المدة المتوقعة (ساعات)</Label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={formData.estimated_duration_hours}
                                        onChange={(e) => setFormData({ ...formData, estimated_duration_hours: e.target.value })}
                                        placeholder="8"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                {editingRoute ? "حفظ التغييرات" : "إضافة المسار"}
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            }
        >
            <div className="space-y-6">
                <Card className="border-none shadow-sm bg-muted/50">
                    <CardContent className="p-4">
                        <div className="relative max-w-md">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن مدينة أو شريك..."
                                className="pr-10 bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                        <MapIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">لا توجد مسارات مطابقة</h3>
                        <p className="text-muted-foreground">ابدأ بإضافة مسار رحلة جديد لنظام الحجز</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRoutes.map(route => (
                            <Card key={route.route_id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                                <CardContent className="p-0">
                                    <div className="p-5">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <MapIcon className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-bold text-lg">{route.origin_city}</h3>
                                                            <Navigation className="w-4 h-4 text-muted-foreground" />
                                                            <h3 className="font-bold text-lg">{route.destination_city}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="font-normal text-xs">
                                                                <Building2 className="w-3 h-3 ml-1" />
                                                                {route.partners?.company_name || "مسار عام"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Navigation className="w-4 h-4" />
                                                        <span>{route.distance_km || "--"} كم</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{route.estimated_duration_hours || "--"} ساعة</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{(routeStops[route.route_id] || []).length} محطات توقف</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 lg:border-r lg:pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedRouteId(expandedRouteId === route.route_id ? null : route.route_id)}
                                                >
                                                    {expandedRouteId === route.route_id ? (
                                                        <><ChevronUp className="w-4 h-4 ml-1" /> إخفاء</>
                                                    ) : (
                                                        <><ChevronDown className="w-4 h-4 ml-1" /> المحطات</>
                                                    )}
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(route)}>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => setDeleteId(route.route_id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedRouteId === route.route_id && (
                                        <div className="bg-muted/30 border-t p-4 px-6 space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    النقاط والمحطات المرحلية
                                                </h4>
                                            </div>
                                            {(routeStops[route.route_id] || []).length === 0 ? (
                                                <p className="text-xs text-muted-foreground text-center py-2">لا توجد محطات مسجلة لهذا المسار</p>
                                            ) : (
                                                <div className="relative space-y-4 before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border mr-2">
                                                    {(routeStops[route.route_id] || []).map((stop, idx) => (
                                                        <div key={stop.stop_id} className="relative flex items-center gap-4 pr-7">
                                                            <div className="absolute right-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary z-10" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">{stop.stop_name}</p>
                                                                {stop.stop_location && <p className="text-xs text-muted-foreground">{stop.stop_location}</p>}
                                                            </div>
                                                            {stop.preparation_time && (
                                                                <Badge variant="outline" className="text-[10px] font-normal">
                                                                    {stop.preparation_time}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا المسار؟ سيتم حذف جميع المحطات المرتبطة به أيضاً.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            حذف المسار
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
};

export default RoutesManagement;
