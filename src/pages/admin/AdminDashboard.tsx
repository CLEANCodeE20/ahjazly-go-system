import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    const { count: pendingCount } = await supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: approvedCount } = await supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved');
    const { count: rejectedCount } = await supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected');
    const { count: totalCount } = await supabase.from('partner_applications').select('*', { count: 'exact', head: true });

    setStats({
      pending: pendingCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      total: totalCount || 0
    });
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "طلبات جديدة", value: stats.pending, icon: Clock, color: "text-accent", bg: "bg-accent/10" },
    { label: "طلبات مقبولة", value: stats.approved, icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "طلبات مرفوضة", value: stats.rejected, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "إجمالي الطلبات", value: stats.total, icon: FileText, color: "text-primary", bg: "bg-primary/10" }
  ];

  return (
    <AdminLayout
      title="لوحة التحكم"
      subtitle="نظرة عامة على النظام"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/partners?tab=applications')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">إجراءات سريعة</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/partners?tab=applications')}>
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <span>مراجعة الطلبات</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/partners')}>
            <div className="p-3 bg-secondary/10 rounded-full">
              <Building2 className="w-6 h-6 text-secondary" />
            </div>
            <span>إدارة الشركاء</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" onClick={() => navigate('/admin/users')}>
            <div className="p-3 bg-accent/10 rounded-full">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <span>إدارة المستخدمين</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
