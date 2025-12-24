import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js"; // Import createClient
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bus,
  Home,
  Route,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Ticket,
  User,
  Shield,
  Briefcase,
  Loader2,
  CheckCircle2,
  XCircle
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "@/hooks/use-toast";

// Sidebar navigation
const sidebarLinks = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/dashboard/fleet", label: "إدارة الأسطول", icon: Bus },
  { href: "/dashboard/routes", label: "المسارات", icon: MapPin },
  { href: "/dashboard/trips", label: "الرحلات", icon: Route },
  { href: "/dashboard/employees", label: "الموظفين", icon: Users },
  { href: "/dashboard/branches", label: "الفروع", icon: Building2 },
  { href: "/dashboard/bookings", label: "الحجوزات", icon: Ticket },
  { href: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings }
];

// Roles
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
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { partnerId, partner } = usePartner();

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
    password: "", // Add password field
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

    // Password validation for new employees
    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      toast({ title: "خطأ", description: "يرجى إدخال كلمة مرور (6 أحرف على الأقل)", variant: "destructive" });
      return;
    }

    if (!formData.email) {
      toast({ title: "خطأ", description: "البريد الإلكتروني مطلوب لإنشاء حساب الدخول", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    const employeeData = {
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      branch_id: parseInt(formData.branch_id),
      role_in_company: formData.role_in_company,
      status: formData.status,
      partner_id: partnerId
    };

    try {
      let userId = editingEmployee?.user_id;

      if (editingEmployee) {
        // Update existing employee record
        const employeeData = {
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          branch_id: parseInt(formData.branch_id),
          role_in_company: formData.role_in_company,
          status: formData.status,
          partner_id: partnerId
        };

        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('employee_id', editingEmployee.employee_id);
        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث بيانات الموظف بنجاح" });

      } else {
        // Create new employee with auth account

        // 1. Create temporary client to sign up user without logging out admin
        const tempClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          {
            auth: {
              persistSession: false, // IMPORANT: Don't persist this session
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );

        // 2. Sign up the user
        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: 'employee',
              phone_number: formData.phone_number
            }
          }
        });

        if (authError) {
          if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
            throw new Error("البريد الإلكتروني مسجل مسبقاً. يرجى استخدام بريد إلكتروني آخر.");
          }
          throw authError;
        }
        if (!authData.user) throw new Error("فشل إنشاء الحساب");

        userId = authData.user.id as any; // Cast to match expected type if needed (DB expects int? check schema. usually UUID for auth_id, int for user_id PK)
        // Actually public.users probably uses int ID and UUID auth_id. 
        // We need to wait for public.users trigger? Or insert manually if we have policy?
        // Our policy "Partners can insert employee users" allows manual insert.

        // 3. Insert into public.users (manually to ensure linkage)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            auth_id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            user_type: 'employee',
            account_status: 'active', // Auto-activate employees
            partner_id: partnerId // Link to partner
          })
          .select()
          .single();

        if (userError) {
          // If trigger already created it (unlikely with just signup unless specific trigger exists), handle duplications? 
          // Assuming no automatic trigger for creating public.users from auth yet in this flow or we want explicit control.
          console.error("User insert error", userError);
          // throw userError; // Don't throw immediately, check if it exists?
          // For now throw to be safe.
          throw new Error(`خطأ في إنشاء ملف المستخدم: ${userError.message}`);
        }

        const publicUserId = userData.user_id;

        // 4. Assign Role in user_roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'employee', // Use generic role as per enum constraint
            partner_id: partnerId
          });

        if (roleError) throw new Error(`خطأ في تعيين الصلاحيات: ${roleError.message}`);

        // 5. Create Employee Record
        const employeeData = {
          user_id: publicUserId, // Link to public.users id
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          branch_id: parseInt(formData.branch_id),
          role_in_company: formData.role_in_company, // Specific job title
          status: formData.status,
          partner_id: partnerId
        };

        const { error: empError } = await supabase
          .from('employees')
          .insert(employeeData);

        if (empError) throw empError;

        toast({ title: "تمت الإضافة", description: "تم إنشاء حساب الموظف بنجاح" });
      }

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
      const { error } = await supabase.from('employees').delete().eq('employee_id', deleteId);
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحذف", description: "تم حذف الموظف بنجاح" });
        fetchData();
      }
      setDeleteId(null);
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

  const getRoleLabel = (value: string | null) => roles.find(r => r.value === value)?.label || value || "-";
  const getBranchName = (branchId: number | null) => branches.find(b => b.branch_id === branchId)?.branch_name || "-";

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 z-50 translate-x-0 hidden lg:block">
        <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">احجزلي</span>
            <p className="text-xs text-sidebar-foreground/60">{partner?.company_name || "شركتي"}</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === link.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">إدارة الموظفين والسائقين</h1>
              <p className="text-sm text-muted-foreground">إضافة وإدارة موظفي وسائقي الشركة</p>
            </div>
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
                          disabled={!!editingEmployee} // Disable email edit for now as it's linked to auth
                        />
                      </div>
                    </div>

                    {!editingEmployee && (
                      <div className="space-y-2">
                        <Label>كلمة المرور *</Label>
                        <Input
                          type="password"
                          placeholder="******"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">ستستخدم للدخول إلى النظام</p>
                      </div>
                    )}

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
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                  <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الموظف</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الوظيفة</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفرع</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((employee) => (
                          <tr key={employee.employee_id} className="border-b border-border last:border-0">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{employee.full_name || "موظف"}</p>
                                  <p className="text-xs text-muted-foreground">{employee.email || employee.phone_number || "-"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-foreground">{getRoleLabel(employee.role_in_company)}</td>
                            <td className="py-3 px-4 text-muted-foreground">{getBranchName(employee.branch_id)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active'
                                ? "bg-secondary/10 text-secondary"
                                : "bg-muted text-muted-foreground"
                                }`}>
                                {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Employee Dialog */}
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

      {/* Delete Driver Dialog */}
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
    </div>
  );
};

export default EmployeesManagement;