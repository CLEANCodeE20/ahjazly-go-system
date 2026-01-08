import { useState, useEffect } from "react";
import {
    MapPin,
    Search,
    Plus,
    Trash2,
    Loader2,
    Building2,
    Bus,
    Edit,
    Save,
    X,
    CheckCircle2,
    MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth"; // Assuming useAuth is needed, though not directly used in the provided snippet

interface City {
    id: string;
    name_ar: string;
    name_en: string;
    region: string;
    is_active: boolean;
    code: string;
    created_at?: string;
}

const CityManagement = () => {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    // Form State
    const [cityNameAr, setCityNameAr] = useState("");
    const [cityNameEn, setCityNameEn] = useState("");
    const [cityRegion, setCityRegion] = useState("");
    const [cityCode, setCityCode] = useState("");
    const [cityActive, setCityActive] = useState(true);

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [cityToDelete, setCityToDelete] = useState<City | null>(null);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .order('name_ar');

            if (error) throw error;
            setCities(data || []);
        } catch (error) {
            console.error('Error fetching cities:', error);
            toast({
                title: "خطأ",
                description: "فشل في جلب قائمة المدن",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddCity = async () => {
        if (!cityNameAr || !cityNameEn || !cityRegion || !cityCode) {
            toast({
                title: "حقول ناقصة",
                description: "يرجى ملء جميع الحقول المطلوبة",
                variant: "destructive",
            });
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('cities')
                .insert([{
                    name_ar: cityNameAr,
                    name_en: cityNameEn,
                    region: cityRegion,
                    code: cityCode,
                    is_active: cityActive
                }]);

            if (error) throw error;

            toast({
                title: "تمت الإضافة",
                description: "تم إضافة المدينة بنجاح",
            });

            setIsAddOpen(false);
            resetForm();
            fetchCities();
        } catch (error: any) {
            console.error('Error adding city:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في إضافة المدينة",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleEditCity = async () => {
        if (!selectedCity || !cityNameAr || !cityNameEn || !cityRegion || !cityCode) return;

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('cities')
                .update({
                    name_ar: cityNameAr,
                    name_en: cityNameEn,
                    region: cityRegion,
                    code: cityCode,
                    is_active: cityActive
                })
                .eq('id', selectedCity.id);

            if (error) throw error;

            toast({
                title: "تم التحديث",
                description: "تم تحديث بيانات المدينة بنجاح",
            });

            setIsEditOpen(false);
            resetForm();
            fetchCities();
        } catch (error: any) {
            console.error('Error updating city:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في تحديث المدينة",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteCity = async () => {
        if (!cityToDelete) return;

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('cities')
                .delete()
                .eq('id', cityToDelete.id);

            if (error) throw error;

            toast({
                title: "تم الحذف",
                description: "تم حذف المدينة بنجاح",
            });

            setDeleteDialogOpen(false);
            fetchCities();
        } catch (error: any) {
            console.error('Error deleting city:', error);
            toast({
                title: "خطأ",
                description: error.message || "فشل في حذف المدينة",
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    const openEditDialog = (city: City) => {
        setSelectedCity(city);
        setCityNameAr(city.name_ar);
        setCityNameEn(city.name_en);
        setCityRegion(city.region);
        setCityCode(city.code);
        setCityActive(city.is_active);
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setCityNameAr("");
        setCityNameEn("");
        setCityRegion("");
        setCityCode("");
        setCityActive(true);
        setSelectedCity(null);
    };

    const filteredCities = cities.filter(city =>
        city.name_ar.includes(searchQuery) ||
        city.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout
            title="إدارة المدن"
            actions={
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة مدينة
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة مدينة جديدة</DialogTitle>
                            <DialogDescription>
                                أدخل تفاصيل المدينة الجديدة لإضافتها للنظام
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name_ar">الاسم بالعربية</Label>
                                    <Input id="name_ar" value={cityNameAr} onChange={(e) => setCityNameAr(e.target.value)} placeholder="الرياض" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
                                    <Input id="name_en" value={cityNameEn} onChange={(e) => setCityNameEn(e.target.value)} placeholder="Riyadh" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">الكود</Label>
                                    <Input id="code" value={cityCode} onChange={(e) => setCityCode(e.target.value)} placeholder="RUH" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="region">المنطقة</Label>
                                    <Input id="region" value={cityRegion} onChange={(e) => setCityRegion(e.target.value)} placeholder="المنطقة الوسطى" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={cityActive}
                                    onChange={(e) => setCityActive(e.target.checked)}
                                />
                                <Label htmlFor="active">مدينة نشطة</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
                            <Button onClick={handleAddCity} disabled={processing}>
                                {processing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                                حفظ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            }
        >
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن مدينة..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-full md:w-1/3"
                    />
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الاسم</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الرمز</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المنطقة</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                            لا توجد مدن مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCities.map((city) => (
                                        <tr key={city.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{city.name_ar}</p>
                                                        <p className="text-xs text-muted-foreground">{city.name_en}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-sm">{city.code}</td>
                                            <td className="py-3 px-4">{city.region}</td>
                                            <td className="py-3 px-4">
                                                {city.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                                        <CheckCircle2 className="w-3 h-3" /> نشط
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                                                        <X className="w-3 h-3" /> غير نشط
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(city)}>
                                                        <Edit className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setCityToDelete(city);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات المدينة</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_name_ar">الاسم بالعربية</Label>
                                <Input id="edit_name_ar" value={cityNameAr} onChange={(e) => setCityNameAr(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_name_en">الاسم بالإنجليزية</Label>
                                <Input id="edit_name_en" value={cityNameEn} onChange={(e) => setCityNameEn(e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit_code">الكود</Label>
                                <Input id="edit_code" value={cityCode} onChange={(e) => setCityCode(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_region">المنطقة</Label>
                                <Input id="edit_region" value={cityRegion} onChange={(e) => setCityRegion(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="checkbox"
                                id="edit_active"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={cityActive}
                                onChange={(e) => setCityActive(e.target.checked)}
                            />
                            <Label htmlFor="edit_active">مدينة نشطة</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                        <Button onClick={handleEditCity} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                            حفظ التغييرات
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد الحذف</DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من رغبتك في حذف مدينة {cityToDelete?.name_ar}؟ لا يمكن التراجع عن هذا الإجراء
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
                        <Button variant="destructive" onClick={handleDeleteCity} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}
                            حذف
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default CityManagement;

