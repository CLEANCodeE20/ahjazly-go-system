import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, MousePointer, BarChart } from "lucide-react";
import {
  useUIAdvertisements,
  useCreateAdvertisement,
  useUpdateAdvertisement,
  useDeleteAdvertisement,
  type UIAdvertisement,
} from "@/hooks/useSDUI";

const adTypes = [
  { value: "banner", label: "بانر" },
  { value: "sidebar", label: "جانبي" },
  { value: "popup", label: "منبثق" },
  { value: "native", label: "مدمج" },
];

const adPositions = [
  { value: "top", label: "أعلى الصفحة" },
  { value: "bottom", label: "أسفل الصفحة" },
  { value: "left", label: "يسار" },
  { value: "right", label: "يمين" },
  { value: "inline", label: "بين المحتوى" },
];

const targetPages = [
  { value: "home", label: "الرئيسية" },
  { value: "search", label: "البحث" },
  { value: "booking", label: "الحجز" },
  { value: "about", label: "من نحن" },
  { value: "contact", label: "اتصل بنا" },
  { value: "all", label: "جميع الصفحات" },
];

export const AdvertisementsTab = () => {
  const { data: ads, isLoading } = useUIAdvertisements();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<UIAdvertisement | null>(null);
  const [formData, setFormData] = useState({
    ad_name: "",
    ad_type: "banner",
    ad_position: "top",
    target_pages: ["all"],
    image_url: "",
    mobile_image_url: "",
    link_url: "",
    alt_text: "",
    advertiser_name: "",
    start_date: "",
    end_date: "",
    is_active: true,
    priority: 0,
  });

  const resetForm = () => {
    setFormData({
      ad_name: "",
      ad_type: "banner",
      ad_position: "top",
      target_pages: ["all"],
      image_url: "",
      mobile_image_url: "",
      link_url: "",
      alt_text: "",
      advertiser_name: "",
      start_date: "",
      end_date: "",
      is_active: true,
      priority: 0,
    });
    setEditingAd(null);
  };

  const handleEdit = (ad: UIAdvertisement) => {
    setEditingAd(ad);
    setFormData({
      ad_name: ad.ad_name,
      ad_type: ad.ad_type,
      ad_position: ad.ad_position,
      target_pages: ad.target_pages || ["all"],
      image_url: ad.image_url || "",
      mobile_image_url: ad.mobile_image_url || "",
      link_url: ad.link_url || "",
      alt_text: ad.alt_text || "",
      advertiser_name: ad.advertiser_name || "",
      start_date: ad.start_date?.split("T")[0] || "",
      end_date: ad.end_date?.split("T")[0] || "",
      is_active: ad.is_active,
      priority: ad.priority,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    };

    if (editingAd) {
      await updateAd.mutateAsync({
        id: editingAd.ad_id,
        updates: submitData,
      });
    } else {
      await createAd.mutateAsync(submitData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الإعلان؟")) {
      await deleteAd.mutateAsync(id);
    }
  };

  const toggleActive = async (ad: UIAdvertisement) => {
    await updateAd.mutateAsync({
      id: ad.ad_id,
      updates: { is_active: !ad.is_active },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>الإعلانات</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة إعلان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? "تعديل الإعلان" : "إضافة إعلان جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>اسم الإعلان</Label>
                <Input
                  value={formData.ad_name}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع الإعلان</Label>
                  <Select
                    value={formData.ad_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ad_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {adTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>موضع الإعلان</Label>
                  <Select
                    value={formData.ad_position}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ad_position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {adPositions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>الصفحات المستهدفة</Label>
                <Select
                  value={formData.target_pages[0]}
                  onValueChange={(value) =>
                    setFormData({ ...formData, target_pages: [value] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetPages.map((page) => (
                      <SelectItem key={page.value} value={page.value}>
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>رابط الصورة</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>رابط صورة الموبايل (اختياري)</Label>
                <Input
                  value={formData.mobile_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رابط الإعلان</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData({ ...formData, link_url: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>اسم المعلن</Label>
                  <Input
                    value={formData.advertiser_name}
                    onChange={(e) =>
                      setFormData({ ...formData, advertiser_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>تاريخ النهاية</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الأولوية</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>نشط</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createAd.isPending || updateAd.isPending}
                >
                  {(createAd.isPending || updateAd.isPending) && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                  {editingAd ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!ads?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد إعلانات. ابدأ بإضافة إعلان جديد.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الموضع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>
                  <MousePointer className="w-4 h-4 inline ml-1" />
                  النقرات
                </TableHead>
                <TableHead>
                  <BarChart className="w-4 h-4 inline ml-1" />
                  المشاهدات
                </TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad.ad_id}>
                  <TableCell className="font-medium">{ad.ad_name}</TableCell>
                  <TableCell>
                    {adTypes.find((t) => t.value === ad.ad_type)?.label}
                  </TableCell>
                  <TableCell>
                    {adPositions.find((p) => p.value === ad.ad_position)?.label}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.is_active ? "default" : "secondary"}>
                      {ad.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>{ad.click_count}</TableCell>
                  <TableCell>{ad.impression_count}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive(ad)}
                      >
                        {ad.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(ad.ad_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
