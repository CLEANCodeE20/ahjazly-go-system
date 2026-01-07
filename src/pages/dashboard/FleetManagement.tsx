import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bus,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutGrid
} from "lucide-react";
import SeatMapDesigner, { SeatLayout } from "@/components/dashboard/SeatMapDesigner";
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
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface BusRecord {
  bus_id: number;
  partner_id: number | null;
  license_plate: string;
  model: string | null;
  bus_type: string | null;
  bus_class_id: number | null;
  capacity: number | null;
  status: string | null;
  owner_user_id: number | null;
  seat_layout: SeatLayout | null;
  template_id: number | null;
  created_at: string;
}

const FleetManagement = () => {
  const { partner } = usePartner();
  const {
    data: buses,
    loading,
    create,
    update,
    remove
  } = useSupabaseCRUD<BusRecord>({
    tableName: 'buses',
    primaryKey: 'bus_id',
    initialFetch: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBus, setEditingBus] = useState<BusRecord | null>(null);
  const [newBus, setNewBus] = useState({
    license_plate: "",
    model: "",
    capacity: "",
    bus_type: "standard",
    status: "active",
    seat_layout: null as SeatLayout | null
  });

  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [designTarget, setDesignTarget] = useState<'new' | 'edit'>('new');

  // Templates logic
  const { data: templates, loading: loadingTemplates, create: createTemplate } = useSupabaseCRUD<any>({
    tableName: 'bus_templates',
    primaryKey: 'template_id',
    initialFetch: true
  });

  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false);
  const [templateToSave, setTemplateToSave] = useState<SeatLayout | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleSaveAsTemplate = (layout: SeatLayout) => {
    setTemplateToSave(layout);
    setIsSaveTemplateDialogOpen(true);
  };

  const confirmSaveTemplate = async () => {
    if (!newTemplateName || !templateToSave) return;
    try {
      await createTemplate({
        partner_id: partner?.partner_id,
        template_name: newTemplateName,
        capacity: templateToSave.cells.filter(c => c.type === 'seat').length,
        seat_layout: templateToSave,
      });
      toast({ title: "تم الحفظ", description: "تم حفظ القالب بنجاح" });
      setIsSaveTemplateDialogOpen(false);
      setNewTemplateName("");
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ القالب", variant: "destructive" });
    }
  };

  const loadTemplate = (template: any) => {
    if (designTarget === 'new') {
      setNewBus({
        ...newBus,
        seat_layout: template.seat_layout,
        capacity: template.capacity.toString()
      });
    } else if (editingBus) {
      setEditingBus({
        ...editingBus,
        seat_layout: template.seat_layout,
        capacity: template.capacity
      });
    }
    toast({ title: "تم التحميل", description: `تم تحميل قالب: ${template.template_name}` });
  };

  const handleAddBus = async () => {
    if (!newBus.license_plate || !newBus.model) return;

    setIsSubmitting(true);
    try {
      await create({
        partner_id: partner?.partner_id,
        license_plate: newBus.license_plate,
        model: newBus.model,
        capacity: parseInt(newBus.capacity) || 40,
        bus_type: newBus.bus_type as any,
        status: newBus.status as any,
        seat_layout: newBus.seat_layout
      });
      setNewBus({ license_plate: "", model: "", capacity: "", bus_type: "standard", status: "active", seat_layout: null });
      setIsDialogOpen(false);
      toast({ title: "تمت الإضافة", description: "تم إضافة الحافلة بنجاح" });
    } catch (error) {
      console.error('Add bus error:', error);
      toast({ title: "خطأ", description: "فشل في إضافة الحافلة", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBus = async () => {
    if (!editingBus) return;

    setIsSubmitting(true);
    try {
      await update(editingBus.bus_id, {
        license_plate: editingBus.license_plate,
        model: editingBus.model,
        capacity: editingBus.capacity,
        bus_type: editingBus.bus_type as any,
        status: editingBus.status as any,
        seat_layout: editingBus.seat_layout
      });
      setIsEditDialogOpen(false);
      setEditingBus(null);
      toast({ title: "تم التحديث", description: "تم تحديث بيانات الحافلة بنجاح" });
    } catch (error) {
      console.error('Edit bus error:', error);
      toast({ title: "خطأ", description: "فشل في تحديث الحافلة", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBus = async () => {
    if (deleteId) {
      try {
        await remove(deleteId);
        toast({ title: "تم الحذف", description: "تم حذف الحافلة بنجاح" });
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في حذف الحافلة", variant: "destructive" });
      }
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (busId: number, newStatus: string) => {
    try {
      await update(busId, { status: newStatus as any });
      toast({ title: "تم التحديث", description: "تم تغيير حالة الحافلة" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تغيير الحالة", variant: "destructive" });
    }
  };

  const openEditDialog = (bus: BusRecord) => {
    setEditingBus({ ...bus });
    setIsEditDialogOpen(true);
  };

  const filteredBuses = buses.filter(bus =>
    bus.license_plate?.includes(searchQuery) ||
    bus.model?.includes(searchQuery)
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> نشطة</span>;
      case "maintenance":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><AlertCircle className="w-3 h-3" /> صيانة</span>;
      case "inactive":
      case "retired":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">غير نشطة</span>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="إدارة الأسطول"
      subtitle="إضافة وتعديل حافلات الشركة"
      actions={
        <>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة حافلة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة حافلة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الحافلة الجديدة لإضافتها إلى الأسطول
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">رقم اللوحة *</Label>
                    <Input
                      id="license_plate"
                      value={newBus.license_plate}
                      onChange={(e) => setNewBus({ ...newBus, license_plate: e.target.value })}
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">الموديل *</Label>
                    <Input
                      id="model"
                      value={newBus.model}
                      onChange={(e) => setNewBus({ ...newBus, model: e.target.value })}
                      placeholder="Mercedes-Benz"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">عدد المقاعد</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newBus.capacity}
                      onChange={(e) => setNewBus({ ...newBus, capacity: e.target.value })}
                      placeholder="45"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع الحافلة</Label>
                    <Select value={newBus.bus_type} onValueChange={(v) => setNewBus({ ...newBus, bus_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">عادية</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="sleeper">نوم</SelectItem>
                        <SelectItem value="double_decker">طابقين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>تحميل من قالب جاهز</Label>
                    <Select onValueChange={(id) => {
                      const t = templates.find(t => t.template_id.toString() === id);
                      if (t) loadTemplate(t);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر قالباً..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(t => (
                          <SelectItem key={t.template_id} value={t.template_id.toString()}>
                            {t.template_name} ({t.capacity} مقعد)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 group"
                    onClick={() => {
                      setDesignTarget('new');
                      setIsDesignerOpen(true);
                    }}
                  >
                    <LayoutGrid className="w-4 h-4 ml-2 text-primary group-hover:scale-110 transition-transform" />
                    {newBus.seat_layout ? 'تعديل مخطط المقاعد المخصص' : 'تصميم مخطط مقاعد مخصص'}
                  </Button>
                  {newBus.seat_layout && (
                    <p className="text-[10px] text-center mt-1 text-secondary font-bold">
                      تم تحديد المخطط المنسق ({newBus.capacity} مقعد)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddBus} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  إضافة الحافلة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Seat Map Designer Dialog */}
          <Dialog open={isDesignerOpen} onOpenChange={setIsDesignerOpen}>
            <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden">
              <SeatMapDesigner
                initialLayout={designTarget === 'new' ? newBus.seat_layout || undefined : editingBus?.seat_layout || undefined}
                onSave={(layout) => {
                  if (designTarget === 'new') {
                    setNewBus({ ...newBus, seat_layout: layout, capacity: layout.cells.filter(c => c.type === 'seat').length.toString() });
                  } else if (editingBus) {
                    setEditingBus({ ...editingBus, seat_layout: layout, capacity: layout.cells.filter(c => c.type === 'seat').length });
                  }
                  setIsDesignerOpen(false);
                  toast({ title: "تم التصميم", description: "تم حفظ مخطط المقاعد بنجاح" });
                }}
                onSaveAsTemplate={handleSaveAsTemplate}
                onCancel={() => setIsDesignerOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Simple Save Template Dialog */}
          <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>حفظ كقالب جديد</DialogTitle>
                <DialogDescription>أدخل اسماً لهذا المخطط لاستخدامه لاحقاً</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="مثال: باص مرسيدس 45 مقعد"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)}>إلغاء</Button>
                <Button onClick={confirmSaveTemplate}>حفظ القالب</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{buses.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الحافلات</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{buses.filter(b => b.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">حافلات نشطة</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{buses.filter(b => b.status === "maintenance").length}</p>
                <p className="text-sm text-muted-foreground">في الصيانة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث برقم اللوحة أو الموديل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && buses.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && buses.length === 0 && (
          <div className="text-center py-12">
            <Bus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد حافلات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة حافلة جديدة</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة حافلة
            </Button>
          </div>
        )}

        {/* Buses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuses.map((bus) => (
            <div key={bus.bus_id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Bus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(bus)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteId(bus.bus_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-bold text-foreground text-lg mb-1">{bus.license_plate}</h3>
              <p className="text-muted-foreground text-sm mb-4">{bus.model}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">النوع</span>
                  <span className="text-foreground">{bus.bus_type === 'standard' ? 'عادية' : bus.bus_type === 'vip' ? 'VIP' : bus.bus_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">عدد المقاعد</span>
                  <span className="text-foreground">{bus.capacity || 40} مقعد</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(bus.status)}
                <Select value={bus.status || "active"} onValueChange={(v) => handleStatusChange(bus.bus_id, v)}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="inactive">غير نشطة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الحافلة</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الحافلة
            </DialogDescription>
          </DialogHeader>
          {editingBus && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم اللوحة *</Label>
                  <Input
                    value={editingBus.license_plate}
                    onChange={(e) => setEditingBus({ ...editingBus, license_plate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الموديل *</Label>
                  <Input
                    value={editingBus.model || ""}
                    onChange={(e) => setEditingBus({ ...editingBus, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>عدد المقاعد</Label>
                  <Input
                    type="number"
                    value={editingBus.capacity || ""}
                    onChange={(e) => setEditingBus({ ...editingBus, capacity: parseInt(e.target.value) || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع الحافلة</Label>
                  <Select value={editingBus.bus_type || "standard"} onValueChange={(v) => setEditingBus({ ...editingBus, bus_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">عادية</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="sleeper">نوم</SelectItem>
                      <SelectItem value="double_decker">طابقين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={editingBus.status || "active"} onValueChange={(v) => setEditingBus({ ...editingBus, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشطة</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="inactive">غير نشطة</SelectItem>
                    <SelectItem value="retired">متقاعدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    setDesignTarget('edit');
                    setIsDesignerOpen(true);
                  }}
                >
                  <LayoutGrid className="w-4 h-4 ml-2 text-primary" />
                  {editingBus.seat_layout ? 'تعديل مخطط المقاعد' : 'تصميم مخطط مقاعد'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleEditBus} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الحافلة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBus} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default FleetManagement;
