import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  MapPin,
  Ticket,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Summary stats
const summaryStats = [
  { label: "إجمالي الإيرادات", value: "152,430", change: "+18%", isPositive: true, icon: DollarSign },
  { label: "عدد الرحلات", value: "486", change: "+12%", isPositive: true, icon: Route },
  { label: "عدد الحجوزات", value: "3,247", change: "+24%", isPositive: true, icon: Ticket },
  { label: "معدل الإشغال", value: "78%", change: "+5%", isPositive: true, icon: PieChart }
];

// Monthly revenue data
const monthlyRevenue = [
  { month: "يناير", revenue: 42500, trips: 85, bookings: 580 },
  { month: "فبراير", revenue: 38200, trips: 72, bookings: 490 },
  { month: "مارس", revenue: 45800, trips: 92, bookings: 620 },
  { month: "أبريل", revenue: 51200, trips: 105, bookings: 710 },
  { month: "مايو", revenue: 48900, trips: 98, bookings: 650 },
  { month: "يونيو", revenue: 55300, trips: 112, bookings: 780 }
];

// Top routes
const topRoutes = [
  { route: "الرياض - جدة", trips: 145, revenue: 45200, percentage: 35 },
  { route: "الرياض - الدمام", trips: 98, revenue: 28400, percentage: 22 },
  { route: "جدة - مكة", trips: 85, revenue: 21500, percentage: 17 },
  { route: "جدة - المدينة", trips: 72, revenue: 18600, percentage: 14 },
  { route: "الرياض - القصيم", trips: 56, revenue: 12300, percentage: 12 }
];

// Branch performance
const branchPerformance = [
  { branch: "الفرع الرئيسي - الرياض", revenue: 68500, bookings: 1250, growth: 15 },
  { branch: "فرع جدة", revenue: 45200, bookings: 820, growth: 22 },
  { branch: "فرع الدمام", revenue: 28400, bookings: 510, growth: 8 },
  { branch: "فرع مكة", revenue: 18300, bookings: 340, growth: -5 }
];

const ReportsManagement = () => {
  const location = useLocation();
  const [period, setPeriod] = useState("month");

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

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
              <h1 className="text-xl font-bold text-foreground">التقارير والإحصائيات</h1>
              <p className="text-sm text-muted-foreground">نظرة شاملة على أداء الشركة</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                  <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                  <SelectItem value="year">آخر سنة</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {summaryStats.map((stat, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${stat.isPositive ? "text-secondary" : "text-destructive"}`}>
                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground">الإيرادات الشهرية</h2>
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {monthlyRevenue.map((month, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-16 text-sm text-muted-foreground">{month.month}</span>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-lg transition-all duration-500"
                        style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-sm font-medium text-foreground text-left">
                      {month.revenue.toLocaleString()} ر.س
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Routes */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-foreground">أفضل المسارات</h2>
                <Route className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {topRoutes.map((route, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{route.route}</span>
                        <span className="text-sm text-muted-foreground">{route.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-secondary rounded-full"
                          style={{ width: `${route.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{route.trips} رحلة</span>
                        <span>{route.revenue.toLocaleString()} ر.س</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Branch Performance */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">أداء الفروع</h2>
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفرع</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإيرادات</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحجوزات</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">النمو</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الأداء</th>
                  </tr>
                </thead>
                <tbody>
                  {branchPerformance.map((branch, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{branch.branch}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-foreground">{branch.revenue.toLocaleString()} ر.س</td>
                      <td className="py-4 px-4 text-muted-foreground">{branch.bookings}</td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-1 text-sm font-medium ${branch.growth >= 0 ? "text-secondary" : "text-destructive"}`}>
                          {branch.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {branch.growth >= 0 ? "+" : ""}{branch.growth}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${branch.growth >= 0 ? "bg-secondary" : "bg-destructive"}`}
                            style={{ width: `${Math.min(Math.abs(branch.growth) * 4, 100)}%` }}
                          />
                        </div>
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

export default ReportsManagement;
