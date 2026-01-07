import { useState, useEffect } from "react";
import {
    MapPin,
    Search,
    MoreVertical,
    Edit,
    CheckCircle2,
    XCircle,
    Loader2,
    Plus,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface City {
    city_id: number;
    name_ar: string;
    name_en: string | null;
    is_active: boolean;
    country_code: string;
    created_at: string;
}

const CityManagement = () => {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentCity, setCurrentCity] = useState<Partial<City>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('cities')
            .select('*')
            .order('name_ar');

        if (error) {
            console.error('Error fetching cities:', error);
            toast({
                title: "خطأ",
                description: "فشل في تحميل بيانات المدن",
                variant: "destructive"
            });
        } else {
            setCities(data || []);
        }
        setLoading(false);
    };

    const toggleCityStatus = async (cityId: number, currentStatus: boolean) => {
        const { error } = await supabase
            .from('cities')
            .update({ is_active: !currentStatus })
            .eq('city_id', cityId);

        if (error) {
            toast({
                title: "خطأ",
                description: "فشل في تحديث حالة المدينة",
                variant: "destructive"
            });
        } else {
            toast({
                title: "تم التحديث",
                description: `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} المدينة بنجاح`,
            });
            fetchCities();
        }
    };

    const deleteCity = async (cityId: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه المدينة؟ قد يؤثر ذلك على الرحلات المرتبطة بها.")) return;

        const { error } = await supabase
            .from('cities')
            .delete()
            .eq('city_id', cityId);

        if (error) {
            toast({
                title: "خطأ",
                description: "لا يمكن حذف المدينة لارتباطها ببيانات أخرى. يمكنك تعطيلها بدلاً من ذلك.",
                variant: "destructive"
            });
        } else {
            toast({
                title: "تم الحذف",
                description: "تم حذف المدينة بنجاح",
            });
            fetchCities();
        }
    };

    const openDialog = (city?: City) => {
        if (city) {
            setCurrentCity({ ...city });
        } else {
            setCurrentCity({
                name_ar: "",
                name_en: "",
                is_active: true,
                country_code: "YE"
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!currentCity.name_ar) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال اسم المدينة بالعربية",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name_ar: currentCity.name_ar,
                name_en: currentCity.name_en,
                is_active: currentCity.is_active ?? true,
                country_code: currentCity.country_code || "YE"
            };

            let error;
            if (currentCity.city_id) {
                const { error: updateError } = await supabase
                    .from('cities')
                    .update(payload)
                    .eq('city_id', currentCity.city_id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('cities')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "تم الحفظ",
                description: currentCity.city_id ? "تم تحديث بيانات المدينة" : "تم إضافة مدينة جديدة",
            });
            setIsDialogOpen(false);
            fetchCities();
        } catch (error: any) {
            console.error('Error saving city:', error);
            toast({
                title: "خطأ",
                description: "اسم المدينة موجود بالفعل أو حدث خطأ في النظام",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCities = cities.filter(c =>
        c.name_ar.includes(searchQuery) ||
        (c.name_en?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-muted/30">
            <AdminSidebar />
            <main className="lg:mr-64 p-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">إدارة المدن</h1>
                        <p className="text-muted-foreground">التحكم في المدن المتاحة في نظام الحجز</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث عن مدينة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-9 w-64"
                            />
                        </div>

                        <Button onClick={() => openDialog()}>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مدينة
                        </Button>
                    </div>
                </header>

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">المدينة (بالعربية)</TableHead>
                                    <TableHead className="text-right">City (English)</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">تاريخ الإضافة</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            لا توجد مدن مسجلة حالياً
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCities.map((city) => (
                                        <TableRow key={city.city_id}>
                                            <TableCell className="font-medium">{city.name_ar}</TableCell>
                                            <TableCell>{city.name_en || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={city.is_active}
                                                        onCheckedChange={() => toggleCityStatus(city.city_id, city.is_active)}
                                                    />
                                                    {city.is_active ? (
                                                        <span className="text-xs text-green-600 font-medium">نشط</span>
                                                    ) : (
                                                        <span className="text-xs text-red-600 font-medium">معطل</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground" dir="ltr">
                                                {new Date(city.created_at).toLocaleDateString('ar-SA')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openDialog(city)}>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => deleteCity(city.city_id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 ml-2" /> حذف
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{currentCity.city_id ? "تعديل مدينة" : "إضافة مدينة جديدة"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name_ar">اسم المدينة بالعربية</Label>
                                <Input
                                    id="name_ar"
                                    value={currentCity.name_ar}
                                    onChange={(e) => setCurrentCity({ ...currentCity, name_ar: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name_en">City Name (English)</Label>
                                <Input
                                    id="name_en"
                                    value={currentCity.name_en || ""}
                                    onChange={(e) => setCurrentCity({ ...currentCity, name_en: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={currentCity.is_active}
                                    onCheckedChange={(checked) => setCurrentCity({ ...currentCity, is_active: checked })}
                                />
                                <Label htmlFor="is_active">تفعيل المدينة</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default CityManagement;
