import { useState } from "react";
import {
    Activity,
    Search,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuditLog {
    id: number;
    table_name: string;
    record_id: string;
    action: string;
    old_data: any;
    new_data: any;
    changed_at: string;
    changed_by: string;
    user_email?: string;
}

/**
 * Audit Trails Page - Placeholder
 * Note: audit_logs table doesn't exist in the database yet.
 * This page shows a placeholder until the table is created.
 */
const AuditTrails = () => {
    const [logs] = useState<AuditLog[]>([]);
    const [loading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");

    return (
        <AdminLayout
            title="سجل العمليات"
            subtitle="تتبع جميع التغييرات والإجراءات في النظام"
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-card p-2 rounded-lg border w-full md:w-auto">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="بحث في السجل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-none shadow-none focus-visible:ring-0 w-64 h-8"
                        />
                    </div>

                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="تصفية حسب الإجراء" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">جميع الإجراءات</SelectItem>
                            <SelectItem value="INSERT">إضافة (INSERT)</SelectItem>
                            <SelectItem value="UPDATE">تحديث (UPDATE)</SelectItem>
                            <SelectItem value="DELETE">حذف (DELETE)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            سجل العمليات
                        </CardTitle>
                        <CardDescription>
                            تتبع جميع التغييرات في قاعدة البيانات
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">ميزة قيد التطوير</h3>
                                <p className="text-muted-foreground max-w-md">
                                    سجل العمليات غير متاح حالياً. سيتم تفعيل هذه الميزة قريباً 
                                    لتتبع جميع التغييرات والإجراءات في النظام.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default AuditTrails;
