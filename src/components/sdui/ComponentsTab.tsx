import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  useUIComponents,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  type UIComponent,
} from "@/hooks/useSDUI";

const componentTypes = [
  { value: "hero", label: "قسم رئيسي (Hero)" },
  { value: "features", label: "شبكة المميزات (Features)" },
  { value: "benefits", label: "المميزات والفوائد (Benefits)" },
  { value: "cta", label: "دعوة للعمل (CTA)" },
  { value: "banner", label: "بانر (Banner)" },
  { value: "ads", label: "إعلان (Ads)" },
  { value: "promotions", label: "عرض ترويجي (Promotions)" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  published: "bg-green-500",
  scheduled: "bg-blue-500",
  archived: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  scheduled: "مجدول",
  archived: "مؤرشف",
};

interface FormData {
  component_type: string;
  component_name: string;
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  background_image: string;
  link_url: string;
  button_text: string;
  button_url: string;
  status: string;
  priority: number;
  custom_data: string;
}

export const ComponentsTab = () => {
  const { data: components, isLoading } = useUIComponents();
  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const deleteComponent = useDeleteComponent();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<UIComponent | null>(null);
  const [formData, setFormData] = useState<FormData>({
    component_type: "banner",
    component_name: "",
    title: "",
    subtitle: "",
    content: "",
    image_url: "",
    background_image: "",
    link_url: "",
    button_text: "",
    button_url: "",
    status: "draft",
    priority: 0,
    custom_data: "{}",
  });

  const resetForm = () => {
    setFormData({
      component_type: "banner",
      component_name: "",
      title: "",
      subtitle: "",
      content: "",
      image_url: "",
      background_image: "",
      link_url: "",
      button_text: "",
      button_url: "",
      status: "draft",
      priority: 0,
      custom_data: "{}",
    });
    setEditingComponent(null);
  };

  const handleEdit = (component: UIComponent) => {
    setEditingComponent(component);
    setFormData({
      component_type: component.component_type,
      component_name: component.component_name,
      title: component.title || "",
      subtitle: component.subtitle || "",
      content: component.content || "",
      image_url: component.image_url || "",
      background_image: component.background_image || "",
      link_url: component.link_url || "",
      button_text: component.button_text || "",
      button_url: component.button_url || "",
      status: component.status,
      priority: component.priority,
      custom_data: JSON.stringify(component.custom_data || {}, null, 2),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      custom_data: JSON.parse(formData.custom_data || "{}"),
    };

    if (editingComponent) {
      await updateComponent.mutateAsync({
        id: editingComponent.component_id,
        updates: dataToSubmit,
      });
    } else {
      await createComponent.mutateAsync(dataToSubmit);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المكون؟")) {
      await deleteComponent.mutateAsync(id);
    }
  };

  const toggleStatus = async (component: UIComponent) => {
    const newStatus = component.status === "published" ? "draft" : "published";
    await updateComponent.mutateAsync({
      id: component.component_id,
      updates: { status: newStatus },
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
        <CardTitle>المكونات</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مكون
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingComponent ? "تعديل المكون" : "إضافة مكون جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع المكون</Label>
                  <Select
                    value={formData.component_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, component_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {componentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="published">منشور</SelectItem>
                      <SelectItem value="scheduled">مجدول</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>اسم المكون (للإدارة)</Label>
                <Input
                  value={formData.component_name}
                  onChange={(e) =>
                    setFormData({ ...formData, component_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>العنوان الفرعي</Label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>المحتوى</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label>رابط صورة الخلفية</Label>
                  <Input
                    value={formData.background_image}
                    onChange={(e) =>
                      setFormData({ ...formData, background_image: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نص الزر</Label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) =>
                      setFormData({ ...formData, button_text: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>رابط الزر</Label>
                  <Input
                    value={formData.button_url}
                    onChange={(e) =>
                      setFormData({ ...formData, button_url: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>الأولوية (رقم أعلى = أهمية أكبر)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <Label>بيانات مخصصة (JSON)</Label>
                <Textarea
                  value={formData.custom_data}
                  onChange={(e) =>
                    setFormData({ ...formData, custom_data: e.target.value })
                  }
                  rows={6}
                  className="font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  استخدم هذا الحقل لإضافة بيانات إضافية مثل قائمة المميزات أو الإحصائيات.
                </p>
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
                  disabled={createComponent.isPending || updateComponent.isPending}
                >
                  {(createComponent.isPending || updateComponent.isPending) && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                  {editingComponent ? "تحديث" : "إنشاء"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!components?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد مكونات. ابدأ بإضافة مكون جديد.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>المشاهدات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.component_id}>
                  <TableCell className="font-medium">
                    {component.component_name}
                  </TableCell>
                  <TableCell>
                    {componentTypes.find((t) => t.value === component.component_type)?.label}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[component.status]}>
                      {statusLabels[component.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{component.priority}</TableCell>
                  <TableCell>{component.view_count}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleStatus(component)}
                      >
                        {component.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(component)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(component.component_id)}
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
