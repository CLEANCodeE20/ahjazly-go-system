import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Bell,
  Eye,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface PartnerApplication {
  application_id: number;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_id_number: string | null;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_city: string;
  fleet_size: number | null;
  commercial_register_url: string | null;
  tax_certificate_url: string | null;
  description: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  auth_user_id: string | null;
  tax_number: string | null;
  website: string | null;
  // Bank fields removed
  commercial_registration: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الطلبات",
        variant: "destructive"
      });
    } else {
      setApplications(data as any[] || []);
    }
    setLoading(false);
  };

  const handleApprove = async (application: PartnerApplication) => {
    setProcessing(true);
    try {
      // 1. Create partner record
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          company_name: application.company_name,
          contact_person: application.owner_name,
          address: application.company_address
            ? `${application.company_address}, ${application.company_city}`
            : application.company_city,
          status: 'approved',
          commission_percentage: 10,
          manager_auth_id: application.auth_user_id || null,
          commercial_registration: application.commercial_registration,
          tax_number: application.tax_number,
          website: application.website,
          // Bank details removed - collected after approval
          commercial_register_url: application.commercial_register_url,
          tax_certificate_url: application.tax_certificate_url
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // 2. If user has auth account, assign role
      if (application.auth_user_id) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            auth_id: application.auth_user_id,
            role: 'PARTNER_ADMIN',
            partner_id: partner.partner_id
          } as any);

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }

        // 2.1 Update user status to active
        const { error: statusError } = await supabase
          .from('users')
          .update({ account_status: 'active' })
          .eq('auth_id', application.auth_user_id);

        if (statusError) {
          console.error('Error activating user account:', statusError);
        }

        // 2.2 Update documents to verified and link to partner_id
        const { error: docError } = await supabase
          .from('documents')
          .update({
            partner_id: partner.partner_id,
            verification_status: 'approved'
          } as any)
          .eq('auth_id', application.auth_user_id);

        if (docError) {
          console.error('Error updating documents status:', docError);
        }
      }

      // 3. Update application status
      const { error: updateError } = await supabase
        .from('partner_applications')
        .update({
          status: 'approved',
          partner_id: partner.partner_id,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('application_id', application.application_id);

      if (updateError) throw updateError;

      toast({
        title: "تمت الموافقة",
        description: "تم قبول طلب الشركة وإنشاء الحساب بنجاح",
      });

      setViewDialogOpen(false);
      fetchApplications();

    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في الموافقة على الطلب",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال سبب الرفض",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('partner_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('application_id', selectedApplication.application_id);

      if (error) throw error;

      toast({
        title: "تم الرفض",
        description: "تم رفض طلب الشركة وإخطارها بالقرار",
      });

      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason("");
      fetchApplications();

    } catch (error: any) {
      console.error('Error rejecting application:', error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في رفض الطلب",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.company_name?.includes(searchQuery) ||
      app.owner_name?.includes(searchQuery) ||
      app.owner_email?.includes(searchQuery);
    const matchesFilter = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;
  const totalCount = applications.length;

  const stats = [
    { label: "طلبات جديدة", value: pendingCount, icon: Clock, color: "text-accent" },
    { label: "طلبات مقبولة", value: approvedCount, icon: CheckCircle2, color: "text-secondary" },
    { label: "طلبات مرفوضة", value: rejectedCount, icon: XCircle, color: "text-destructive" },
    { label: "إجمالي الطلبات", value: totalCount, icon: FileText, color: "text-primary" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case "under_review":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"><Eye className="w-3 h-3" /> قيد الفحص</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"><CheckCircle2 className="w-3 h-3" /> مقبول</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive"><XCircle className="w-3 h-3" /> مرفوض</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="طلبات الانضمام"
      actions={
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      }
    >
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
              placeholder="بحث عن شركة أو مالك..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">المدينة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">عدد الحافلات</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الحالة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">التاريخ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">لا توجد طلبات انضمام حالياً</p>
                        <p className="text-sm">سيتم عرض جميع الطلبات الجديدة هنا للمراجعة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.application_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.company_name}</p>
                            <p className="text-xs text-muted-foreground">{app.owner_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-foreground">{app.owner_name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{app.company_city}</td>
                      <td className="py-4 px-4 text-muted-foreground">{app.fleet_size || "-"}</td>
                      <td className="py-4 px-4">{getStatusBadge(app.status)}</td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">
                        {new Date(app.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedApplication(app);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {app.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(app)}
                                className="bg-secondary hover:bg-secondary/90"
                                disabled={processing}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={processing}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Application Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الانضمام</DialogTitle>
            <DialogDescription>
              معلومات الطلب المقدم من {selectedApplication?.owner_name}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">حالة الطلب</span>
                {getStatusBadge(selectedApplication.status)}
              </div>

              {/* Owner Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  معلومات المالك
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">الاسم</p>
                    <p className="text-foreground font-medium">{selectedApplication.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">رقم الهوية</p>
                    <p className="text-foreground font-medium">{selectedApplication.owner_id_number || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{selectedApplication.owner_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <p className="text-foreground">{selectedApplication.owner_phone}</p>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  معلومات الشركة
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">اسم الشركة</p>
                    <p className="text-foreground font-medium">{selectedApplication.company_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المدينة</p>
                    <p className="text-foreground font-medium">{selectedApplication.company_city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">عدد الحافلات</p>
                    <p className="text-foreground font-medium">{selectedApplication.fleet_size || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">البريد الرسمي</p>
                    <p className="text-foreground font-medium">{selectedApplication.company_email || "-"}</p>
                  </div>
                  {selectedApplication.company_address && (
                    <div className="col-span-2 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-foreground">{selectedApplication.company_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  الوثائق المرفقة
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedApplication.commercial_register_url ? (
                    <a
                      href={selectedApplication.commercial_register_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">السجل التجاري</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">لم يتم رفع السجل التجاري</span>
                  )}
                  {selectedApplication.tax_certificate_url ? (
                    <a
                      href={selectedApplication.tax_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">شهادة الزكاة</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">لم يتم رفع شهادة الزكاة</span>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {selectedApplication.description && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">معلومات إضافية</h3>
                  <p className="text-sm text-muted-foreground">{selectedApplication.description}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
                  <h3 className="font-medium text-destructive mb-2">سبب الرفض</h3>
                  <p className="text-sm text-foreground">{selectedApplication.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedApplication?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={processing}
                >
                  رفض الطلب
                </Button>
                <Button
                  onClick={() => selectedApplication && handleApprove(selectedApplication)}
                  disabled={processing}
                  className="bg-secondary hover:bg-secondary/90"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  )}
                  قبول الطلب
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب الانضمام</DialogTitle>
            <DialogDescription>
              يرجى إدخال سبب رفض طلب {selectedApplication?.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">سبب الرفض *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب رفض الطلب..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <XCircle className="w-4 h-4 ml-2" />
              )}
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDashboard;
