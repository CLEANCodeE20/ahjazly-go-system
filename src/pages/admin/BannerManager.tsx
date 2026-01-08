import { useState, useEffect } from "react";
import {
    Image as ImageIcon,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    GripVertical,
    ExternalLink,
    Upload
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface Banner {
    id: number;
    title: string;
    image_url: string;
    target_url: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
}

const BannerManager = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Partial<Banner>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching banners:', error);
            toast.error("فشل في تحميل صور السلايدر");
        } else {
            setBanners(data as Banner[] || []);
        }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('app-assets')
                .getPublicUrl(filePath);

            setCurrentBanner({ ...currentBanner, image_url: publicUrl });
            toast.success("تم رفع الصورة بنجاح");
        } catch (error: any) {
            toast.error("فشل في رفع الصورة");
            console.error("Upload Error Detail:", error);
            if (error.status === 404) {
                console.error("Bucket 'app-assets' not found. Ensure migration 20260107000003 is applied.");
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!currentBanner.image_url) {
            toast.error("يرجى رفع صورة أولاً");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title: currentBanner.title || '',
                image_url: currentBanner.image_url,
                target_url: currentBanner.target_url || '',
                display_order: currentBanner.display_order || 0,
                is_active: currentBanner.is_active ?? true
            };

            let error;
            if (currentBanner.id) {
                const res = await supabase
                    .from('banners')
                    .update(payload)
                    .eq('id', currentBanner.id);
                error = res.error;
            } else {
                const res = await supabase
                    .from('banners')
                    .insert([payload]);
                error = res.error;
            }

            if (error) throw error;

            toast.success("تم الحفظ بنجاح");
            setIsEditorOpen(false);
            fetchBanners();
        } catch (error: any) {
            toast.error("فشل في الحفظ");
            console.error("Save Banner Error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه الصورة من السلايدر؟")) return;

        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error("فشل في الحذف");
        } else {
            toast.success("تم حذف الصورة بنجاح");
            fetchBanners();
        }
    };

    const openEditor = (banner?: Banner) => {
        if (banner) {
            setCurrentBanner({ ...banner });
        } else {
            setCurrentBanner({
                title: "",
                image_url: "",
                target_url: "",
                display_order: banners.length,
                is_active: true
            });
        }
        setIsEditorOpen(true);
    };

    return (
        <AdminLayout
            title="إدارة السلايدر الإعلاني"
            subtitle="التحكم في الصور والعروض المتحركة في واجهة التطبيق الرئيسية"
            actions={
                <Button onClick={() => openEditor()}>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة إعلان جديد
                </Button>
            }
        >
            <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead className="text-right">الصورة</TableHead>
                                    <TableHead className="text-right">العنوان</TableHead>
                                    <TableHead className="text-right">الترتيب</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            لا توجد صور مضافة للسلايدر حالياً
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    banners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell><GripVertical className="w-4 h-4 text-muted-foreground/30" /></TableCell>
                                            <TableCell>
                                                <div className="w-20 h-10 rounded overflow-hidden border bg-muted">
                                                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{banner.title || "بدون عنوان"}</TableCell>
                                            <TableCell>{banner.display_order}</TableCell>
                                            <TableCell>
                                                {banner.is_active ? (
                                                    <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> نشط</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> معطل</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditor(banner)}>
                                                            <Edit className="w-4 h-4 ml-2" /> تعديل
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(banner.id)}>
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

                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{currentBanner.id ? "تعديل الإعلان" : "إضافة إعلان جديد"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-4">
                                <Label>صورة الإعلان</Label>
                                <div className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-muted/30">
                                    {currentBanner.image_url ? (
                                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm">
                                            <img src={currentBanner.image_url} className="w-full h-full object-cover" />
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => setCurrentBanner({ ...currentBanner, image_url: "" })}
                                            >
                                                إزالة
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium">اسحب الصورة هنا أو اضغط للرفع</p>
                                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG حتى 5 ميجابايت</p>
                                            </div>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="banner-upload"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <Button asChild disabled={uploading} variant="outline" size="sm">
                                                <label htmlFor="banner-upload">
                                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                                                    اختيار ملف
                                                </label>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>عنوان الإعلان (اختياري)</Label>
                                    <Input
                                        value={currentBanner.title || ""}
                                        onChange={(e) => setCurrentBanner({ ...currentBanner, title: e.target.value })}
                                        placeholder="مثال: خصم الصيف..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ترتيب العرض</Label>
                                    <Input
                                        type="number"
                                        value={currentBanner.display_order ?? 0}
                                        onChange={(e) => setCurrentBanner({ ...currentBanner, display_order: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>رابط التوجيه (اختياري)</Label>
                                <Input
                                    value={currentBanner.target_url || ""}
                                    onChange={(e) => setCurrentBanner({ ...currentBanner, target_url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={currentBanner.is_active ?? true}
                                    onCheckedChange={(val) => setCurrentBanner({ ...currentBanner, is_active: val })}
                                />
                                <Label>تفعيل الإعلان (يظهر في السلايدر)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>إلغاء</Button>
                            <Button onClick={handleSave} disabled={isSaving || uploading}>
                                {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                حفظ
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};
export default BannerManager;
