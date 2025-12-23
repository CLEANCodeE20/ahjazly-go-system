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
  MoreVertical,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";

interface PartnerRecord {
  partner_id: number;
  company_name: string;
  contact_person: string | null;
  address: string | null;
  status: string | null;
  commission_percentage: number | null;
  created_at: string | null;
}

const AdminDashboard = () => {
  const { data: partners, loading, update } = useSupabaseCRUD<PartnerRecord>({
    tableName: 'partners',
    primaryKey: 'partner_id',
    initialFetch: true
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleApprove = async (id: number) => {
    await update(id, { status: 'approved' });
    toast({
      title: "تمت الموافقة",
      description: "تم قبول طلب الشركة وإرسال بريد إلكتروني بالتفاصيل",
    });
  };

  const handleReject = async (id: number) => {
    await update(id, { status: 'rejected' });
    toast({
      title: "تم الرفض",
      description: "تم رفض طلب الشركة وإخطارها بالقرار",
      variant: "destructive"
    });
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.company_name?.includes(searchQuery) || 
                         partner.contact_person?.includes(searchQuery) || false;
    const matchesFilter = filterStatus === "all" || partner.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const pendingCount = partners.filter(p => p.status === 'pending').length;
  const approvedCount = partners.filter(p => p.status === 'approved').length;
  const rejectedCount = partners.filter(p => p.status === 'rejected').length;
  const totalCount = partners.length;

  const stats = [
    { label: "طلبات جديدة", value: pendingCount, icon: Clock, color: "text-accent" },
    { label: "شركات مفعلة", value: approvedCount, icon: CheckCircle2, color: "text-secondary" },
    { label: "طلبات مرفوضة", value: rejectedCount, icon: XCircle, color: "text-destructive" },
    { label: "إجمالي الطلبات", value: totalCount, icon: FileText, color: "text-primary" }
  ];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مقبول</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status || "-"}</span>;
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
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
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

          {/* Partners Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الشركة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المالك</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">العنوان</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">العمولة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPartners.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          لا توجد طلبات
                        </td>
                      </tr>
                    ) : (
                      filteredPartners.map((partner) => (
                        <tr key={partner.partner_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{partner.company_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-foreground">{partner.contact_person || "-"}</td>
                          <td className="py-4 px-4 text-muted-foreground">{partner.address || "-"}</td>
                          <td className="py-4 px-4 text-muted-foreground">{partner.commission_percentage || 10}%</td>
                          <td className="py-4 px-4">{getStatusBadge(partner.status)}</td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">
                            {partner.created_at ? new Date(partner.created_at).toLocaleDateString('ar-SA') : "-"}
                          </td>
                          <td className="py-4 px-4">
                            {partner.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="default" onClick={() => handleApprove(partner.partner_id)} className="bg-secondary hover:bg-secondary/90">
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(partner.partner_id)}>
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
                      ))
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

export default AdminDashboard;
