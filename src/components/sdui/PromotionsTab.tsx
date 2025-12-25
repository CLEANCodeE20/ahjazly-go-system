import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Copy, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useUIPromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  type UIPromotion,
} from "@/hooks/useSDUI";

const promoTypes = [
  { value: "discount_percentage", label: "خصم نسبة مئوية" },
  { value: "discount_fixed", label: "خصم مبلغ ثابت" },
  { value: "free_seat", label: "مقعد مجاني" },
  { value: "upgrade", label: "ترقية مجانية" },
];

export const PromotionsTab = () => {
  const { data: promotions, isLoading } = useUIPromotions();
  const createPromo = useCreatePromotion();
  const updatePromo = useUpdatePromotion();
  const deletePromo = useDeletePromotion();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<UIPromotion | null>(null);
  const [formData, setFormData] = useState({
    promo_code: "",
    promo_name: "",
    promo_type: "discount_percentage",
    discount_value: 0,
    min_booking_amount: 0,
    max_discount: 0,
    usage_limit: 0,
    per_user_limit: 1,
    start_date: "",
    end_date: "",
    is_active: true,
    display_on_home: true,
    terms_conditions: "",
    banner_image: "",
  });

  const resetForm = () => {
    setFormData({
      promo_code: "",
      promo_name: "",
      promo_type: "discount_percentage",
      discount_value: 0,
      min_booking_amount: 0,
      max_discount: 0,
      usage_limit: 0,
      per_user_limit: 1,
      start_date: "",
      end_date: "",
      is_active: true,
      display_on_home: true,
      terms_conditions: "",
      banner_image: "",
    });
    setEditingPromo(null);
  };

  const generatePromoCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, promo_code: code });
  };

  const handleEdit = (promo: UIPromotion) => {
    setEditingPromo(promo);
    setFormData({
      promo_code: promo.promo_code || "",
      promo_name: promo.promo_name,
      promo_type: promo.promo_type,
      discount_value: promo.discount_value || 0,
      min_booking_amount: promo.min_booking_amount || 0,
      max_discount: promo.max_discount || 0,
      usage_limit: promo.usage_limit || 0,
      per_user_limit: promo.per_user_limit,
      start_date: promo.start_date?.split("T")[0] || "",
      end_date: promo.end_date?.split("T")[0] || "",
      is_active: promo.is_active,
      display_on_home: promo.display_on_home,
      terms_conditions: promo.terms_conditions || "",
      banner_image: promo.banner_image || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      discount_value: formData.discount_value || null,
      min_booking_amount: formData.min_booking_amount || null,
      max_discount: formData.max_discount || null,
      usage_limit: formData.usage_limit || null,
    };

    if (editingPromo) {
      await updatePromo.mutateAsync({
        id: editingPromo.promo_id,
        updates: submitData,
      });
    } else {
      await createPromo.mutateAsync(submitData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      await deletePromo.mutateAsync(id);
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "تم النسخ", description: "تم نسخ كود الخصم" });
  };

  const isExpired = (endDate: string) => new Date(endDate) < new Date();

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
        <CardTitle>العروض والخصومات</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة عرض
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromo ? "تعديل العرض" : "إضافة عرض جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم العرض</Label>
                  <Input
                    value={formData.promo_name}
                    onChange={(e) =>
                      setFormData({ ...formData, promo_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>كود الخصم</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.promo_code}
                      onChange={(e) =>
                        setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })
                      }
                      placeholder="SAVE20"
                    />
                    <Button type="button" variant="outline" onClick={generatePromoCode}>
                      توليد
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع الخصم</Label>
                  <Select
                    value={formData.promo_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, promo_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {promoTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>قيمة الخصم</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الحد الأدنى للحجز</Label>
                  <Input
                    type="number"
                    value={formData.min_booking_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_booking_amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>الحد الأقصى للخصم</Label>
                  <Input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>عدد مرات الاستخدام الكلي</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label>عدد مرات الاستخدام لكل مستخدم</Label>
                  <Input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, per_user_limit: parseInt(e.target.value) || 1 })
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
                    required
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
                    required
                  />
                </div>
              </div>

              <div>
                <Label>رابط صورة البانر</Label>
                <Input
                  value={formData.banner_image}
                  onChange={(e) =>
                    setFormData({ ...formData, banner_image: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>الشروط والأحكام</Label>
                <Textarea
                  value={formData.terms_conditions}
                  onChange={(e) =>
                    setFormData({ ...formData, terms_conditions: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>نشط</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.display_on_home}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, display_on_home: checked })
                    }
                  />
                  <Label>عرض في الصفحة الرئيسية</Label>
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
                  disabled={createPromo.isPending || updatePromo.isPending}
                >
                  {(createPromo.isPending || updatePromo.isPending) && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                  {editingPromo ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!promotions?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد عروض. ابدأ بإضافة عرض جديد.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الكود</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead>الاستخدام</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.promo_id}>
                  <TableCell className="font-medium">{promo.promo_name}</TableCell>
                  <TableCell>
                    {promo.promo_code && (
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {promo.promo_code}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyPromoCode(promo.promo_code!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {promoTypes.find((t) => t.value === promo.promo_type)?.label}
                  </TableCell>
                  <TableCell>
                    {promo.promo_type === "discount_percentage"
                      ? `${promo.discount_value}%`
                      : `${promo.discount_value} ر.س`}
                  </TableCell>
                  <TableCell>
                    {promo.usage_count}/{promo.usage_limit || "∞"}
                  </TableCell>
                  <TableCell>
                    {isExpired(promo.end_date) ? (
                      <Badge variant="destructive">منتهي</Badge>
                    ) : promo.is_active ? (
                      <Badge variant="default">نشط</Badge>
                    ) : (
                      <Badge variant="secondary">غير نشط</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(promo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(promo.promo_id)}
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
