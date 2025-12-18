import { useState } from "react";
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
  Briefcase
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

// Branches
const branches = [
  { value: "riyadh", label: "الفرع الرئيسي - الرياض" },
  { value: "jeddah", label: "فرع جدة" },
  { value: "dammam", label: "فرع الدمام" },
  { value: "makkah", label: "فرع مكة" }
];

// Sample employees data
const initialEmployees = [
  { 
    id: 1, 
    name: "عبدالله محمد الشمري", 
    nationalId: "1098765432",
    phone: "0501234567",
    email: "abdullah@example.com",
    role: "driver",
    branch: "riyadh",
    salary: 5000,
    joinDate: "2023-01-15",
    status: "active"
  },
  { 
    id: 2, 
    name: "سعود خالد العتيبي", 
    nationalId: "1087654321",
    phone: "0512345678",
    email: "saud@example.com",
    role: "driver",
    branch: "jeddah",
    salary: 4800,
    joinDate: "2023-03-20",
    status: "active"
  },
  { 
    id: 3, 
    name: "فهد سلمان القحطاني", 
    nationalId: "1076543210",
    phone: "0523456789",
    email: "fahad@example.com",
    role: "assistant",
    branch: "riyadh",
    salary: 3500,
    joinDate: "2023-06-10",
    status: "active"
  },
  { 
    id: 4, 
    name: "أحمد علي السعيد", 
    nationalId: "1065432109",
    phone: "0534567890",
    email: "ahmed@example.com",
    role: "manager",
    branch: "riyadh",
    salary: 8000,
    joinDate: "2022-11-01",
    status: "active"
  },
  { 
    id: 5, 
    name: "محمد ناصر الحربي", 
    nationalId: "1054321098",
    phone: "0545678901",
    email: "mohammed@example.com",
    role: "accountant",
    branch: "jeddah",
    salary: 6000,
    joinDate: "2023-02-15",
    status: "inactive"
  },
  { 
    id: 6, 
    name: "خالد عبدالرحمن المطيري", 
    nationalId: "1043210987",
    phone: "0556789012",
    email: "khalid@example.com",
    role: "support",
    branch: "dammam",
    salary: 4000,
    joinDate: "2023-08-20",
    status: "active"
  }
];

const EmployeesManagement = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof initialEmployees[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phone: "",
    email: "",
    role: "",
    branch: "",
    salary: ""
  });

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.includes(searchTerm) || 
                         employee.nationalId.includes(searchTerm) ||
                         employee.phone.includes(searchTerm);
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    const matchesBranch = filterBranch === "all" || employee.branch === filterBranch;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.nationalId || !formData.phone || !formData.role || !formData.branch) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (editingEmployee) {
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id 
          ? { ...e, ...formData, salary: Number(formData.salary) }
          : e
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الموظف بنجاح"
      });
    } else {
      const newEmployee = {
        id: Date.now(),
        ...formData,
        salary: Number(formData.salary),
        joinDate: new Date().toISOString().split('T')[0],
        status: "active" as const
      };
      setEmployees([...employees, newEmployee]);
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة الموظف الجديد بنجاح"
      });
    }

    setFormData({ name: "", nationalId: "", phone: "", email: "", role: "", branch: "", salary: "" });
    setEditingEmployee(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (employee: typeof initialEmployees[0]) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      nationalId: employee.nationalId,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      branch: employee.branch,
      salary: employee.salary.toString()
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setEmployees(employees.filter(e => e.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الموظف بنجاح"
    });
  };

  const getRoleLabel = (value: string) => roles.find(r => r.value === value)?.label || value;
  const getBranchLabel = (value: string) => branches.find(b => b.value === value)?.label || value;

  const getRoleIcon = (role: string) => {
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
                  setFormData({ name: "", nationalId: "", phone: "", email: "", role: "", branch: "", salary: "" });
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
                      placeholder="الاسم الرباعي"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهوية *</Label>
                      <Input 
                        placeholder="10xxxxxxxx"
                        value={formData.nationalId}
                        onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الجوال *</Label>
                      <Input 
                        placeholder="05xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input 
                      type="email"
                      placeholder="employee@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الوظيفة *</Label>
                      <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
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
                      <Select value={formData.branch} onValueChange={(v) => setFormData({...formData, branch: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفرع" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.value} value={branch.value}>
                              {branch.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>الراتب الشهري (ريال)</Label>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    />
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
                placeholder="بحث بالاسم أو رقم الهوية..."
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
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employees Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الموظف</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الهوية</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الوظيفة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفرع</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الجوال</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الراتب</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const RoleIcon = getRoleIcon(employee.role);
                    return (
                      <tr key={employee.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{employee.name}</p>
                              <p className="text-xs text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground" dir="ltr">{employee.nationalId}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="w-4 h-4 text-primary" />
                            <span className="text-foreground">{getRoleLabel(employee.role)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{getBranchLabel(employee.branch)}</td>
                        <td className="py-4 px-4 text-muted-foreground" dir="ltr">{employee.phone}</td>
                        <td className="py-4 px-4 text-muted-foreground">{employee.salary.toLocaleString()} ريال</td>
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
                              <button className="p-1 text-muted-foreground hover:text-foreground">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                <Edit className="w-4 h-4 ml-2" />
                                تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(employee.id)}
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">لا يوجد موظفين</h3>
                <p className="text-muted-foreground mb-4">لم يتم العثور على موظفين مطابقين للبحث</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeesManagement;
