import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Loader2
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";

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
  { value: "driver", label: "سائق" },
  { value: "assistant", label: "مساعد سائق" },
  { value: "manager", label: "مدير فرع" },
  { value: "accountant", label: "محاسب" },
  { value: "support", label: "خدمة عملاء" },
  { value: "supervisor", label: "مشرف" }
];

interface EmployeeRecord {
  employee_id: number;
  user_id: number | null;
  partner_id: number | null;
  branch_id: number | null;
  role_in_company: string | null;
  status: string | null;
  created_at: string | null;
}

interface BranchRecord {
  branch_id: number;
  branch_name: string;
  city: string | null;
}

interface UserRecord {
  user_id: number;
  full_name: string;
  phone_number: string | null;
  email: string | null;
}

const EmployeesManagement = () => {
  const location = useLocation();
  const { toast } = useToast();
  
  const { data: employees, loading, create, update, remove } = useSupabaseCRUD<EmployeeRecord>({
    tableName: 'employees',
    primaryKey: 'employee_id',
    initialFetch: true
  });

  const { data: branches } = useSupabaseCRUD<BranchRecord>({
    tableName: 'branches',
    primaryKey: 'branch_id',
    initialFetch: true
  });

  const { data: users } = useSupabaseCRUD<UserRecord>({
    tableName: 'users',
    primaryKey: 'user_id',
    initialFetch: true
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    branch_id: "",
    role_in_company: "",
    status: "active"
  });

  const filteredEmployees = employees.filter(employee => {
    const user = users.find(u => u.user_id === employee.user_id);
    const matchesSearch = user?.full_name?.includes(searchTerm) || 
                         user?.phone_number?.includes(searchTerm) || false;
    const matchesRole = filterRole === "all" || employee.role_in_company === filterRole;
    const matchesBranch = filterBranch === "all" || employee.branch_id?.toString() === filterBranch;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleSubmit = async () => {
    if (!formData.role_in_company || !formData.branch_id) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const employeeData = {
      user_id: formData.user_id ? parseInt(formData.user_id) : null,
      branch_id: parseInt(formData.branch_id),
      role_in_company: formData.role_in_company,
      status: formData.status
    };

    if (editingEmployee) {
      await update(editingEmployee.employee_id, employeeData);
    } else {
      await create(employeeData);
    }

    setFormData({ user_id: "", branch_id: "", role_in_company: "", status: "active" });
    setEditingEmployee(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (employee: EmployeeRecord) => {
    setEditingEmployee(employee);
    setFormData({
      user_id: employee.user_id?.toString() || "",
      branch_id: employee.branch_id?.toString() || "",
      role_in_company: employee.role_in_company || "",
      status: employee.status || "active"
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
  };

  const getRoleLabel = (value: string | null) => roles.find(r => r.value === value)?.label || value || "-";
  const getBranchName = (branchId: number | null) => branches.find(b => b.branch_id === branchId)?.branch_name || "-";
  const getUserName = (userId: number | null) => users.find(u => u.user_id === userId)?.full_name || "-";
  const getUserPhone = (userId: number | null) => users.find(u => u.user_id === userId)?.phone_number || "-";
  const getUserEmail = (userId: number | null) => users.find(u => u.user_id === userId)?.email || "-";

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "driver":
      case "assistant":
        return Bus;
      case "manager":
        return Shield;
      case "accountant":
        return CreditCard;
      case "support":
        return Users;
      case "supervisor":
        return Briefcase;
      default:
        return User;
    }
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
            <p className="text-xs text-sidebar-foreground/60">شركة السفر الذهبي</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === link.href
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
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" asChild>
            <Link to="/">
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">إدارة الموظفين</h1>
              <p className="text-sm text-muted-foreground">إضافة وإدارة موظفي الشركة</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingEmployee(null);
                  setFormData({ user_id: "", branch_id: "", role_in_company: "", status: "active" });
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
                    <Label>المستخدم</Label>
                    <Select value={formData.user_id} onValueChange={(v) => setFormData({...formData, user_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id.toString()}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الوظيفة *</Label>
                      <Select value={formData.role_in_company} onValueChange={(v) => setFormData({...formData, role_in_company: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوظيفة" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الفرع *</Label>
                      <Select value={formData.branch_id} onValueChange={(v) => setFormData({...formData, branch_id: v})}>
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
                    <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
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
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingEmployee ? "حفظ التغييرات" : "إضافة الموظف"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="بحث بالاسم أو رقم الجوال..."
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
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
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

          {/* Employees Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الموظف</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الوظيفة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفرع</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الجوال</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          لا يوجد موظفين
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => {
                        const RoleIcon = getRoleIcon(employee.role_in_company);
                        return (
                          <tr key={employee.employee_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{getUserName(employee.user_id)}</p>
                                  <p className="text-sm text-muted-foreground">{getUserEmail(employee.user_id)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <RoleIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground">{getRoleLabel(employee.role_in_company)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">{getBranchName(employee.branch_id)}</td>
                            <td className="py-4 px-4 text-muted-foreground">{getUserPhone(employee.user_id)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                employee.status === "active" 
                                  ? "bg-secondary/10 text-secondary" 
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {employee.status === "active" ? "نشط" : "غير نشط"}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                    <Edit className="w-4 h-4 ml-2" />
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(employee.employee_id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeesManagement;
