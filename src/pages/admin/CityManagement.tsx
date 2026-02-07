import { useState, useEffect } from "react";
import {
    MapPin,
    Search,
    Plus,
    Loader2,
    Edit,
    Trash2,
    CheckCircle,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface City {
    city_id: number;
    name_ar: string;
    name_en: string;
    code: string;
    region?: string;
    is_active: boolean;
    display_order?: number;
}

const CityManagement = () => {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<City | null>(null);
    const [formData, setFormData] = useState<Partial<City>>({
        name_ar: "",
        name_en: "",
        code: "",
        is_active: true
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cities')
                .select('*')
                .order('display_order', { ascending: true })
                .order('name_ar', { ascending: true });

            if (error) throw error;
            setCities(data || []);
        } catch (error) {
            console.error('Error fetching cities:', error);
            toast.error("فشل في تحميل قائمة المدن");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name_ar || !formData.name_en || !formData.code) {
            toast.error("يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        setSubmitting(true);
        try {
            if (editingCity) {
                // Update
                const { error } = await supabase
                    .from('cities')
                    .update({
                        name_ar: formData.name_ar,
                        name_en: formData.name_en,
                        code: formData.code,
                        is_active: formData.is_active
                    })
                    .eq('city_id', editingCity.city_id);

                if (error) throw error;
                toast.success("تم تحديث المدينة بنجاح");
            } else {
                // Insert
                const { error } = await supabase
                    .from('cities')
                    .insert([{
                        name_ar: formData.name_ar,
                        name_en: formData.name_en,
                        code: formData.code,
                        is_active: formData.is_active
                    }]);

                if (error) throw error;
                toast.success("تم إضافة المدينة بنجاح");
            }

            setIsDialogOpen(false);
            setEditingCity(null);
            fetchCities();
        } catch (error: any) {
            console.error('Error saving city:', error);
            toast.error(error.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه المدينة؟")) return;

        try {
            const { error } = await supabase
                .from('cities')
                .delete()
                .eq('city_id', id);

            if (error) throw error;
            toast.success("تم حذف المدينة بنجاح");
            fetchCities();
        } catch (error) {
            console.error('Error deleting city:', error);
            toast.error("لا يمكن حذف المدينة (قد تكون مرتبطة بمسارات أو حجوزات)");
        }
    };

    const openAddDialog = () => {
        setEditingCity(null);
        setFormData({ name_ar: "", name_en: "", code: "", is_active: true });
        setIsDialogOpen(true);
    };

    const openEditDialog = (city: City) => {
        setEditingCity(city);
        setFormData({ ...city });
        setIsDialogOpen(true);
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
                <Button onClick={openAddDialog}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة مدينة
                </Button>
            }
        >
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="بحث عن مدينة (بالاسم أو الرمز)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 w-full md:w-1/3"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        قائمة المدن
                    </CardTitle>
                    <CardDescription>
                        إدارة المدن والمحطات الرئيسية للنظام ({filteredCities.length})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredCities.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            لا توجد مدن مضافة حالياً
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="py-3 px-4 text-right">الاسم بالعربية</th>
                                        <th className="py-3 px-4 text-right">الاسم بالإنجليزية</th>
                                        <th className="py-3 px-4 text-right">الرمز (Code)</th>
                                        <th className="py-3 px-4 text-right">الحالة</th>
                                        <th className="py-3 px-4 text-left">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCities.map((city) => (
                                        <tr key={city.city_id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="py-3 px-4 font-medium">{city.name_ar}</td>
                                            <td className="py-3 px-4">{city.name_en}</td>
                                            <td className="py-3 px-4"><Badge variant="outline" className="font-mono">{city.code}</Badge></td>
                                            <td className="py-3 px-4">
                                                {city.is_active ?
                                                    <span className="flex items-center text-green-600 gap-1 text-xs"><CheckCircle className="w-3 h-3" /> مفعل</span> :
                                                    <span className="flex items-center text-red-500 gap-1 text-xs"><XCircle className="w-3 h-3" /> معطل</span>
                                                }
                                            </td>
                                            <td className="py-3 px-4 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(city)}>
                                                        <Edit className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(city.city_id)}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCity ? "تعديل بيانات مدينة" : "إضافة مدينة جديدة"}</DialogTitle>
                        <DialogDescription>
                            أدخل تفاصيل المدينة أدناه. الرمز (Code) يستخدم في التذاكر والحجوزات.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الاسم بالعربية</Label>
                                <Input
                                    placeholder="الرياض"
                                    value={formData.name_ar}
                                    onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الاسم بالإنجليزية</Label>
                                <Input
                                    placeholder="Riyadh"
                                    value={formData.name_en}
                                    onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                                    className="dir-ltr"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الرمز (Code)</Label>
                                <Input
                                    placeholder="RUH"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="uppercase font-mono"
                                    maxLength={5}
                                />
                            </div>
                            <div className="flex items-center justify-between border rounded-lg p-3">
                                <Label>حالة المدينة</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.is_active}
                                        onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <span className="text-xs text-muted-foreground">{formData.is_active ? "نشط" : "غير نشط"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            حفظ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default CityManagement;
