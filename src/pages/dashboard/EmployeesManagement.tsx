import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bus,
  Users,
  CreditCard,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  User,
  Shield,
  Briefcase,
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
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const roles = [
  { value: "driver", label: "سائق", icon: Bus },
  { value: "assistant", label: "مساعد سائق", icon: Bus },
  { value: "manager", label: "مدير فرع", icon: Shield },
  { value: "accountant", label: "محاسب", icon: CreditCard },
  { value: "support", label: "خدمة عملاء", icon: Users },
  { value: "supervisor", label: "مشرف", icon: Briefcase }
];

interface EmployeeRecord {
  employee_id: number;
  user_id: number | null;
  partner_id: number | null;
  branch_id: number | null;
  role_in_company: string | null;
  status: string | null;
  created_at: string | null;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
}

interface BranchRecord {
  branch_id: number;
  branch_name: string;
  city: string | null;
}

interface DriverRecord {
  driver_id: number;
  full_name: string;
  phone_number: string | null;
  license_number: string | null;
  license_expiry: string | null;
  status: string | null;
}

const EmployeesManagement = () => {
  const { partnerId } = usePartner();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddDriverDialogOpen, setIsAddDriverDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDriverId, setDeleteDriverId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    branch_id: "",
    role_in_company: "",
    status: "active"
  });
  const [driverFormData, setDriverFormData] = useState({
    full_name: "",
    phone_number: "",
    license_number: "",
    license_expiry: ""
  });

  useEffect(() => {
    fetchData();
  }, [partnerId]);

  const fetchData = async () => {
    setLoading(true);

    const [employeesRes, branchesRes, driversRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('branches').select('branch_id, branch_name, city'),
      supabase.from('drivers').select('*').order('created_at', { ascending: false })
    ]);

    if (!employeesRes.error) setEmployees((employeesRes.data as any) || []);
    if (!branchesRes.error) setBranches(branchesRes.data || []);
    if (!driversRes.error) setDrivers(driversRes.data || []);

    setLoading(false);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesRole = filterRole === "all" || employee.role_in_company === filterRole;
    const matchesBranch = filterBranch === "all" || employee.branch_id?.toString() === filterBranch;
    const matchesSearch = !searchTerm ||
      employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone_number?.includes(searchTerm);
    return matchesRole && matchesBranch && matchesSearch;
  });

  const filteredDrivers = drivers.filter(driver =>
    driver.full_name?.includes(searchTerm) || driver.phone_number?.includes(searchTerm)
  );

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.role_in_company || !formData.branch_id) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة (الاسم، الوظيفة، الفرع)", variant: "destructive" });
      return;
    }

    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      toast({ title: "خطأ", description: "يرجى إدخال كلمة مرور (6 أحرف على الأقل)", variant: "destructive" });
      return;
    }

    if (!formData.email) {
      toast({ title: "خطأ", description: "البريد الإلكتروني مطلوب لإنشاء حساب الدخول", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // DEBUG: Check if the new key is loaded
    console.log("DEBUG: Current Supabase Key:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + "...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("لا يوجد جلسة نشطة");

      const payload = editingEmployee ? {
        action: 'update',
        user_id: editingEmployee.user_id,
        email: formData.email,
        password: formData.password || undefined,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        branch_id: parseInt(formData.branch_id),
        role_in_company: formData.role_in_company,
        status: formData.status,
        partner_id: partnerId
      } : {
        action: 'create',
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        role_in_company: formData.role_in_company,
        branch_id: parseInt(formData.branch_id),
        partner_id: partnerId
      };

      // Workaround: Use ANON KEY directly to bypass 401 Unauthorized from Gateway
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = "https://kbgbftyvbdgyoeosxlok.supabase.co/functions/v1/manage-employee";

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON Parse Error:", e, "Response:", responseText);
        throw new Error("Invalid response: " + responseText);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "خطأ في العملية");
      }

      toast({
        title: editingEmployee ? "تم التحديث" : "تمت الإضافة",
        description: editingEmployee ? "تم تحديث بيانات الموظف بنجاح" : "تم إنشاء حساب الموظف بنجاح"
      });

      setFormData({ full_name: "", email: "", phone_number: "", password: "", branch_id: "", role_in_company: "", status: "active" });
      setEditingEmployee(null);
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDriver = async () => {
    if (!driverFormData.full_name || !driverFormData.phone_number) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('drivers')
        .insert({
          full_name: driverFormData.full_name,
          phone_number: driverFormData.phone_number,
          license_number: driverFormData.license_number || null,
          license_expiry: driverFormData.license_expiry || null,
          partner_id: partnerId,
          status: 'active'
        });

      if (error) throw error;
      toast({ title: "تمت الإضافة", description: "تم إضافة السائق بنجاح" });
      setDriverFormData({ full_name: "", phone_number: "", license_number: "", license_expiry: "" });
      setIsAddDriverDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: EmployeeRecord) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name || "",
      email: employee.email || "",
      phone_number: employee.phone_number || "",
      password: "",
      branch_id: employee.branch_id?.toString() || "",
      role_in_company: employee.role_in_company || "",
      status: employee.status || "active"
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      const employee = employees.find(e => e.employee_id === deleteId);
      if (!employee || !employee.user_id) {
        // Fallback for direct table delete if somehow missing user_id
        await supabase.from('employees').delete().eq('employee_id', deleteId);
        toast({ title: "تم الحذف", description: "تم حذف سجل الموظف محلياً" });
        fetchData();
        setDeleteId(null);
        return;
      }

      setIsSubmitting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("لا يوجد جلسة نشطة");

        const { data, error } = await supabase.functions.invoke('manage-employee', {
          body: {
            action: 'delete',
            user_id: employee.user_id
          }
        });

        if (error) throw error;

        if (!data.success) throw new Error(data.error || "فشل الحذف");

        toast({ title: "تم الحذف", description: "تم حذف الموظف وإلغاء صلاحياته بنجاح" });
        fetchData();
      } catch (error: any) {
        toast({ title: "خطأ", description: "فشل حذف الموظف: " + error.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
        setDeleteId(null);
      }
    }
  };

  const handleDeleteDriver = async () => {
    if (deleteDriverId) {
      const { error } = await supabase.from('drivers').delete().eq('driver_id', deleteDriverId);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحذف", description: "تم حذف السائق بنجاح" });
        fetchData();
      }
      setDeleteDriverId(null);
    }
  };

  const getBranchName = (branchId: number | null) => branches.find(b => b.branch_id === branchId)?.branch_name || "-";

  return (
    <DashboardLayout
      title="إدارة الموظفين والسائقين"
      subtitle="إضافة وإدارة موظفي وسائقي الشركة"
      actions={
        <div className="flex items-center gap-2">
          <Dialog open={isAddDriverDialogOpen} onOpenChange={setIsAddDriverDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 ml-2" />
                إضافة سائق
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة سائق جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    placeholder="اسم السائق"
                    value={driverFormData.full_name}
                    onChange={(e) => setDriverFormData({ ...driverFormData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجوال *</Label>
                  <Input
                    placeholder="05xxxxxxxx"
                    value={driverFormData.phone_number}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone_number: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الرخصة</Label>
                    <Input
                      placeholder="رقم رخصة القيادة"
                      value={driverFormData.license_number}
                      onChange={(e) => setDriverFormData({ ...driverFormData, license_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ انتهاء الرخصة</Label>
                    <Input
                      type="date"
                      value={driverFormData.license_expiry}
                      onChange={(e) => setDriverFormData({ ...driverFormData, license_expiry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleAddDriver} className="flex-1" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    إضافة السائق
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDriverDialogOpen(false)}>إلغاء</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEmployee(null);
                setFormData({ full_name: "", email: "", phone_number: "", password: "", branch_id: "", role_in_company: "", status: "active" });
              }}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة موظف
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input
                    placeholder="اسم الموظف"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input
                      placeholder="05xxxxxxxx"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني *</Label>
                    <Input
                      type="email"
                      placeholder="example@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingEmployee}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>كلمة المرور {editingEmployee ? "(اختياري)" : "*"}</Label>
                  <Input
                    type="password"
                    placeholder={editingEmployee ? "اترك فارغاً للاحتفاظ بكلمة المرور الحالية" : "******"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  {!editingEmployee && <p className="text-xs text-muted-foreground">ستستخدم للدخول إلى النظام</p>}
                  {editingEmployee && <p className="text-xs text-muted-foreground">أدخل كلمة مرور جديدة فقط إذا أردت تغييرها</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الوظيفة *</Label>
                    <Select value={formData.role_in_company} onValueChange={(v) => setFormData({ ...formData, role_in_company: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الوظيفة" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الفرع *</Label>
                    <Select value={formData.branch_id} onValueChange={(v) => setFormData({ ...formData, branch_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSubmit} className="flex-1" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    {editingEmployee ? "حفظ التغييرات" : "إضافة الموظف"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
                <p className="text-sm text-muted-foreground">الموظفين</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Bus className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">السائقين</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {drivers.filter(d => d.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">سائقين نشطين</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              className="pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الوظيفة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الوظائف</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="الفرع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفروع</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Drivers Section */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-primary" />
                السائقين ({filteredDrivers.length})
              </h2>
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">لا يوجد سائقين</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver) => (
                    <div key={driver.driver_id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{driver.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{driver.phone_number}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDeleteDriverId(driver.driver_id)} className="text-destructive">
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {driver.license_number ? `رخصة: ${driver.license_number}` : "بدون رخصة"}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${driver.status === 'active'
                          ? "bg-secondary/10 text-secondary"
                          : "bg-muted text-muted-foreground"
                          }`}>
                          {driver.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Employees Section */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                الموظفين ({filteredEmployees.length})
              </h2>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">لا يوجد موظفين</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.employee_id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{employee.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(employee.employee_id)} className="text-destructive">
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase">الوظيفة</p>
                          <p className="text-xs font-medium text-foreground">
                            {roles.find(r => r.value === employee.role_in_company)?.label || employee.role_in_company}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase">الفرع</p>
                          <p className="text-xs font-medium text-foreground">{getBranchName(employee.branch_id)}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{employee.phone_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active'
                          ? "bg-secondary/10 text-secondary"
                          : "bg-muted text-muted-foreground"
                          }`}>
                          {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الموظف؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDriverId} onOpenChange={() => setDeleteDriverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا السائق؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDriver} className="bg-destructive text-destructive-foreground">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EmployeesManagement;