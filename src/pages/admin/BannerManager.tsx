import { useState, useEffect } from "react";
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Save,
    Loader2,
    MoreVertical,
    ExternalLink,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [title, setTitle] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [displayOrder, setDisplayOrder] = useState("0");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل تحميل البنرات",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleImageUpload = async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('app-assets')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('app-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            toast({
                variant: "destructive",
                title: "تنبيه",
                description: "يرجى اختيار صورة للبنر",
            });
            return;
        }

        try {
            setUploading(true);
            const imageUrl = await handleImageUpload(imageFile);

            const { error } = await supabase
                .from('banners')
                .insert({
                    title,
                    target_url: targetUrl,
                    display_order: parseInt(displayOrder) || 0,
                    image_url: imageUrl,
                    is_active: true
                });

            if (error) throw error;

            toast({
                title: "تمت الإضافة",
                description: "تم إضافة البنر بنجاح",
            });

            setIsDialogOpen(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error('Error adding banner:', error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل إضافة البنر",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذا البنر؟")) return;

        try {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setBanners(banners.filter(b => b.id !== id));
            toast({
                title: "تم الحذف",
                description: "تم حذف البنر بنجاح",
            });
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل حذف البنر",
            });
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('banners')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
        } catch (error) {
            console.error('Error updating status:', error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "فشل تحديث الحالة",
            });
        }
    };

    const resetForm = () => {
        setTitle("");
        setTargetUrl("");
        setDisplayOrder("0");
        setImageFile(null);
    };

    return (
        <AdminLayout
            title="إدارة السلايدر الإعلاني"
            subtitle="التحكم في الصور والعروض المتحركة في واجهة التطبيق الرئيسية"
            actions={
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة إعلان جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة بنر إعلاني جديد</DialogTitle>
                            <DialogDescription>
                                قم برفع الصورة وتحديد الرابط المستهدف وترتيب العرض.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">عنوان البنر</Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="مثال: عرض الصيف"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="image">الصورة (Landscape مفضل)</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">الرابط المستهدف (اختياري)</Label>
                                <Input
                                    id="url"
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">ترتيب العرض</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={displayOrder}
                                    onChange={(e) => setDisplayOrder(e.target.value)}
                                    min="0"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={uploading}>
                                    {uploading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                    حفظ ونشر
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        قائمة البنرات النشطة
                    </CardTitle>
                    <CardDescription>
                        لديك {banners.length} بنر إعلاني مسجل في النظام
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            لا توجد بنرات حالياً. ابدأ بإضافة واحد جديد.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الصورة</TableHead>
                                    <TableHead>العنوان</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الترتيب</TableHead>
                                    <TableHead className="text-left">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {banners.map((banner) => (
                                    <TableRow key={banner.id}>
                                        <TableCell>
                                            <div className="relative w-24 h-14 rounded-md overflow-hidden border">
                                                <img
                                                    src={banner.image_url}
                                                    alt={banner.title}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {banner.title}
                                            {banner.target_url && (
                                                <a href={banner.target_url} target="_blank" rel="noreferrer" className="block text-xs text-muted-foreground hover:underline flex items-center gap-1 mt-1">
                                                    <ExternalLink className="w-3 h-3" />
                                                    {banner.target_url}
                                                </a>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={banner.is_active}
                                                    onCheckedChange={() => toggleStatus(banner.id, banner.is_active)}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {banner.is_active ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{banner.display_order}</Badge>
                                        </TableCell>
                                        <TableCell className="text-left">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(banner.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
};

export default BannerManager;
