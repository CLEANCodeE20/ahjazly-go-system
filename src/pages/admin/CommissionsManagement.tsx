import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  FileSpreadsheet,
  Receipt,
  Calendar
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSupabaseCRUD } from "@/hooks/useSupabaseCRUD";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Sidebar navigation for admin
const adminSidebarLinks = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/applications", label: "طلبات الشراكة", icon: FileText },
  { href: "/admin/partners", label: "الشركاء", icon: Building2 },
  { href: "/admin/commissions", label: "العمولات", icon: DollarSign },
  { href: "/admin/users", label: "المستخدمين", icon: Users },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings }
];

interface CommissionRecord {
  commission_id: number;
  booking_id: number | null;
  partner_id: number | null;
  trip_id: number | null;
  booking_amount: number | null;
  commission_percentage: number | null;
  commission_amount: number | null;
  partner_revenue: number | null;
  status: string | null;
  created_at: string | null;
}

interface PartnerRecord {
  partner_id: number;
  company_name: string;
  commission_percentage: number | null;
}

interface InvoiceRecord {
  invoice_id: number;
  partner_id: number | null;
  invoice_number: string | null;
  period_start: string | null;
  period_end: string | null;
  total_amount: number | null;
  platform_commission: number | null;
  partner_net: number | null;
  status: string | null;
  created_at: string | null;
}

import AdminSidebar from "@/components/layout/AdminSidebar";

const CommissionsManagement = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPartner, setFilterPartner] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const { data: commissions, loading } = useSupabaseCRUD<CommissionRecord>({
    tableName: 'commissions',
    primaryKey: 'commission_id',
    initialFetch: true
  });

  const { data: partners } = useSupabaseCRUD<PartnerRecord>({
    tableName: 'partners',
    primaryKey: 'partner_id',
    initialFetch: true
  });

  const { data: invoices, refetch: refetchInvoices } = useSupabaseCRUD<InvoiceRecord>({
    tableName: 'partner_invoices',
    primaryKey: 'invoice_id',
    initialFetch: true
  });

  // Calculate stats
  const stats = useMemo(() => {
    const confirmedCommissions = commissions.filter(c => c.status === 'confirmed');
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    const totalCommission = confirmedCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const pendingCommission = pendingCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
    const totalPartnerRevenue = confirmedCommissions.reduce((sum, b) => sum + (b.partner_revenue || 0), 0);

    return {
      totalCommission,
      pendingCommission,
      totalPartnerRevenue,
      totalBookings: commissions.length
    };
  }, [commissions]);

  // Filter commissions
  const filteredCommissions = commissions.filter(commission => {
    const partner = partners.find(p => p.partner_id === commission.partner_id);
    const matchesSearch = partner?.company_name?.includes(searchTerm) ||
      commission.booking_id?.toString().includes(searchTerm);
    const matchesStatus = filterStatus === "all" || commission.status === filterStatus;
    const matchesPartner = filterPartner === "all" || commission.partner_id?.toString() === filterPartner;
    return matchesSearch && matchesStatus && matchesPartner;
  });

  const getPartnerName = (partnerId: number | null) => {
    const partner = partners.find(p => p.partner_id === partnerId);
    return partner?.company_name || '-';
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> مؤكد</span>;
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> ملغي</span>;
      case "paid":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><DollarSign className="w-3 h-3" /> مدفوع</span>;
      default:
        return <span className="text-xs text-muted-foreground">{status || '-'}</span>;
    }
  };

  // Generate monthly invoice for partner
  const generateInvoice = async () => {
    if (!selectedPartner) return;

    setGeneratingInvoice(true);
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get commissions for this period
      const partnerCommissions = commissions.filter(c =>
        c.partner_id === selectedPartner.partner_id &&
        c.status === 'confirmed' &&
        c.created_at &&
        new Date(c.created_at) >= periodStart &&
        new Date(c.created_at) <= periodEnd
      );

      const totalAmount = partnerCommissions.reduce((sum, c) => sum + (c.booking_amount || 0), 0);
      const platformCommission = partnerCommissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const partnerNet = partnerCommissions.reduce((sum, c) => sum + (c.partner_revenue || 0), 0);

      const invoiceNumber = `INV-${selectedPartner.partner_id}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('partner_invoices')
        .insert({
          partner_id: selectedPartner.partner_id,
          invoice_number: invoiceNumber,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          total_amount: totalAmount,
          platform_commission: platformCommission,
          partner_net: partnerNet,
          status: 'pending',
          due_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

      if (error) throw error;

      toast.success("تم إنشاء الفاتورة بنجاح");
      refetchInvoices();
      setShowInvoiceDialog(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error("حدث خطأ أثناء إنشاء الفاتورة");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredCommissions.map(c => ({
      "رقم العمولة": c.commission_id,
      "رقم الحجز": c.booking_id,
      "الشركة": getPartnerName(c.partner_id),
      "مبلغ الحجز": c.booking_amount,
      "نسبة العمولة": `${c.commission_percentage}%`,
      "مبلغ العمولة": c.commission_amount,
      "إيراد الشريك": c.partner_revenue,
      "الحالة": c.status === 'confirmed' ? 'مؤكد' : c.status === 'pending' ? 'قيد الانتظار' : 'ملغي',
      "التاريخ": c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العمولات");
    XLSX.writeFile(wb, `تقرير_العمولات_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">إدارة العمولات</h1>
              <p className="text-sm text-muted-foreground">متابعة وإدارة عمولات المنصة</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel}>
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                تصدير Excel
              </Button>
              <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Receipt className="w-4 h-4 ml-2" />
                    إنشاء فاتورة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إنشاء فاتورة شهرية</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium">اختر الشركة</label>
                      <Select onValueChange={(value) => {
                        const partner = partners.find(p => p.partner_id.toString() === value);
                        setSelectedPartner(partner || null);
                      }}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="اختر شركة..." />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.map(partner => (
                            <SelectItem key={partner.partner_id} value={partner.partner_id.toString()}>
                              {partner.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedPartner && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">تفاصيل الفاتورة:</p>
                        <div className="space-y-1 text-sm">
                          <p>الشركة: <span className="font-medium">{selectedPartner.company_name}</span></p>
                          <p>نسبة العمولة: <span className="font-medium">{selectedPartner.commission_percentage || 10}%</span></p>
                          <p>الفترة: <span className="font-medium">الشهر السابق</span></p>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={generateInvoice}
                      disabled={!selectedPartner || generatingInvoice}
                    >
                      {generatingInvoice ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Receipt className="w-4 h-4 ml-2" />
                      )}
                      إنشاء الفاتورة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCommission.toLocaleString()} ر.س</p>
              <p className="text-sm text-muted-foreground">إجمالي العمولات</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingCommission.toLocaleString()} ر.س</p>
              <p className="text-sm text-muted-foreground">عمولات قيد الانتظار</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalPartnerRevenue.toLocaleString()} ر.س</p>
              <p className="text-sm text-muted-foreground">إيرادات الشركاء</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
              <p className="text-sm text-muted-foreground">إجمالي الحجوزات</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الحجز أو اسم الشركة..."
                  className="pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterPartner} onValueChange={setFilterPartner}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="الشركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الشركاء</SelectItem>
                  {partners.map(partner => (
                    <SelectItem key={partner.partner_id} value={partner.partner_id.toString()}>
                      {partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Commissions Table */}
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
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الحجز</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الشركة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">مبلغ الحجز</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">نسبة العمولة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">عمولة المنصة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">إيراد الشريك</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                          لا توجد عمولات
                        </td>
                      </tr>
                    ) : (
                      filteredCommissions.map((commission) => (
                        <tr key={commission.commission_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm font-medium text-primary">
                              BK-{commission.booking_id}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-foreground">
                              {getPartnerName(commission.partner_id)}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium">
                            {commission.booking_amount?.toLocaleString()} ر.س
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 rounded bg-muted text-sm">
                              {commission.commission_percentage}%
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-green-600">
                            {commission.commission_amount?.toLocaleString()} ر.س
                          </td>
                          <td className="py-4 px-4 font-medium text-blue-600">
                            {commission.partner_revenue?.toLocaleString()} ر.س
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(commission.status)}
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">
                            {commission.created_at ? new Date(commission.created_at).toLocaleDateString('ar-SA') : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices Section */}
          {invoices.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-foreground mb-4">الفواتير الشهرية</h2>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">رقم الفاتورة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الشركة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الفترة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">إجمالي المبلغ</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">عمولة المنصة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">صافي الشريك</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="py-4 px-4 font-mono text-sm text-primary">{invoice.invoice_number}</td>
                          <td className="py-4 px-4 font-medium">{getPartnerName(invoice.partner_id)}</td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">
                            {invoice.period_start} - {invoice.period_end}
                          </td>
                          <td className="py-4 px-4 font-medium">{invoice.total_amount?.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4 text-green-600 font-bold">{invoice.platform_commission?.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4 text-blue-600 font-medium">{invoice.partner_net?.toLocaleString()} ر.س</td>
                          <td className="py-4 px-4">{getStatusBadge(invoice.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CommissionsManagement;
