import { useState, useEffect } from "react";
import {
    Activity,
    Search,
    Filter,
    FileText,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

interface AuditLog {
    id: number;
    table_name: string;
    record_id: string;
    action: string;
    old_data: any;
    new_data: any;
    changed_at: string;
    changed_by: string; // uuid
    user_email?: string; // joined or fetched
}

const AuditTrails = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const { exportToExcel, exportToPDF } = useExport();

    useEffect(() => {
        fetchLogs();
    }, [actionFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('changed_at', { ascending: false })
            .limit(100);

        if (actionFilter !== 'all') {
            query = query.eq('action', actionFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching audit logs:', error);
        } else {
            // Fetch user emails manually or via view if joined
            // For now, simpler to just start with raw data
            // We can optimize with a view later
            setLogs(data as AuditLog[] || []);
        }
        setLoading(false);
    };

    const handleExport = (type: 'excel' | 'pdf') => {
        const dataToExport = logs.map(l => ({
            'الجدول': l.table_name,
            'الإجراء': l.action,
            'المستخدم': l.changed_by, // Should replace with name if available
            'التاريخ': new Date(l.changed_at).toLocaleString('ar-SA'),
            'التفاصيل': JSON.stringify(l.new_data)
        }));

        if (type === 'excel') {
            exportToExcel(dataToExport, 'audit_log');
        } else {
            exportToPDF(
                dataToExport,
                [
                    { header: 'الجدول', key: 'الجدول' },
                    { header: 'الإجراء', key: 'الإجراء' },
                    { header: 'التاريخ', key: 'التاريخ' },
                    { header: 'المستخدم', key: 'المستخدم' }
                ],
                { title: 'سجل العمليات' }
            );
        }
    };

    const filteredLogs = logs.filter(log =>
        JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout
            title="سجل العمليات"
            subtitle="تتبع جميع التغييرات والإجراءات في النظام"
            actions={
                <Button variant="outline" onClick={() => handleExport('excel')}>
                    تصدير Excel
                </Button>
            }
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

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">الجدول</TableHead>
                                    <TableHead className="text-right">الإجراء</TableHead>
                                    <TableHead className="text-right">التغييرات</TableHead>
                                    <TableHead className="text-right">المستخدم</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            لا توجد سجلات مطابقة
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs" dir="ltr">
                                                {format(new Date(log.changed_at), "dd/MM/yyyy HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium bg-muted px-2 py-1 rounded text-xs">
                                                    {log.table_name}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                                                    ${log.action === 'INSERT' ? 'bg-green-100 text-green-700' :
                                                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-xs text-muted-foreground" title={JSON.stringify(log.new_data, null, 2)}>
                                                {JSON.stringify(log.new_data).substring(0, 100)}...
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">
                                                {log.changed_by}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};
export default AuditTrails;
