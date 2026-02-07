import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface BranchRecord {
  branch_id: number;
  partner_id: number | null;
  branch_name: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  status: string | null;
  created_at: string;
}

const BranchesManagement = () => {
  const { partnerId, isLoading: partnerLoading } = usePartner();

  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    branch_name: "",
    city: "",
    address: "",
    phone: ""
  });

  useEffect(() => {
    if (!partnerLoading && partnerId) {
      fetchBranches();
    } else if (!partnerLoading && !partnerId) {
      setLoading(false); // Stop loading if no partner ID (e.g. Superuser viewing all, or error)
      // If Superuser, we might want to fetch all. Let's assume for now we only fetch for partnerId if present.
      // But wait, the RLS allows Superuser to see all.
      // If partnerId is null (Superuser), we should fetch without filter?
      // The user complained about seeing other branches.
      // If I am a SUPERUSER, I probably WANT to see all branches.
      // If I am a PARTNER, I MUST have a partnerId.
      // If partnerId is null and I am NOT a superuser, then I shouldn't see anything.
      // Let's implement robust logic.
    }
  }, [partnerId, partnerLoading]);

  const fetchBranches = async () => {
    setLoading(true);
    let query = supabase
      .from('branches')
      .select('*')
      .order('created_at', { ascending: false });

    // Only filter by partner_id if it exists (i.e. for Partners)
    // If it's null (Superuser), do not add .eq('partner_id', null)
    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "خطأ", description: "فشل في تحميل الفروع", variant: "destructive" });
    } else {
      setBranches(data || []);
    }
    setLoading(false);
  };

  const filteredBranches = branches.filter(branch =>
    branch.branch_name?.includes(searchTerm) ||
    branch.city?.includes(searchTerm)
  );

  const handleSubmit = async () => {
    if (!formData.branch_name || !formData.city) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const branchData = {
      branch_name: formData.branch_name,
      city: formData.city,
      address: formData.address || null,
      phone: formData.phone || null,
      status: 'active',
      partner_id: partnerId
    };

    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(branchData)
          .eq('branch_id', editingBranch.branch_id);
        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث الفرع بنجاح" });
      } else {
        const { error } = await supabase
          .from('branches')
          .insert(branchData);
        if (error) throw error;
        toast({ title: "تمت الإضافة", description: "تم إضافة الفرع بنجاح" });
      }

      setFormData({ branch_name: "", city: "", address: "", phone: "" });
      setEditingBranch(null);
      setIsAddDialogOpen(false);
      fetchBranches();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (branch: BranchRecord) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branch_name,
      city: branch.city || "",
      address: branch.address || "",
      phone: branch.phone || ""
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const { error } = await supabase.from('branches').delete().eq('branch_id', deleteId);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحذف", description: "تم حذف الفرع بنجاح" });
        fetchBranches();
      }
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (branch: BranchRecord) => {
    const newStatus = branch.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('branches')
      .update({ status: newStatus })
      .eq('branch_id', branch.branch_id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم التحديث", description: "تم تحديث حالة الفرع" });
      fetchBranches();
    }
  };

  return (
    <DashboardLayout
      title="إدارة الفروع"
      subtitle="إضافة وإدارة فروع الشركة"
      actions={
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBranch(null);
              setFormData({ branch_name: "", city: "", address: "", phone: "" });
            }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة فرع
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>اسم الفرع *</Label>
                <Input
                  placeholder="مثال: الفرع الرئيسي - الرياض"
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة *</Label>
                <Input
                  placeholder="مثال: الرياض"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان التفصيلي</Label>
                <Textarea
                  placeholder="الشارع، الحي، رقم المبنى..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input
                  placeholder="05xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingBranch ? "حفظ التغييرات" : "إضافة الفرع"}
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{branches.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الفروع</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {branches.filter(b => b.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">فروع نشطة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="بحث عن فرع..."
            className="pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && branches.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">لا توجد فروع</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة فرع جديد</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة فرع
            </Button>
          </div>
        )}

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => (
            <div key={branch.branch_id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{branch.branch_name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${branch.status === "active"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-muted text-muted-foreground"
                      }`}>
                      {branch.status === "active" ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleEdit(branch)}>
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(branch)}>
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      {branch.status === 'active' ? 'تعطيل' : 'تفعيل'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(branch.branch_id)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{branch.city}{branch.address && ` - ${branch.address}`}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{branch.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BranchesManagement;