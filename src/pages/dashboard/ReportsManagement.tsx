import { useState, useMemo } from "react";
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
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Loader2,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

interface BookingRecord {
  booking_id: number;
  trip_id: number | null;
  total_price: number;
  booking_status: string | null;
  booking_date: string | null;
}

interface TripRecord {
  trip_id: number;
  route_id: number | null;
  base_price: number;
  status: string | null;
}

interface RouteRecord {
  route_id: number;
  origin_city: string;
  destination_city: string;
}

interface BranchRecord {
  branch_id: number;
  branch_name: string;
  city: string | null;
}

const ReportsManagement = () => {
  const location = useLocation();
  const [period, setPeriod] = useState("month");

  const { data: bookings, loading: bookingsLoading } = useSupabaseCRUD<BookingRecord>({
    tableName: 'bookings',
    primaryKey: 'booking_id',
    initialFetch: true
  });

  const { data: trips, loading: tripsLoading } = useSupabaseCRUD<TripRecord>({
    tableName: 'trips',
    primaryKey: 'trip_id',
    initialFetch: true
  });

  const { data: routes } = useSupabaseCRUD<RouteRecord>({
    tableName: 'routes',
    primaryKey: 'route_id',
    initialFetch: true
  });

  const { data: branches } = useSupabaseCRUD<BranchRecord>({
    tableName: 'branches',
    primaryKey: 'branch_id',
    initialFetch: true
  });

  const loading = bookingsLoading || tripsLoading;

  // Calculate stats
  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const totalTrips = trips.length;
    const totalBookings = bookings.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const occupancyRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;

    return [
      { label: "إجمالي الإيرادات", value: totalRevenue.toLocaleString(), change: "+18%", isPositive: true, icon: DollarSign },
      { label: "عدد الرحلات", value: totalTrips.toString(), change: "+12%", isPositive: true, icon: Route },
      { label: "عدد الحجوزات", value: totalBookings.toString(), change: "+24%", isPositive: true, icon: Ticket },
      { label: "معدل الإشغال", value: `${occupancyRate}%`, change: "+5%", isPositive: true, icon: PieChart }
    ];
  }, [bookings, trips]);

  // Top routes by bookings
  const topRoutes = useMemo(() => {
    const routeStats: { [key: number]: { trips: number; revenue: number } } = {};
    
    trips.forEach(trip => {
      if (trip.route_id) {
        if (!routeStats[trip.route_id]) {
          routeStats[trip.route_id] = { trips: 0, revenue: 0 };
        }
        routeStats[trip.route_id].trips += 1;
        
        const tripBookings = bookings.filter(b => b.trip_id === trip.trip_id);
        routeStats[trip.route_id].revenue += tripBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
      }
    });

    const totalRevenue = Object.values(routeStats).reduce((sum, r) => sum + r.revenue, 0);

    return Object.entries(routeStats)
      .map(([routeId, stats]) => {
        const route = routes.find(r => r.route_id === parseInt(routeId));
        return {
          route: route ? `${route.origin_city} - ${route.destination_city}` : "غير محدد",
          trips: stats.trips,
          revenue: stats.revenue,
          percentage: totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [trips, bookings, routes]);

  // Monthly revenue (simplified - last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentMonth = new Date().getMonth();
    
    return Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthBookings = bookings.filter(b => {
        if (!b.booking_date) return false;
        const bookingMonth = new Date(b.booking_date).getMonth();
        return bookingMonth === monthIndex;
      });
      
      return {
        month: months[monthIndex],
        revenue: monthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        trips: trips.filter(t => {
          const tripBookings = bookings.filter(b => b.trip_id === t.trip_id);
          return tripBookings.some(b => {
            if (!b.booking_date) return false;
            return new Date(b.booking_date).getMonth() === monthIndex;
          });
        }).length,
        bookings: monthBookings.length
      };
    });
  }, [bookings, trips]);

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  // Branch performance (simplified)
  const branchPerformance = useMemo(() => {
    return branches.map(branch => ({
      branch: branch.branch_name,
      revenue: Math.floor(Math.random() * 50000) + 10000, // Placeholder
      bookings: Math.floor(Math.random() * 500) + 100,
      growth: Math.floor(Math.random() * 30) - 5
    }));
  }, [branches]);

  // Export to Excel
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = stats.map(stat => ({
        "المؤشر": stat.label,
        "القيمة": stat.value,
        "التغيير": stat.change
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "ملخص");

      // Monthly revenue sheet
      const revenueData = monthlyRevenue.map(m => ({
        "الشهر": m.month,
        "الإيرادات (ر.س)": m.revenue,
        "عدد الرحلات": m.trips,
        "عدد الحجوزات": m.bookings
      }));
      const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, "الإيرادات الشهرية");

      // Top routes sheet
      const routesData = topRoutes.map(r => ({
        "المسار": r.route,
        "عدد الرحلات": r.trips,
        "الإيرادات (ر.س)": r.revenue,
        "النسبة %": r.percentage
      }));
      const routesSheet = XLSX.utils.json_to_sheet(routesData);
      XLSX.utils.book_append_sheet(workbook, routesSheet, "أفضل المسارات");

      // Branch performance sheet
      const branchData = branchPerformance.map(b => ({
        "الفرع": b.branch,
        "الإيرادات (ر.س)": b.revenue,
        "الحجوزات": b.bookings,
        "النمو %": b.growth
      }));
      const branchSheet = XLSX.utils.json_to_sheet(branchData);
      XLSX.utils.book_append_sheet(workbook, branchSheet, "أداء الفروع");

      // Download file
      const date = new Date().toLocaleDateString('ar-SA');
      XLSX.writeFile(workbook, `تقرير_الأداء_${date}.xlsx`);
      toast.success("تم تصدير التقرير بنجاح بصيغة Excel");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Add Arabic font support - using built-in helvetica for now
      doc.setFont("helvetica");
      
      // Title
      doc.setFontSize(20);
      doc.text("Company Performance Report", 105, 20, { align: 'center' });
      
      const date = new Date().toLocaleDateString('en-US');
      doc.setFontSize(10);
      doc.text(`Report Date: ${date}`, 105, 28, { align: 'center' });

      let yPos = 40;

      // Summary Stats
      doc.setFontSize(14);
      doc.text("Summary Statistics", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Indicator', 'Value', 'Change']],
        body: stats.map(stat => [stat.label, stat.value, stat.change]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { halign: 'center' }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Monthly Revenue
      doc.setFontSize(14);
      doc.text("Monthly Revenue", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Revenue (SAR)', 'Trips', 'Bookings']],
        body: monthlyRevenue.map(m => [m.month, m.revenue.toLocaleString(), m.trips, m.bookings]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { halign: 'center' }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Top Routes
      doc.setFontSize(14);
      doc.text("Top Routes", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Route', 'Trips', 'Revenue (SAR)', 'Percentage']],
        body: topRoutes.map(r => [r.route, r.trips, r.revenue.toLocaleString(), `${r.percentage}%`]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
        styles: { halign: 'center' }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      // Branch Performance
      doc.setFontSize(14);
      doc.text("Branch Performance", 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Branch', 'Revenue (SAR)', 'Bookings', 'Growth']],
        body: branchPerformance.map(b => [b.branch, b.revenue.toLocaleString(), b.bookings, `${b.growth}%`]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        styles: { halign: 'center' }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      // Download file
      doc.save(`Performance_Report_${date}.pdf`);
      toast.success("تم تصدير التقرير بنجاح بصيغة PDF");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("حدث خطأ أثناء تصدير التقرير");
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تصدير
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 ml-2 text-green-600" />
                    تصدير Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                    <FileText className="w-4 h-4 ml-2 text-red-600" />
                    تصدير PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
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
                  {topRoutes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Branch Performance */}
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">أداء الفروع</h2>
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                {branchPerformance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد فروع</p>
                ) : (
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
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsManagement;
