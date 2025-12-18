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
  Ticket
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// Sample branches data
const initialBranches = [
  { 
    id: 1, 
    name: "الفرع الرئيسي - الرياض", 
    city: "الرياض",
    address: "شارع الملك فهد، حي العليا",
    phone: "0112345678",
    email: "riyadh@example.com",
    manager: "أحمد السعيد",
    employees: 15,
    status: "active"
  },
  { 
    id: 2, 
    name: "فرع جدة", 
    city: "جدة",
    address: "شارع التحلية، حي الروضة",
    phone: "0123456789",
    email: "jeddah@example.com",
    manager: "محمد العلي",
    employees: 10,
    status: "active"
  },
  { 
    id: 3, 
    name: "فرع الدمام", 
    city: "الدمام",
    address: "شارع الملك سعود، حي الفيصلية",
    phone: "0134567890",
    email: "dammam@example.com",
    manager: "سعد الحربي",
    employees: 8,
    status: "active"
  },
  { 
    id: 4, 
    name: "فرع مكة", 
    city: "مكة المكرمة",
    address: "شارع أجياد، حي العزيزية",
    phone: "0125678901",
    email: "makkah@example.com",
    manager: "خالد المطيري",
    employees: 12,
    status: "inactive"
  }
];

const BranchesManagement = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [branches, setBranches] = useState(initialBranches);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<typeof initialBranches[0] | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    manager: ""
  });

  const filteredBranches = branches.filter(branch => 
    branch.name.includes(searchTerm) || 
    branch.city.includes(searchTerm) ||
    branch.manager.includes(searchTerm)
  );

  const handleSubmit = () => {
    if (!formData.name || !formData.city || !formData.address) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (editingBranch) {
      setBranches(branches.map(b => 
        b.id === editingBranch.id 
          ? { ...b, ...formData }
          : b
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات الفرع بنجاح"
      });
    } else {
      const newBranch = {
        id: Date.now(),
        ...formData,
        employees: 0,
        status: "active" as const
      };
      setBranches([...branches, newBranch]);
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة الفرع الجديد بنجاح"
      });
    }

    setFormData({ name: "", city: "", address: "", phone: "", email: "", manager: "" });
    setEditingBranch(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (branch: typeof initialBranches[0]) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setBranches(branches.filter(b => b.id !== id));
    toast({
      title: "تم الحذف",
      description: "تم حذف الفرع بنجاح"
    });
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
              <h1 className="text-xl font-bold text-foreground">إدارة الفروع</h1>
              <p className="text-sm text-muted-foreground">إضافة وإدارة فروع الشركة</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingBranch(null);
                  setFormData({ name: "", city: "", address: "", phone: "", email: "", manager: "" });
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
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المدينة *</Label>
                    <Input 
                      placeholder="مثال: الرياض"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان التفصيلي *</Label>
                    <Textarea 
                      placeholder="الشارع، الحي، رقم المبنى..."
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input 
                        placeholder="05xxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input 
                        type="email"
                        placeholder="branch@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>مدير الفرع</Label>
                    <Input 
                      placeholder="اسم مدير الفرع"
                      value={formData.manager}
                      onChange={(e) => setFormData({...formData, manager: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editingBranch ? "حفظ التغييرات" : "إضافة الفرع"}
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
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="بحث عن فرع..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBranches.map((branch) => (
              <div key={branch.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-elegant transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{branch.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        branch.status === "active" 
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
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(branch.id)}
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
                    <span>{branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{branch.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{branch.employees} موظف</span>
                  </div>
                  <span className="text-sm text-muted-foreground">المدير: {branch.manager}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredBranches.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">لا توجد فروع</h3>
              <p className="text-muted-foreground mb-4">لم يتم العثور على فروع مطابقة للبحث</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchesManagement;
