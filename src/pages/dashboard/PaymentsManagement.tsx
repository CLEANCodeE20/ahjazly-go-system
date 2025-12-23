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
  Search,
  MapPin,
  Ticket,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface PaymentRecord {
  payment_id: number;
  booking_id: number | null;
  user_id: number | null;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  gateway_name: string | null;
  gateway_ref: string | null;
  status: string | null;
  created_at: string | null;
}

interface BookingRecord {
  booking_id: number;
  trip_id: number | null;
  user_id: number | null;
  total_price: number;
}

interface UserRecord {
  user_id: number;
  full_name: string;
}

const PaymentsManagement = () => {
  const location = useLocation();
  
  const { data: payments, loading } = useSupabaseCRUD<PaymentRecord>({
    tableName: 'payment_transactions',
    primaryKey: 'payment_id',
    initialFetch: true
  });

  const { data: bookings } = useSupabaseCRUD<BookingRecord>({
    tableName: 'bookings',
    primaryKey: 'booking_id',
    initialFetch: true
  });

  const { data: users } = useSupabaseCRUD<UserRecord>({
    tableName: 'users',
    primaryKey: 'user_id',
    initialFetch: true
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");

  // Calculate stats
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const refundedAmount = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPayments = payments.filter(p => {
    const today = new Date().toISOString().split('T')[0];
    return p.created_at?.startsWith(today) && p.status === 'completed';
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    { label: "إجمالي الإيرادات", value: totalRevenue.toLocaleString(), icon: DollarSign, color: "text-secondary", trend: "+12%", trendUp: true },
    { label: "مدفوعات اليوم", value: todayPayments.toLocaleString(), icon: CreditCard, color: "text-primary", trend: "+8%", trendUp: true },
    { label: "قيد الانتظار", value: pendingAmount.toLocaleString(), icon: Clock, color: "text-accent", trend: "-5%", trendUp: false },
    { label: "مسترجعة", value: refundedAmount.toLocaleString(), icon: TrendingDown, color: "text-destructive", trend: "+2%", trendUp: true }
  ];

  const filteredPayments = payments.filter(payment => {
    const user = users.find(u => u.user_id === payment.user_id);
    const matchesSearch = user?.full_name?.includes(searchTerm) || 
                         payment.payment_id.toString().includes(searchTerm) ||
                         payment.gateway_ref?.includes(searchTerm) || false;
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    const matchesMethod = filterMethod === "all" || payment.payment_method === filterMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getUserName = (userId: number | null) => users.find(u => u.user_id === userId)?.full_name || "-";

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مكتمل</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      case "failed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> فشل</span>;
      case "refunded":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"><TrendingDown className="w-3 h-3" /> مسترجع</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status || "-"}</span>;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case "card": return "بطاقة ائتمان";
      case "cash": return "نقداً";
      case "wallet": return "محفظة";
      case "bank_transfer": return "تحويل بنكي";
      case "stc_pay": return "STC Pay";
      default: return method || "-";
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
              <h1 className="text-xl font-bold text-foreground">إدارة المدفوعات</h1>
              <p className="text-sm text-muted-foreground">متابعة وإدارة جميع المعاملات المالية</p>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 ml-2" />
              تصدير التقرير
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? "text-secondary" : "text-destructive"}`}>
                    {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trend}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value} ر.س</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="بحث برقم العملية أو اسم المسافر..."
                  className="pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="failed">فشل</SelectItem>
                  <SelectItem value="refunded">مسترجع</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الطرق</SelectItem>
                  <SelectItem value="card">بطاقة ائتمان</SelectItem>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="wallet">محفظة</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="stc_pay">STC Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payments Table */}
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم العملية</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الحجز</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المسافر</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المبلغ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">طريقة الدفع</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          لا توجد مدفوعات
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.payment_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-medium text-primary">PAY-{payment.payment_id}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm text-muted-foreground">
                              {payment.booking_id ? `BK-${payment.booking_id}` : "-"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-foreground">{getUserName(payment.user_id)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-bold text-foreground">{payment.amount} {payment.currency || "ر.س"}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs">
                              {getPaymentMethodLabel(payment.payment_method)}
                            </span>
                          </td>
                          <td className="py-4 px-4">{getStatusBadge(payment.status)}</td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">
                            {payment.created_at ? new Date(payment.created_at).toLocaleDateString('ar-SA') : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">عرض {filteredPayments.length} من {payments.length} عملية</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>السابق</Button>
                <Button variant="outline" size="sm">التالي</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentsManagement;
