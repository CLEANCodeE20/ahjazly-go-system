import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, DollarSign, Users, CreditCard, Loader2,
  AlertCircle
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

/**
 * Financial Reports Page - Simplified Version
 * Note: analytics_daily_revenue and analytics_partner_performance views don't exist yet.
 * This page shows a placeholder until those views are created.
 */
const FinancialReports = () => {
  const [period, setPeriod] = useState('30days');
  const [isLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout
      title="التقارير المالية"
      subtitle="تحليل شامل للإيرادات والعمولات"
      actions={
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">آخر 7 أيام</SelectItem>
              <SelectItem value="30days">آخر 30 يوم</SelectItem>
              <SelectItem value="90days">آخر 3 أشهر</SelectItem>
              <SelectItem value="year">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards - Placeholder Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="إجمالي الإيرادات"
                value={formatCurrency(0)}
                icon={DollarSign}
                color="bg-primary"
                subtext="إجمالي قيمة الحجوزات المدفوعة"
              />
              <StatCard
                title="عمولة المنصة"
                value={formatCurrency(0)}
                icon={TrendingUp}
                color="bg-green-600"
                subtext="صافي ربح النظام"
              />
              <StatCard
                title="متوسط قيمة الحجز"
                value={formatCurrency(0)}
                icon={CreditCard}
                color="bg-purple-600"
              />
              <StatCard
                title="عدد الحجوزات"
                value="0"
                icon={Users}
                color="bg-blue-600"
              />
            </div>

            {/* Placeholder for Charts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  تحليل الإيرادات
                </CardTitle>
                <CardDescription>
                  تطور الإيرادات والعمولات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">ميزة قيد التطوير</h3>
                  <p className="text-muted-foreground max-w-md">
                    التقارير المالية المتقدمة غير متاحة حالياً.
                    سيتم تفعيل هذه الميزة قريباً مع إضافة جداول التحليلات المالية.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default FinancialReports;
