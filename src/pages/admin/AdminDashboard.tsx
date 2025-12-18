import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bus, 
  Building2, 
  FileText, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search,
  Bell,
  LogOut,
  Eye,
  Mail,
  MoreVertical
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock data for applications
const mockApplications = [
  {
    id: 1,
    companyName: "شركة السفر الذهبي",
    ownerName: "محمد أحمد",
    email: "golden@travel.com",
    phone: "0501234567",
    city: "الرياض",
    fleetSize: 25,
    status: "pending",
    submittedAt: "2024-01-15"
  },
  {
    id: 2,
    companyName: "النقل السريع",
    ownerName: "خالد عبدالله",
    email: "fast@transport.com",
    phone: "0509876543",
    city: "جدة",
    fleetSize: 15,
    status: "pending",
    submittedAt: "2024-01-14"
  },
  {
    id: 3,
    companyName: "رحلات المملكة",
    ownerName: "سعد محمد",
    email: "kingdom@trips.com",
    phone: "0551112233",
    city: "الدمام",
    fleetSize: 30,
    status: "approved",
    submittedAt: "2024-01-10"
  },
  {
    id: 4,
    companyName: "الأمل للنقل",
    ownerName: "عمر حسن",
    email: "amal@transport.com",
    phone: "0544556677",
    city: "مكة",
    fleetSize: 8,
    status: "rejected",
    submittedAt: "2024-01-08"
  }
];

const stats = [
  { label: "طلبات جديدة", value: 12, icon: Clock, color: "text-accent" },
  { label: "شركات مفعلة", value: 156, icon: CheckCircle2, color: "text-secondary" },
  { label: "طلبات مرفوضة", value: 8, icon: XCircle, color: "text-destructive" },
  { label: "إجمالي الطلبات", value: 176, icon: FileText, color: "text-primary" }
];

const AdminDashboard = () => {
  const [applications, setApplications] = useState(mockApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleApprove = (id: number) => {
    setApplications(apps => 
      apps.map(app => app.id === id ? { ...app, status: "approved" } : app)
    );
    toast({
      title: "تمت الموافقة",
      description: "تم قبول طلب الشركة وإرسال بريد إلكتروني بالتفاصيل",
    });
  };

  const handleReject = (id: number) => {
    setApplications(apps => 
      apps.map(app => app.id === id ? { ...app, status: "rejected" } : app)
    );
    toast({
      title: "تم الرفض",
      description: "تم رفض طلب الشركة وإخطارها بالقرار",
      variant: "destructive"
    });
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.companyName.includes(searchQuery) || 
                         app.ownerName.includes(searchQuery) ||
                         app.email.includes(searchQuery);
    const matchesFilter = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مقبول</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground p-4 hidden lg:block">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Bus className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold">احجزلي</span>
            <p className="text-xs text-sidebar-foreground/60">لوحة الإدارة</p>
          </div>
        </div>

        <nav className="space-y-1">
          <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <FileText className="w-5 h-5" />
            <span>طلبات الانضمام</span>
          </Link>
          <Link to="/admin/companies" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
            <Building2 className="w-5 h-5" />
            <span>الشركات المسجلة</span>
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
            <Users className="w-5 h-5" />
            <span>المستخدمين</span>
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
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
            <h1 className="text-xl font-bold text-foreground">طلبات الانضمام</h1>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                م
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث عن شركة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === "all" && "الكل"}
                    {status === "pending" && "قيد المراجعة"}
                    {status === "approved" && "مقبول"}
                    {status === "rejected" && "مرفوض"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الشركة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المالك</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المدينة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الأسطول</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.companyName}</p>
                            <p className="text-sm text-muted-foreground">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-foreground">{app.ownerName}</td>
                      <td className="py-4 px-4 text-muted-foreground">{app.city}</td>
                      <td className="py-4 px-4 text-muted-foreground">{app.fleetSize} حافلة</td>
                      <td className="py-4 px-4">{getStatusBadge(app.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">{app.submittedAt}</td>
                      <td className="py-4 px-4">
                        {app.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="success" onClick={() => handleApprove(app.id)}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(app.id)}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
